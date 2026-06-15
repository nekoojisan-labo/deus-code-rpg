// ==========================================
// UIPanel — 全選択可/スクロール/テキスト画面を描画する単一UI部品
// ------------------------------------------
// 目的: バトル/ショップ/メニュー/アイテム/装備/神威/クエスト/モーダル/VN を
//   「1つの部品・1つのフォーマット・1つの入力規則・1つのトークン集合」で統一する。
//   → 1画面ごとの個別修正をやめ、ここを直せば全画面に波及する構造にする。
//
// 2系統のレンダリング:
//   (1) renderList/renderText/setSelectedIndexIn  … 汎用レンダラ（戦闘はBattlePanelが
//       これへforward。rowClass/selectedClassを差し替え、既存DOM契約を完全維持＝回帰ゼロ）
//   (2) open/update/handleKey/close              … オーバーレイ画面の状態機械
//       （中央ルータ先頭の `if (UIPanel.isOpen()) return UIPanel.handleKey(e)` から駆動）
//
// 入力規則（全オーバーレイ共通）:
//   上=ArrowUp|w|W / 下=ArrowDown|s|S / 左=ArrowLeft|a|A / 右=ArrowRight|d|D
//   決定=Enter|Space|z|Z / キャンセル=x|X|Escape
//   selectable:false（read-only）は決定/キャンセルのみ受理。disabled行は決定でスキップ。
// ==========================================
const UIPanel = (() => {
    const ARROW = { up: ['ArrowUp', 'w', 'W'], down: ['ArrowDown', 's', 'S'], left: ['ArrowLeft', 'a', 'A'], right: ['ArrowRight', 'd', 'D'] };
    const CONFIRM = ['Enter', ' ', 'z', 'Z'];
    const CANCEL = ['x', 'X', 'Escape'];

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const resolveHost = (host) => {
        if (!host) return null;
        if (typeof host === 'string') return document.getElementById(host);
        return host;
    };

    // -------- 汎用レンダラ（戦闘forward用・オーバーレイ用 共通） --------

    // items を host に行リストとして描画。戦闘は rowClass:'command-item'/selectedClass:'selected' で
    // 既存DOMと同一出力。オーバーレイは 'ui-panel__row'/'is-selected'。
    function renderList(host, items, opts) {
        const body = resolveHost(host);
        if (!body) return;
        opts = opts || {};
        const rowClass = opts.rowClass || 'ui-panel__row';
        const selClass = opts.selectedClass || 'is-selected';
        const selectedIndex = typeof opts.selectedIndex === 'number' ? opts.selectedIndex : 0;

        if (Array.isArray(opts.bodyAddClasses)) opts.bodyAddClasses.forEach(c => body.classList.add(c));
        if (Array.isArray(opts.bodyRemoveClasses)) opts.bodyRemoveClasses.forEach(c => body.classList.remove(c));
        body.innerHTML = '';

        if (opts.title) {
            const t = document.createElement('div');
            t.className = opts.titleClass || 'ui-panel__title';
            t.textContent = opts.title;
            body.appendChild(t);
        }

        (items || []).forEach((it, index) => {
            const row = document.createElement('div');
            row.className = rowClass
                + (index === selectedIndex ? ' ' + selClass : '')
                + (it.disabled ? ' is-disabled' : '');
            if (it.command) row.dataset.command = it.command;
            row.dataset.index = String(index);
            if (it.html != null) {
                row.innerHTML = it.html;
            } else if (opts.structured) {
                row.innerHTML = structuredRow(it);
            } else {
                row.textContent = it.label || '';
            }
            if (it.color) row.style.color = it.color;
            if (typeof it.onClick === 'function') row.onclick = it.onClick;
            body.appendChild(row);
        });
    }

    // アイコン+ラベル(+サブ)+右寄せ の構造化行（オーバーレイのアイテム/装備/ショップ用）
    function structuredRow(it) {
        const icon = it.icon ? `<span class="ui-panel__icon">${esc(it.icon)}</span>` : '';
        const sub = it.sub ? `<span class="ui-panel__sub">${esc(it.sub)}</span>` : '';
        const right = it.right ? `<span class="ui-panel__right">${esc(it.right)}</span>` : '';
        return `${icon}<span class="ui-panel__text-col"><span class="ui-panel__label">${esc(it.label)}</span>${sub}</span>${right}`;
    }

    // テキスト行/HTMLを host に描画（戦闘ログは join:'<br>'・末尾追従／VN本文等にも流用）
    function renderText(host, content, opts) {
        const body = resolveHost(host);
        if (!body) return;
        opts = opts || {};
        if (Array.isArray(opts.bodyAddClasses)) opts.bodyAddClasses.forEach(c => body.classList.add(c));
        if (Array.isArray(opts.bodyRemoveClasses)) opts.bodyRemoveClasses.forEach(c => body.classList.remove(c));
        if (opts.html) {
            body.innerHTML = content;
        } else {
            const lines = Array.isArray(content) ? content : [content];
            const max = opts.maxLines || lines.length;
            const recent = lines.slice(-max).map(esc);
            body.innerHTML = recent.join(opts.join || '<br>');
        }
        if (opts.scrollBottom) body.scrollTop = body.scrollHeight;
    }

    // host 内の行の選択ハイライトを更新＋追従スクロール（戦闘setSelectedIndexの実体）
    function setSelectedIndexIn(host, index, rowClass, selClass) {
        const body = resolveHost(host);
        if (!body) return;
        rowClass = rowClass || 'ui-panel__row';
        selClass = selClass || 'is-selected';
        const rows = body.querySelectorAll('.' + rowClass);
        rows.forEach((el, i) => {
            if (i === index) el.classList.add(selClass);
            else el.classList.remove(selClass);
        });
        const sel = rows[index];
        if (sel && typeof sel.scrollIntoView === 'function') sel.scrollIntoView({ block: 'nearest' });
    }

    // -------- オーバーレイ状態機械 --------

    let state = null; // { config, items, index, host, overlay }

    function open(config) {
        config = config || {};
        const host = resolveHost(config.host);
        if (!host) return;
        state = {
            config,
            items: config.items || [],
            index: clampToSelectable(config.items || [], typeof config.selectedIndex === 'number' ? config.selectedIndex : 0, +1),
            host,
            overlay: config.overlay ? resolveHost(config.overlay) : null
        };
        render();
        if (state.overlay) state.overlay.classList.add('active');
    }

    function update(partial) {
        if (!state) return;
        partial = partial || {};
        if (partial.items) { state.items = partial.items; state.config.items = partial.items; }
        if (partial.selectable != null) state.config.selectable = partial.selectable;
        if (partial.title != null) state.config.title = partial.title;
        if (partial.bodyText != null) state.config.bodyText = partial.bodyText;
        if (partial.bodyHtml != null) state.config.bodyHtml = partial.bodyHtml;
        if (typeof partial.selectedIndex === 'number') state.index = partial.selectedIndex;
        if (state.items.length) state.index = clampToSelectable(state.items, Math.min(state.index, state.items.length - 1), +1);
        render();
    }

    function render() {
        if (!state) return;
        const cfg = state.config;
        const cols = cfg.columns || 1;
        const selectable = cfg.selectable !== false;
        // bare: リストのみ描画（既存コンテナ＝VN選択肢#gameMessageChoices等に埋め込む。シェル無し）
        if (cfg.bare) {
            state.host.innerHTML = `<div class="ui-panel__list ui-panel__list--bare" style="--cols:${cols}"></div>`;
            const listB = state.host.querySelector('.ui-panel__list');
            if (listB && state.items.length) {
                renderList(listB, decorateItems(state.items), { structured: true, selectedIndex: selectable ? state.index : -1, rowClass: 'ui-panel__row', selectedClass: 'is-selected' });
                wireRowClicks(listB);
            }
            return;
        }
        // ★frame: FF風2ペイン master-detail（左=コマンド/リスト・右=詳細）。右は selection 追従で再描画。
        if (cfg.frame) {
            let fh = '<div class="ui-panel__head">';
            fh += `<span class="ui-panel__title">${esc(cfg.title || '')}</span>`;
            if (cfg.headerHtml != null) fh += `<span class="ui-panel__header-extra">${cfg.headerHtml}</span>`;
            else if (cfg.headerExtra) fh += `<span class="ui-panel__header-extra">${esc(cfg.headerExtra)}</span>`;
            fh += '</div>';
            fh += '<div class="ui-panel__frame">';
            fh += `<div class="ui-panel__pane-l"><div class="ui-panel__list${selectable ? '' : ' ui-panel__list--readonly'}" style="--cols:${cols}"></div>`;
            fh += (cfg.footHtml != null ? `<div class="ui-panel__foot">${cfg.footHtml}</div>` : '') + '</div>';
            fh += `<div class="ui-panel__pane-r" id="ui-panel-detail">${computeDetail()}</div>`;
            fh += '</div>';
            fh += `<div class="ui-panel__hint"><span>${esc(cfg.hint || defaultHint(selectable))}</span><span class="ui-panel__page">${pageLabel()}</span></div>`;
            state.host.innerHTML = fh;
            state.host.classList.add('ui-panel', 'ui-panel--frame');
            const listB = state.host.querySelector('.ui-panel__list');
            if (listB && state.items.length) paintList(listB, selectable);
            updatePageLabel();
            return;
        }
        // ヘッダ/ヒントを内包する .ui-panel シェルへ描画
        let html = '<div class="ui-panel__head">';
        html += `<span class="ui-panel__title">${esc(cfg.title || '')}</span>`;
        if (cfg.headerExtra) html += `<span class="ui-panel__header-extra">${esc(cfg.headerExtra)}</span>`;
        html += '</div>';
        if (cfg.bodyHtml != null) {
            html += `<div class="ui-panel__text">${cfg.bodyHtml}</div>`;
        } else if (cfg.bodyText != null) {
            html += `<div class="ui-panel__text">${esc(cfg.bodyText)}</div>`;
        }
        html += `<div class="ui-panel__list${selectable ? '' : ' ui-panel__list--readonly'}" style="--cols:${cols}"></div>`;
        html += `<div class="ui-panel__hint"><span>${esc(cfg.hint || defaultHint(selectable))}</span><span class="ui-panel__page">${pageLabel()}</span></div>`;
        state.host.innerHTML = html;
        state.host.classList.add('ui-panel');
        const listEl = state.host.querySelector('.ui-panel__list');
        if (listEl && state.items.length) paintList(listEl, selectable);
        updatePageLabel();
    }

    function decorateItems(items) {
        return items.map(it => (typeof it === 'string' ? { label: it } : it));
    }

    // ★frame: 現在ハイライト中の項目から右ペイン(詳細)のHTMLを算出。
    //   cfg.detailFor(item, index) があればそれ、無ければ cfg.detailHtml。
    function computeDetail() {
        if (!state) return '';
        const cfg = state.config;
        if (typeof cfg.detailFor === 'function') {
            try { return cfg.detailFor(state.items[state.index], state.index) || ''; } catch (e) { return ''; }
        }
        return cfg.detailHtml || '';
    }
    // 右ペインだけ再描画（左リストは触らない＝フォーカス維持・ちらつき無し）
    function repaintDetail() {
        if (!state || !state.config.frame) return;
        const el = state.host.querySelector('#ui-panel-detail');
        if (el) el.innerHTML = computeDetail();
        if (typeof state.config.onHighlight === 'function') {
            try { state.config.onHighlight(state.items[state.index], state.index); } catch (e) {}
        }
    }

    // ★ページング: cfg.pageSize が設定され項目数が超える時、スクロールバーを出さずページ送り表示。
    function pageSizeOf() { return (state && state.config.pageSize) || 0; }
    function pageCount() { const ps = pageSizeOf(); return ps && state.items.length > ps ? Math.ceil(state.items.length / ps) : 1; }
    function curPage() { const ps = pageSizeOf(); return ps ? Math.floor(state.index / ps) : 0; }
    function pageLabel() { return ''; }   // ★ページ送り廃止（選択追従スクロールに変更）→ 頁表示は出さない
    // ヒント右端のページ表示「◀ 1/2 ▶」だけを更新（ページ送り時）。
    function updatePageLabel() {
        if (!state) return;
        const el = state.host.querySelector('.ui-panel__page');
        if (el) el.innerHTML = pageLabel();
    }
    // ★リストは「全項目」を描画し、入りきらない分は選択追従(scrollIntoView)で1つずつスクロールする。
    //   ページ送りはしない（←→上下でページ先頭に飛びカーソルが消える不具合を解消＋全画面で統一）。
    //   スクロールバーは出さない（CSS: overflow-y:auto + scrollbar非表示）。
    function paintList(listEl, selectable) {
        if (!listEl || !state) return;
        renderList(listEl, decorateItems(state.items), { structured: true, selectedIndex: selectable ? state.index : -1, rowClass: 'ui-panel__row', selectedClass: 'is-selected' });
        listEl.querySelectorAll('.ui-panel__row').forEach((row) => {
            const li = parseInt(row.dataset.index, 10);
            row.onclick = () => { state.index = li; fireSelect(); };
        });
        setSelectedIndexIn(listEl, selectable ? state.index : -1, 'ui-panel__row', 'is-selected');
    }

    function wireRowClicks(listEl) {
        const rows = listEl.querySelectorAll('.ui-panel__row');
        rows.forEach((row) => {
            const i = parseInt(row.dataset.index, 10);
            row.onclick = () => { state.index = i; fireSelect(); };
        });
    }

    function defaultHint(selectable) {
        return selectable ? '↑↓ 選択 / Z 決定 / X 閉じる' : 'Z / X 閉じる';
    }

    function clampToSelectable(items, start, dir) {
        if (!items.length) return 0;
        let i = Math.max(0, Math.min(items.length - 1, start));
        for (let n = 0; n < items.length; n++) {
            if (!items[i] || !items[i].disabled) return i;
            i = (i + dir + items.length) % items.length;
        }
        return start; // 全て disabled
    }

    function move(delta) {
        if (!state || !state.items.length) return;
        let i = state.index;
        for (let n = 0; n < state.items.length; n++) {
            i = (i + delta + state.items.length) % state.items.length;
            if (!state.items[i] || !state.items[i].disabled) break;
        }
        state.index = i;
        // ★選択追従スクロール（一覧が多い時は選択に合わせ1つずつスクロール）。ページ送りはしない。
        setSelectedIndexIn(state.host.querySelector('.ui-panel__list'), state.index, 'ui-panel__row', 'is-selected');
        repaintDetail();   // ★frame: 選択追従で右ペイン更新
    }

    function fireSelect() {
        if (!state) return;
        const it = state.items[state.index];
        if (!it || it.disabled) return;
        const cb = it.onSelect || state.config.onSelect;
        if (typeof cb === 'function') cb(it.value !== undefined ? it.value : it, state.index, it);
    }

    function fireCancel() {
        if (!state) return;
        const cb = state.config.onCancel;
        if (typeof cb === 'function') cb();
    }

    // 中央ルータから呼ばれる唯一の入力口。処理したら true。
    function handleKey(e) {
        if (!state) return false;
        const k = e.key;
        const cols = state.config.columns || 1;
        const selectable = state.config.selectable !== false;
        // read-only画面は決定もキャンセルも「閉じる」に倒す（読み物のz/x両方で戻る）
        if (CONFIRM.includes(k)) { e.preventDefault(); if (selectable) fireSelect(); else fireCancel(); return true; }
        if (CANCEL.includes(k)) { e.preventDefault(); fireCancel(); return true; }
        if (!selectable) { e.preventDefault(); return true; }
        if (ARROW.up.includes(k)) { e.preventDefault(); move(-cols); return true; }
        if (ARROW.down.includes(k)) { e.preventDefault(); move(+cols); return true; }
        if (ARROW.left.includes(k)) { e.preventDefault(); move(-1); return true; }
        if (ARROW.right.includes(k)) { e.preventDefault(); move(+1); return true; }
        e.preventDefault();
        return true;
    }

    function close(result) {
        if (state && state.overlay) state.overlay.classList.remove('active');
        state = null;
        return result;
    }

    function isOpen() { return !!state; }
    function getSelectedIndex() { return state ? state.index : -1; }
    function getSelectedValue() {
        if (!state) return null;
        const it = state.items[state.index];
        return it ? (it.value !== undefined ? it.value : it) : null;
    }
    function setSelectedIndex(i) {
        if (!state) return;
        state.index = clampToSelectable(state.items, i, +1);
        setSelectedIndexIn(state.host.querySelector('.ui-panel__list'), state.index, 'ui-panel__row', 'is-selected');
        repaintDetail();
    }

    // ★frame: 右ペインを手動で差し替える（ドリル中の固定表示など）
    function setDetail(html) {
        if (!state) return;
        const el = state.host.querySelector('#ui-panel-detail');
        if (el) el.innerHTML = html;
    }

    return {
        // 汎用レンダラ（戦闘BattlePanelが利用）
        renderList, renderText, setSelectedIndexIn, esc,
        // オーバーレイ状態機械
        open, update, render, close, isOpen, handleKey,
        getSelectedIndex, getSelectedValue, setSelectedIndex, setDetail
    };
})();
if (typeof window !== 'undefined') window.UIPanel = UIPanel;
if (typeof module !== 'undefined' && module.exports) module.exports = { UIPanel };
