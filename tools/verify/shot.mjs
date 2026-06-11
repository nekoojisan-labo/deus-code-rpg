#!/usr/bin/env node
// =============================================================================
// deus-code-rpg モバイル再現スクリーンショットハーネス
//
// 使い方:  node tools/verify/shot.mjs
//
// - 依存ゼロ (Node v24 / グローバル fetch・WebSocket 使用。npm install 不要)
// - リポジトリルートを簡易HTTPサーバで配信し、Edge を headless + CDP で起動
// - モバイル (390x844 dpr2) とデスクトップ (1280x800) の両ビューポートで
//   ゲームの各状態を撮影し tools/verify/shots/ に保存する
// =============================================================================

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 設定: 撮影する状態リスト（ここを増減すれば撮影対象を変えられる）
// 注意: 状態は同一ページ内で順に遷移させるため、配列の順序が進行順。
//       各 driver は前提状態を自前で整える (ensureGame 等) ので
//       一部だけ残しても動くが、title は必ず先頭に置くこと。
// ---------------------------------------------------------------------------
const STATES = ['title', 'opening', 'dialog', 'field', 'battle'];

// 撮影ビューポート
const VIEWPORTS = [
    { name: 'mobile',  width: 390,  height: 844, deviceScaleFactor: 2, mobile: true },
    { name: 'mobile-sm', width: 320, height: 568, deviceScaleFactor: 2, mobile: true },
    { name: 'landscape', width: 844, height: 390, deviceScaleFactor: 2, mobile: true },
    { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 1, mobile: false },
];

const EDGE_CANDIDATES = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SHOTS_DIR = path.join(__dirname, 'shots');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 簡易静的HTTPサーバ
// ---------------------------------------------------------------------------
function startStaticServer(rootDir) {
    const server = http.createServer((req, res) => {
        try {
            let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
            if (urlPath.endsWith('/')) urlPath += 'index.html';
            const filePath = path.normalize(path.join(rootDir, urlPath));
            if (!filePath.startsWith(rootDir)) {
                res.writeHead(403); res.end('forbidden'); return;
            }
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                res.writeHead(404); res.end('not found'); return;
            }
            res.writeHead(200, {
                'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
                'Cache-Control': 'no-store',
            });
            fs.createReadStream(filePath).pipe(res);
        } catch (e) {
            res.writeHead(500); res.end(String(e));
        }
    });
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    });
}

function getFreePort() {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const port = srv.address().port;
            srv.close(() => resolve(port));
        });
        srv.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Edge 起動 + CDP 接続
// ---------------------------------------------------------------------------
function findEdge() {
    for (const p of EDGE_CANDIDATES) if (fs.existsSync(p)) return p;
    throw new Error('msedge.exe not found. candidates: ' + EDGE_CANDIDATES.join(' | '));
}

async function launchEdge(headlessFlag) {
    const edgePath = findEdge();
    const debugPort = await getFreePort();
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-shot-'));
    const args = [
        headlessFlag,
        '--disable-gpu',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${userDataDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--mute-audio',
        '--autoplay-policy=no-user-gesture-required',
        '--window-size=1320,920',
        'about:blank',
    ];
    const proc = spawn(edgePath, args, { stdio: 'ignore' });

    // CDPエンドポイントが応答するまでポーリング
    const deadline = Date.now() + 20000;
    let wsUrl = null;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
            if (res.ok) {
                wsUrl = (await res.json()).webSocketDebuggerUrl;
                break;
            }
        } catch { /* まだ起動中 */ }
        if (proc.exitCode !== null) break; // 起動失敗
        await sleep(250);
    }
    if (!wsUrl) {
        try { proc.kill(); } catch { /* noop */ }
        throw new Error(`Edge CDP not reachable on port ${debugPort} (flag: ${headlessFlag})`);
    }
    return { proc, wsUrl, userDataDir };
}

// CDP クライアント（flat session protocol）
class CDP {
    constructor(ws) {
        this.ws = ws;
        this.nextId = 0;
        this.pending = new Map();
        ws.addEventListener('message', (ev) => {
            const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
            if (msg.id !== undefined && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(`CDP ${msg.error.message}`));
                else resolve(msg.result);
            }
        });
    }
    static connect(wsUrl) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            ws.addEventListener('open', () => resolve(new CDP(ws)));
            ws.addEventListener('error', (e) => reject(new Error('WebSocket error: ' + (e.message || ''))));
        });
    }
    send(method, params = {}, sessionId = undefined) {
        return new Promise((resolve, reject) => {
            const id = ++this.nextId;
            this.pending.set(id, { resolve, reject });
            const payload = { id, method, params };
            if (sessionId) payload.sessionId = sessionId;
            this.ws.send(JSON.stringify(payload));
        });
    }
    close() { try { this.ws.close(); } catch { /* noop */ } }
}

// ページ操作ヘルパ
class Page {
    constructor(cdp, sessionId) {
        this.cdp = cdp;
        this.sessionId = sessionId;
    }
    async evaluate(expression) {
        const res = await this.cdp.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
        }, this.sessionId);
        if (res.exceptionDetails) {
            const d = res.exceptionDetails;
            throw new Error('page eval failed: ' + (d.exception?.description || d.text));
        }
        return res.result?.value;
    }
    // expression が truthy になるまでポーリング
    async waitForExpr(expression, timeoutMs = 10000, label = expression) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            let v = false;
            try { v = await this.evaluate(expression); } catch { /* 評価中の一時エラーは無視 */ }
            if (v) return true;
            await sleep(150);
        }
        throw new Error(`waitForExpr timeout (${timeoutMs}ms): ${label}`);
    }
    async navigate(url) {
        await this.cdp.send('Page.navigate', { url }, this.sessionId);
        await this.waitForExpr(`document.readyState === 'complete'`, 20000, 'page load');
    }
    async screenshot(filePath) {
        const res = await this.cdp.send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
        }, this.sessionId);
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
        return filePath;
    }
}

// ---------------------------------------------------------------------------
// ゲーム状態ドライバ
//   各 driver は「その状態を画面に出して撮影できる状態にする」責務を持つ。
//   前提状態（ゲーム開始済み等）は自前で整える。
// ---------------------------------------------------------------------------
const ENSURE_GAME = `(() => {
    // gameStarted は index.html トップレベルの let（グローバルスクープから参照可能）
    if (typeof gameStarted !== 'undefined' && gameStarted) return 'already-started';
    try { startGame(); } catch (e) { return 'ERR:' + e.message; }
    return 'started';
})()`;

const END_EVENT_IF_PLAYING = `(() => {
    const s = window.storyEventSystem;
    if (s && s.isEventPlaying) { s.endEvent(); return 'ended'; }
    return 'no-event';
})()`;

const DRIVERS = {
    // --- タイトル画面（ページ表示直後） ---
    async title(page) {
        await page.waitForExpr(
            `Array.from(document.images).every(i => i.complete)`,
            10000, 'title images loaded');
        // タイトル背景(CSS background)のデコード猶予
        await sleep(800);
    },

    // --- オープニング ---
    async opening(page) {
        const r = await page.evaluate(`(() => {
            try { startOpening(); } catch (e) { return 'ERR:' + e.message; }
            return 'ok';
        })()`);
        if (String(r).startsWith('ERR:')) throw new Error('startOpening failed: ' + r);
        // ビジュアル(背景画像)のロードを待つ
        await page.evaluate(`(async () => {
            const el = document.getElementById('openingScreen');
            const m = ((el && el.style.backgroundImage) || '').match(/url\\(["']?([^"')]+)["']?\\)/);
            if (m) {
                const img = new Image();
                img.src = m[1];
                try { await img.decode(); } catch (e) { /* 404等は無視 */ }
            }
            return true;
        })()`);
        await sleep(600); // タイプライターを少し進めてから
        await page.evaluate(`(() => { try { finishOpeningTypewriter(); } catch (e) {} return true; })()`);
        await sleep(300);
    },

    // --- 会話（VNポートレート表示中） ---
    async dialog(page) {
        await page.evaluate(ENSURE_GAME);
        // startGame() 新規開始時は checkAutoEvents が 1秒後に chapter1_start を自動再生する
        try {
            await page.waitForExpr(
                `window.storyEventSystem && window.storyEventSystem.isEventPlaying === true`,
                5000, 'auto story event');
        } catch {
            // 自動再生されなかった場合は手動でトリガー（chapter1_start は oneTime でないため再発火可能）
            const r = await page.evaluate(`(() => {
                const s = window.storyEventSystem;
                if (!s) return 'ERR:no storyEventSystem';
                return s.triggerEvent('chapter1_start', {
                    storyFlags: window.storyFlags,
                    player: window.debugPlayer || window.player,
                    mapSystem: window.mapSystem,
                    magicSystem: window.magicSystem,
                    partySystem: window.partySystem
                }) ? 'ok' : 'ERR:triggerEvent returned false';
            })()`);
            if (String(r).startsWith('ERR:')) throw new Error('dialog trigger failed: ' + r);
            await page.waitForExpr(
                `window.storyEventSystem && window.storyEventSystem.isEventPlaying === true`,
                5000, 'manual story event');
        }
        await sleep(400);
        // 本文を全文表示にし、ポートレート画像のロードを待つ
        await page.evaluate(`(() => { try { window.storyEventSystem.finishTypewriter(); } catch (e) {} return true; })()`);
        await page.evaluate(`(async () => {
            const imgs = Array.from(document.querySelectorAll('#vnPortraits img')).filter(i => i.src);
            await Promise.all(imgs.map(i => i.decode().catch(() => {})));
            return true;
        })()`);
        await sleep(300);
    },

    // --- フィールド ---
    async field(page) {
        await page.evaluate(ENSURE_GAME);
        await page.evaluate(END_EVENT_IF_PLAYING);
        await page.waitForExpr(
            `!window.storyEventSystem || !window.storyEventSystem.isEventPlaying`,
            5000, 'event ended');
        // ゲームループが数フレーム描画するのを待つ
        await sleep(900);
    },

    // --- バトル（コマンド選択状態） ---
    async battle(page) {
        await page.evaluate(ENSURE_GAME);
        await page.evaluate(END_EVENT_IF_PLAYING);
        const r = await page.evaluate(`(() => {
            const bs = window.battleSystem;
            if (!bs) return 'ERR:no battleSystem';
            if (bs.inBattle) return 'already-in-battle';
            const base = bs.enemyDatabase && bs.enemyDatabase.watcher;
            if (!base) return 'ERR:enemy watcher not in enemyDatabase';
            try {
                bs.startBattle({
                    ...base,
                    currentHp: base.hp,
                    currentMp: base.mp || 0,
                    maxHp: base.maxHp || base.hp,
                    id: 'watcher'
                });
            } catch (e) { return 'ERR:' + e.message; }
            return 'ok';
        })()`);
        if (String(r).startsWith('ERR:')) throw new Error('startBattle failed: ' + r);
        // startBattle 1秒後の startPlayerTurn → BattlePanel.renderCommands で
        // #gameMessageBody 内に .command-item が並ぶ＝コマンド選択状態
        await page.waitForExpr(
            `document.querySelectorAll('#gameMessageBody .command-item').length > 0`,
            10000, 'battle commands visible');
        // 戦闘背景画像のロードを待つ
        await page.evaluate(`(async () => {
            const i = document.getElementById('battleBgImage');
            if (i && i.src) { try { await i.decode(); } catch (e) {} }
            return true;
        })()`);
        await sleep(400);
    },
};

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------
async function main() {
    fs.mkdirSync(SHOTS_DIR, { recursive: true });

    const { server, port } = await startStaticServer(REPO_ROOT);
    const baseUrl = `http://127.0.0.1:${port}/index.html`;
    console.log(`[server] serving ${REPO_ROOT} at http://127.0.0.1:${port}/`);

    // Edge 起動（--headless=new で失敗したら --headless にフォールバック）
    let edge;
    try {
        edge = await launchEdge('--headless=new');
    } catch (e) {
        console.warn('[edge] --headless=new failed, retrying with --headless:', e.message);
        edge = await launchEdge('--headless');
    }
    console.log(`[edge] launched, CDP: ${edge.wsUrl}`);

    const cdp = await CDP.connect(edge.wsUrl);
    const results = [];
    const failures = [];

    try {
        for (const vp of VIEWPORTS) {
            // ビューポートごとに新規タブ（状態を完全リセット）
            const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
            const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
            const page = new Page(cdp, sessionId);

            await cdp.send('Page.enable', {}, sessionId);
            await cdp.send('Runtime.enable', {}, sessionId);
            await cdp.send('Emulation.setDeviceMetricsOverride', {
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: vp.deviceScaleFactor,
                mobile: vp.mobile,
            }, sessionId);
            if (vp.mobile) {
                await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
            }

            console.log(`\n=== viewport: ${vp.name} (${vp.width}x${vp.height} @${vp.deviceScaleFactor}x mobile:${vp.mobile}) ===`);
            await page.navigate(baseUrl);

            for (const state of STATES) {
                const file = path.join(SHOTS_DIR, `${vp.name}_${state}.png`);
                try {
                    await DRIVERS[state](page);
                    await page.screenshot(file);
                    const kb = Math.round(fs.statSync(file).size / 1024);
                    const flag = kb < 20 ? '  <-- WARNING: small file, may be blank' : '';
                    console.log(`[shot] ${vp.name}_${state}.png (${kb} KB)${flag}`);
                    results.push({ file, kb });
                } catch (e) {
                    console.error(`[FAIL] ${vp.name}_${state}: ${e.message}`);
                    failures.push({ state: `${vp.name}_${state}`, reason: e.message });
                }
            }

            await cdp.send('Target.closeTarget', { targetId });
        }
    } finally {
        try { await cdp.send('Browser.close'); } catch { /* noop */ }
        cdp.close();
        try { edge.proc.kill(); } catch { /* noop */ }
        server.close();
        // 一時プロファイルの掃除（ロック残りは無視）
        try { fs.rmSync(edge.userDataDir, { recursive: true, force: true }); } catch { /* noop */ }
    }

    console.log('\n===== summary =====');
    for (const r of results) console.log(`OK   ${r.file} (${r.kb} KB)`);
    for (const f of failures) console.log(`FAIL ${f.state}: ${f.reason}`);
    if (failures.length > 0) process.exitCode = 1;
}

main().catch((e) => {
    console.error('[fatal]', e);
    process.exit(1);
});
