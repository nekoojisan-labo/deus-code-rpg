// ==========================================
// 戦闘システム (Battle System)
// ==========================================

// ------------------------------------------------------------------
// BattlePanel: #gameMessagePanel をバトル用に駆動するヘルパ
//   - Mode A (commands): コマンドリストを #gameMessageBody に描画
//   - Mode B (log)     : 直近のバトルログ複数行を #gameMessageBody に描画
//   両モード共通で、パネルは battle 中つねに .active を維持する。
// ------------------------------------------------------------------
const BattlePanel = (() => {
    function getEls() {
        const panel = document.getElementById('gameMessagePanel');
        if (!panel) return null;
        return {
            panel,
            header: panel.querySelector('.game-msg-header'),
            character: document.getElementById('gameMessageCharacter'),
            body: document.getElementById('gameMessageBody'),
            choices: document.getElementById('gameMessageChoices'),
            controls: panel.querySelector('.game-msg-controls'),
            indicator: document.getElementById('gameMessageNextIndicator'),
            hint: document.getElementById('gameMessageHint')
        };
    }

    function activate(headerLabel) {
        const els = getEls();
        if (!els) return;
        els.panel.classList.add('active');
        els.panel.classList.add('battle-mode');
        els.panel.setAttribute('aria-hidden', 'false');
        els.panel.dataset.battleMode = '1';
        if (els.header) els.header.classList.add('active');
        if (els.character) {
            els.character.textContent = headerLabel || '戦闘';
            els.character.classList.add('battle-mode-label');
        }
        if (els.choices) {
            els.choices.classList.remove('active');
            els.choices.innerHTML = '';
        }
    }

    function setHeader(label) {
        const els = getEls();
        if (!els || !els.character) return;
        els.character.textContent = label || '戦闘';
    }

    // Mode A: コマンドリストを描画（UIPanel.renderListへforward・DOM契約は従来と同一）
    function renderCommands(items, opts) {
        const els = getEls();
        if (!els || !els.body) return;
        opts = opts || {};
        if (opts.headerLabel) setHeader(opts.headerLabel);

        els.panel.classList.add('active', 'battle-mode');
        els.panel.classList.remove('battle-log-mode');

        // UIPanelが単一の描画経路。rowClass/selectedClass/titleClassを戦闘用に差し替え、
        // .command-item + dataset.command + .selected という既存DOMを完全再現する
        // （handleBattleInput/refreshCurrentPhaseSelection が読む契約を壊さない＝回帰ゼロ）。
        UIPanel.renderList(els.body, items, {
            rowClass: 'command-item',
            selectedClass: 'selected',
            selectedIndex: typeof opts.selectedIndex === 'number' ? opts.selectedIndex : 0,
            title: opts.title,
            titleClass: 'battle-cmd-title',
            bodyAddClasses: ['battle-cmd-mode'],
            bodyRemoveClasses: opts.grid ? [] : ['battle-cmd-grid']
        });
        els.body.classList.toggle('battle-cmd-grid', !!opts.grid);
        // ★listMode: スキル/どうぐ等の「長い名前が多数並ぶ一覧」はボタン枠を外し、
        //   平文＋カーソルの読みやすい行にする（メイン5コマンドは枠付きのまま）。
        els.body.classList.toggle('battle-cmd-list', !!opts.listMode);
    }

    function setSelectedIndex(index) {
        const els = getEls();
        if (!els || !els.body) return;
        UIPanel.setSelectedIndexIn(els.body, index, 'command-item', 'selected');
    }

    // Mode B: バトルログを描画（直近 maxLines 行・UIPanel.renderTextへforward）
    function renderLog(lines, opts) {
        const els = getEls();
        if (!els || !els.body) return;
        opts = opts || {};

        els.panel.classList.add('active', 'battle-mode');
        els.panel.classList.add('battle-log-mode');
        UIPanel.renderText(els.body, lines || [], {
            maxLines: opts.maxLines || 6,
            join: '<br>',
            scrollBottom: true,
            bodyRemoveClasses: ['battle-cmd-mode', 'battle-cmd-grid', 'battle-cmd-list']
        });
    }

    function deactivate() {
        const els = getEls();
        if (!els) return;
        els.panel.classList.remove('active', 'battle-mode', 'battle-log-mode');
        els.panel.setAttribute('aria-hidden', 'true');
        delete els.panel.dataset.battleMode;
        if (els.header) els.header.classList.remove('active');
        if (els.character) {
            els.character.textContent = '';
            els.character.classList.remove('battle-mode-label');
        }
        if (els.body) {
            els.body.classList.remove('battle-cmd-mode', 'battle-cmd-grid', 'battle-cmd-list');
            els.body.innerHTML = '';
        }
    }

    function isBattleMode() {
        const panel = document.getElementById('gameMessagePanel');
        return !!(panel && panel.classList.contains('battle-mode'));
    }

    return { activate, setHeader, renderCommands, setSelectedIndex, renderLog, deactivate, isBattleMode };
})();
window.BattlePanel = BattlePanel;

class BattleSystem {
    constructor() {
        this.inBattle = false;
        this.currentEnemy = null;
        this.selectedCommand = 0;
        this.turnOrder = [];
        this.battleLog = [];
        this.turnCount = 0;
        this.waitingForCommand = false;

        // パーティバトル設定
        this.partyCommands = []; // 各パーティメンバーのコマンドを保存
        this.currentMemberIndex = 0; // 現在コマンド選択中のメンバー
        this.allCommandsSelected = false; // 全員のコマンド選択完了フラグ

        // 神威スキル選択フェーズ管理（コマンド選択時にスキルを事前確定する）
        this.kamuiPlanning = false;
        this.kamuiPlanningMember = null;
        this.kamuiSkillExecuting = false; // 二重実行防止
        this.executingTurn = false;       // ターン実行中フラグ（重複起動防止）
        this._akariRescueDone = false;    // ★案B: アカリ乱入加入が当該戦闘で実行済みか(startBattleで毎回リセット)

        // コマンドメニューの表示モード: 'command' | 'skill' | 'target'
        this.commandPhase = 'command';
        this.availableSkills = [];
        this.availableTargets = [];
        this.pendingMagic = null;

        // エンカウント設定
        this.encounterSteps = 0;
        this.encounterThreshold = this.getRandomEncounterSteps('medium');
        this.firstEncounter = true;  // 初回エンカウントフラグ
        this.enemyImageMap = {
            // 旧type（フォールバック用に新アートへ差し替え）
            watcher: 'assets/enemies/enemy_corrupted_drone.png',
            drone: 'assets/enemies/enemy_patrol_drone.png',
            android: 'assets/enemies/enemy_guard_robo.png',
            mecha: 'assets/enemies/enemy_data_dragon.png',
            construct: 'assets/enemies/enemy_guard_robo.png',
            hybrid: 'assets/enemies/enemy_data_spider.png',
            boss: 'assets/enemies/enemy_ark_prime.png',
            corrupted_drone_boss: 'assets/enemies/enemy_corrupted_drone.png',
            rogue_ai_core: 'assets/enemies/enemy_abyss_ruler.png',
            fallen_life_god: 'assets/enemies/enemy_fallen_life_god.png',
            arc_executioner: 'assets/enemies/enemy_arc_executioner.png',
            shrine_guardian: 'assets/enemies/enemy_mirror_sentinel.png',
            // v2雑魚敵の専用スプライト(Codex生成)。getEnemyImagePathはnameで引くため日本語名キー。
            'ラストラット': 'assets/enemies/enemy_rust_rat.png',
            'スパークモス': 'assets/enemies/enemy_spark_moth.png',
            'シンダーハウンド': 'assets/enemies/enemy_cinder_hound.png',
            'フロストウィドウ': 'assets/enemies/enemy_frost_widow.png',
            'スタティックウィスプ': 'assets/enemies/enemy_static_wisp.png',
            'ソルトピラー': 'assets/enemies/enemy_salt_pillar.png',
            'ヴェノムブルーム': 'assets/enemies/enemy_venom_bloom.png',
            'ミラーセンチネル': 'assets/enemies/enemy_mirror_sentinel.png',
            'プラズマランサー': 'assets/enemies/enemy_plasma_lancer.png',
            'クライオウォーデン': 'assets/enemies/enemy_cryo_warden.png',
            'ヌル・レヴナント': 'assets/enemies/enemy_null_revenant.png',
            'エンバーセラフ': 'assets/enemies/enemy_ember_seraph.png',
            'グレイシアタイタン': 'assets/enemies/enemy_glacier_titan.png',
            'オブリビオンシェイド': 'assets/enemies/enemy_oblivion_shade.png',
            'イージスコロッサス': 'assets/enemies/enemy_aegis_colossus.png',
            archon_deus: 'assets/enemies/enemy_archon_deus.png',
            leviathan_core: 'assets/enemies/enemy_leviathan_core.png',
            true_deus: 'assets/enemies/enemy_true_deus.png',
            // bossId（ボス戦の画像解決用）
            corrupted_drone: 'assets/enemies/enemy_corrupted_drone.png',
            arc_prime: 'assets/enemies/enemy_ark_prime.png',
            // 敵名（マップ symbol と一致。戦闘画像もこれで解決）
            'パトロールドローン': 'assets/enemies/enemy_patrol_drone.png',
            '暴走ドローン': 'assets/enemies/enemy_corrupted_drone.png',
            'セキュリティドローン': 'assets/enemies/enemy_security_drone.png',
            'ガードロボ': 'assets/enemies/enemy_guard_robo.png',
            'アーク・プライム': 'assets/enemies/enemy_ark_prime.png',
            'アルコン・デウス': 'assets/enemies/enemy_archon_deus.png',
            'リヴァイアサン・コア': 'assets/enemies/enemy_leviathan_core.png',
            '真・デウス': 'assets/enemies/enemy_true_deus.png',
            '社の守護機': 'assets/enemies/enemy_mirror_sentinel.png',
            'シャドウエンティティ': 'assets/enemies/enemy_shadow_entity.png',
            'データスパイダー': 'assets/enemies/enemy_data_spider.png',
            'クイーンスパイダー': 'assets/enemies/enemy_queen_spider.png',
            'グリッチスピリット': 'assets/enemies/enemy_glitch_spirit.png',
            'ファントム': 'assets/enemies/enemy_phantom.png',
            'データドラゴン': 'assets/enemies/enemy_data_dragon.png',
            'ネクロマンサー': 'assets/enemies/enemy_necromancer.png',
            'スケルトンナイト': 'assets/enemies/enemy_skeleton_knight.png',
            'ダークバット群': 'assets/enemies/enemy_dark_bats.png',
            'デーモンロード': 'assets/enemies/enemy_demon_lord.png',
            '深淵の支配者': 'assets/enemies/enemy_abyss_ruler.png'
        };

        // ボス戦設定
        this.isBossBattle = false;
        this.onBossDefeat = null;

        // 敵データベース
        this.enemyDatabase = {
            watcher: {
                name: 'ウォッチャー',
                emoji: '👁️',
                hp: 25,
                maxHp: 25,
                mp: 10,
                attack: 8,
                defense: 5,
                exp: 18,
                gold: 20,
                type: 'drone',
                skills: ['scan', 'alert'],
                description: '監視ドローン。常に周囲を警戒している。',
                dropTable: [
                    { id: 'heal_potion', rate: 0.3 },
                    { id: 'energy_core', rate: 0.15 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.3,
                    lowHpAction: 'defend',
                    normalAction: 'attack',
                    skillChance: 0.2
                }
            },
            cerberus: {
                name: 'ケルベロス',
                emoji: '🐺',
                hp: 45,
                maxHp: 45,
                mp: 15,
                attack: 15,
                defense: 10,
                exp: 30,
                gold: 50,
                type: 'mecha',
                skills: ['bite', 'howl', 'rush'],
                description: '三つ首の機械狼。高い攻撃力を持つ。',
                dropTable: [
                    { id: 'heal_potion', rate: 0.25 },
                    { id: 'mega_heal_potion', rate: 0.1 },
                    { id: 'steel_saber', rate: 0.05 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.25,
                    lowHpAction: 'attack',
                    normalAction: 'attack',
                    skillChance: 0.4
                }
            },
            dustGolem: {
                name: 'ダスト・ゴーレム',
                emoji: '🗿',
                hp: 60,
                maxHp: 60,
                mp: 5,
                attack: 12,
                defense: 18,
                exp: 55,
                gold: 45,
                type: 'construct',
                skills: ['slam', 'guard'],
                description: 'スクラップから生まれた巨人。防御力が高い。',
                dropTable: [
                    { id: 'heal_potion', rate: 0.2 },
                    { id: 'scale_coif', rate: 0.08 },
                    { id: 'scale_vest', rate: 0.06 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.4,
                    lowHpAction: 'defend',
                    normalAction: 'attack',
                    skillChance: 0.25
                }
            },
            alraune: {
                name: 'アルラウネ',
                emoji: '🌱',
                hp: 35,
                maxHp: 35,
                mp: 25,
                attack: 10,
                defense: 8,
                exp: 52,
                gold: 40,
                type: 'hybrid',
                skills: ['drain', 'entangle', 'spore'],
                description: '植物と機械の融合体。特殊攻撃を使う。',
                dropTable: [
                    { id: 'mega_heal_potion', rate: 0.2 },
                    { id: 'energy_core', rate: 0.25 },
                    { id: 'full_heal_potion', rate: 0.05 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.3,
                    lowHpAction: 'skill',
                    normalAction: 'attack',
                    skillChance: 0.35
                }
            },
            deusMachina: {
                name: 'デウス・マキナ',
                emoji: '🤖',
                hp: 50,
                maxHp: 50,
                mp: 20,
                attack: 14,
                defense: 12,
                exp: 92,
                gold: 60,
                type: 'android',
                skills: ['laserBeam', 'barrier', 'analyze'],
                description: 'アークの精鋭機械兵。バランスが良い。',
                dropTable: [
                    { id: 'mega_heal_potion', rate: 0.25 },
                    { id: 'mega_energy_core', rate: 0.15 },
                    { id: 'officer_blade', rate: 0.03 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.3,
                    lowHpAction: 'skill',
                    normalAction: 'attack',
                    skillChance: 0.3
                }
            },
            // --- フィールド別 追加敵（基礎は tier1 ベースライン。エリアの tier 倍率で自動スケール）---
            patrol_drone: {
                name: 'パトロールドローン', emoji: '🛰️',
                hp: 20, maxHp: 20, mp: 8, attack: 7, defense: 4, exp: 15, gold: 15,
                type: 'drone', skills: ['scan', 'tackle'],
                description: '街路を巡回する小型監視機。弱いが素早い。',
                dropTable: [ { id: 'heal_potion', rate: 0.3 }, { id: 'energy_core', rate: 0.12 } ],
                aiPattern: { lowHpThreshold: 0.3, lowHpAction: 'attack', normalAction: 'attack', skillChance: 0.15 }
            },
            data_spider: {
                name: 'データスパイダー', emoji: '🕷️',
                hp: 30, maxHp: 30, mp: 12, attack: 10, defense: 6, exp: 42, gold: 24,
                type: 'construct', skills: ['web_shot', 'bite'],
                description: '地下網に巣食う電子の蜘蛛。手数で攻める。',
                dropTable: [ { id: 'heal_potion', rate: 0.28 }, { id: 'energy_core', rate: 0.18 } ],
                aiPattern: { lowHpThreshold: 0.3, lowHpAction: 'attack', normalAction: 'attack', skillChance: 0.35 }
            },
            phantom: {
                name: 'ファントム', emoji: '👻',
                hp: 32, maxHp: 32, mp: 30, attack: 9, defense: 6, exp: 60, gold: 38,
                type: 'spirit', skills: ['drain', 'curse_touch'],
                description: '社に漂う残留思念。捉えどころがなく魔を操る。',
                dropTable: [ { id: 'mega_heal_potion', rate: 0.2 }, { id: 'mana_amulet', rate: 0.05 } ],
                aiPattern: { lowHpThreshold: 0.35, lowHpAction: 'skill', normalAction: 'attack', skillChance: 0.4 }
            },
            security_drone: {
                name: 'セキュリティドローン', emoji: '🚨',
                hp: 52, maxHp: 52, mp: 14, attack: 13, defense: 15, exp: 78, gold: 48,
                type: 'drone', skills: ['barrier', 'laser_scan', 'guard'],
                description: '園内警備の重装機。装甲が厚い。',
                dropTable: [ { id: 'scale_coif', rate: 0.1 }, { id: 'scale_vest', rate: 0.08 } ],
                aiPattern: { lowHpThreshold: 0.4, lowHpAction: 'defend', normalAction: 'attack', skillChance: 0.25 }
            },
            shadow_entity: {
                name: 'シャドウエンティティ', emoji: '🌑',
                hp: 44, maxHp: 44, mp: 38, attack: 12, defense: 9, exp: 100, gold: 60,
                type: 'spirit', skills: ['shadow_bind', 'drain', 'curse'],
                description: '闇市の影に巣食う存在。呪詛と魔法を操る。',
                dropTable: [ { id: 'mega_heal_potion', rate: 0.22 }, { id: 'mana_amulet', rate: 0.08 }, { id: 'revival_stone', rate: 0.04 } ],
                aiPattern: { lowHpThreshold: 0.3, lowHpAction: 'skill', normalAction: 'attack', skillChance: 0.4 }
            },
            guard_robo: {
                name: 'ガードロボ', emoji: '🤖',
                hp: 75, maxHp: 75, mp: 12, attack: 17, defense: 22, exp: 135, gold: 75,
                type: 'construct', skills: ['heavy_slam', 'guard', 'barrier'],
                description: 'アーク中枢を守る重装甲兵。極めて硬い。',
                dropTable: [ { id: 'scale_gauntlets', rate: 0.1 }, { id: 'riot_plate', rate: 0.06 } ],
                aiPattern: { lowHpThreshold: 0.4, lowHpAction: 'defend', normalAction: 'attack', skillChance: 0.3 }
            },
            glitch_spirit: {
                name: 'グリッチスピリット', emoji: '👾',
                hp: 48, maxHp: 48, mp: 42, attack: 14, defense: 10, exp: 150, gold: 65,
                type: 'spirit', skills: ['system_hack', 'glitch_pulse', 'analyze'],
                description: '崩れたデータから生じた変則体。状態異常を撒く。',
                dropTable: [ { id: 'mega_energy_core', rate: 0.2 }, { id: 'mana_amulet', rate: 0.08 } ],
                aiPattern: { lowHpThreshold: 0.35, lowHpAction: 'skill', normalAction: 'skill', skillChance: 0.5 }
            },
            queen_spider: {
                name: 'クイーンスパイダー', emoji: '🕸️',
                hp: 85, maxHp: 85, mp: 22, attack: 19, defense: 15, exp: 220, gold: 110,
                type: 'construct', skills: ['summon_brood', 'venom_fang', 'rush'],
                description: '深層に君臨する母蜘蛛。深層トンネルの精鋭。',
                dropTable: [ { id: 'full_heal_potion', rate: 0.15 }, { id: 'riot_grips', rate: 0.05 }, { id: 'revival_stone', rate: 0.05 } ],
                aiPattern: { lowHpThreshold: 0.3, lowHpAction: 'attack', normalAction: 'attack', skillChance: 0.4 }
            },
            // ボスエネミー
            corrupted_drone_boss: {
                name: '暴走監視ドローン・Ω',
                emoji: '🛸',
                hp: 150,
                maxHp: 150,
                mp: 50,
                attack: 20,
                defense: 15,
                exp: 200,
                gold: 300,
                type: 'boss',
                boss: true,
                skills: ['omega_laser', 'emp_pulse', 'repair_protocol'],
                description: 'アークの監視システムが暴走した巨大ドローン。強力なレーザー攻撃を放つ。',
                bossId: 'corrupted_drone_boss',
                dropTable: [
                    { id: 'full_heal_potion', rate: 0.8 },
                    { id: 'elixir', rate: 0.5 },
                    { id: 'officer_blade', rate: 0.3 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.25,
                    lowHpAction: 'skill',
                    normalAction: 'attack',
                    skillChance: 0.6
                }
            },
            fallen_life_god: {
                name: '囚われし生命の神',
                emoji: '🌿',
                hp: 240,
                maxHp: 240,
                mp: 40,
                attack: 22,
                defense: 14,
                magicDefense: 12,
                exp: 150,
                gold: 0,
                type: 'boss',
                boss: true,
                skills: ['vine_lance', 'life_drain', 'withering_cry'],
                description: 'アークに囚われ、堕神と化した生命の神。育んだ無数の命の声で哭く。',
                bossId: 'fallen_life_god',
                dropTable: [],
                aiPattern: {
                    lowHpThreshold: 0.3,
                    lowHpAction: 'skill',
                    normalAction: 'attack',
                    skillChance: 0.5
                }
            },
            arc_executioner: {
                name: '神狩のイクサ',
                emoji: '⚙️',
                hp: 300,
                maxHp: 300,
                mp: 30,
                attack: 26,
                defense: 20,
                magicDefense: 18,
                exp: 200,
                gold: 0,
                element: 'none',
                weakness: 'light',
                elementalResistance: { dark: 0.5 },
                type: 'boss',
                boss: true,
                skills: ['reclaim_claw', 'purge_beam_aoe', 'barrier'],
                description: 'アークが神性の残滓を回収するために投入する白鉄の処刑機。神を狩る鉤爪を持つ。',
                bossId: 'arc_executioner',
                dropTable: [],
                aiPattern: {
                    lowHpThreshold: 0.3,
                    lowHpAction: 'skill',
                    normalAction: 'attack',
                    skillChance: 0.5
                }
            },
            rogue_ai_core: {
                name: '暴走AIコア',
                emoji: '⚡',
                hp: 3500,
                maxHp: 3500,
                mp: 100,
                attack: 105,
                defense: 100,
                exp: 500,
                gold: 800,
                type: 'boss',
                boss: true,
                skills: ['data_storm', 'system_hack', 'firewall'],
                description: 'アークのコアシステムの一部。圧倒的な計算能力で攻撃する。',
                bossId: 'rogue_ai_core',
                dropTable: [
                    { id: 'elixir', rate: 1.0 },
                    { id: 'guardian_carapace', rate: 0.05 },
                    { id: 'kamui_katana', rate: 0.04 },
                    { id: 'deus_crown', rate: 0.05 },
                    { id: 'deus_gauntlets', rate: 0.05 },
                    { id: 'cosmos_orb', rate: 0.05 }
                ],
                aiPattern: {
                    lowHpThreshold: 0.2,
                    lowHpAction: 'skill',
                    normalAction: 'skill',
                    skillChance: 0.8
                }
            }
        };
        
        // エリア別エンカウントテーブル（出現する敵"種"。強さは下記 tier 倍率でスケール）
        // フィールドごとに固有の顔ぶれ（先頭ほど高頻度）。強さは下記 tier 倍率でスケール。
        this.encounterTables = {
            city:    ['watcher', 'patrol_drone', 'watcher', 'patrol_drone'],       // 街路: 弱い監視系
            subway:  ['data_spider', 'dustGolem', 'data_spider', 'cerberus'],     // 地下鉄: 蜘蛛＋重量
            shrine:  ['phantom', 'alraune', 'phantom', 'watcher'],                // 神社: 霊・植物
            garden:  ['alraune', 'security_drone', 'data_spider', 'alraune'],     // 植物園: 植物＋警備
            market:  ['shadow_entity', 'deusMachina', 'shadow_entity', 'cerberus'], // 闇市: 影・機械
            // 後半エリア（都庁・深層トンネル）。種は強敵寄り＋tier 倍率で更にスケール
            gov:     ['guard_robo', 'glitch_spirit', 'deusMachina', 'guard_robo'], // 都庁: 管理兵
            dungeon: ['queen_spider', 'glitch_spirit', 'shadow_entity', 'dustGolem'] // 深層: 精鋭混成
        };
        // tier→ステータス倍率。物語の章進行（quest）に対応する難易度帯。
        // 1=序盤(広場) 2=地下鉄/神社 3=植物園/闇市 4=都庁 5=深層ダンジョン
        this.tierMultiplier = { 1: 1.0, 2: 1.5, 3: 2.2, 4: 3.0, 5: 4.2 };

        // ★v2 敵ロスター: 新規17体追加 + 既存15体に属性/弱点/耐性レトロフィット + 既存zakoのHP底上げ + 出現表更新
        Object.assign(this.enemyDatabase, {
            rust_rat: { id: 'rust_rat', name: 'ラストラット', emoji: '🐀', hp: 44, maxHp: 44, attack: 7, defense: 4, magicDefense: 2, mp: 0, exp: 14, gold: 12, element: 'none', weakness: null, elementalResistance: null, skills: ['gnaw', 'scatter'], description: 'ラストラット', prescaled: true },
            spark_moth: { id: 'spark_moth', name: 'スパークモス', emoji: '🦋', hp: 36, maxHp: 36, attack: 6, defense: 3, magicDefense: 4, mp: 0, exp: 16, gold: 14, element: 'thunder', weakness: 'ice', elementalResistance: { thunder: 0.5 }, skills: ['spark', 'dazzle'], description: 'スパークモス', prescaled: true },
            cinder_hound: { id: 'cinder_hound', name: 'シンダーハウンド', emoji: '🐺', hp: 96, maxHp: 96, attack: 16, defense: 11, magicDefense: 6, mp: 0, exp: 34, gold: 30, element: 'fire', weakness: 'ice', elementalResistance: { fire: 0.5 }, skills: ['ember_fang', 'heat_howl'], description: 'シンダーハウンド', prescaled: true },
            frost_widow: { id: 'frost_widow', name: 'フロストウィドウ', emoji: '🕷️', hp: 80, maxHp: 80, attack: 13, defense: 8, magicDefense: 10, mp: 0, exp: 46, gold: 34, element: 'ice', weakness: 'fire', elementalResistance: { ice: 0.6 }, skills: ['ice_web', 'chill_bite', 'venom_fang'], description: 'フロストウィドウ', prescaled: true },
            static_wisp: { id: 'static_wisp', name: 'スタティックウィスプ', emoji: '⚡', hp: 68, maxHp: 68, attack: 11, defense: 6, magicDefense: 14, mp: 0, exp: 50, gold: 32, element: 'thunder', weakness: null, elementalResistance: { thunder: 0.75 }, skills: ['arc_bolt', 'overload'], description: 'スタティックウィスプ', prescaled: true },
            salt_pillar: { id: 'salt_pillar', name: 'ソルトピラー', emoji: '🗿', hp: 264, maxHp: 264, attack: 20, defense: 40, magicDefense: 8, mp: 0, exp: 95, gold: 70, element: 'none', weakness: 'thunder,ice', elementalResistance: null, skills: ['rock_throw', 'harden', 'quake_stomp'], description: 'ソルトピラー', prescaled: true },
            venom_bloom: { id: 'venom_bloom', name: 'ヴェノムブルーム', emoji: '🥀', hp: 154, maxHp: 154, attack: 22, defense: 16, magicDefense: 20, mp: 0, exp: 100, gold: 66, element: 'dark', weakness: 'fire,light', elementalResistance: { dark: 0.5 }, skills: ['toxic_spore', 'drain', 'entangle'], description: 'ヴェノムブルーム', prescaled: true, aoe: true },
            mirror_sentinel: { id: 'mirror_sentinel', name: 'ミラーセンチネル', emoji: '🪞', hp: 220, maxHp: 220, attack: 24, defense: 18, magicDefense: 30, mp: 0, exp: 120, gold: 80, element: 'light', weakness: 'dark', elementalResistance: { fire: 0.5, ice: 0.5, thunder: 0.5, light: 0.75 }, skills: ['prism_beam', 'mirror_guard', 'barrier'], description: 'ミラーセンチネル', prescaled: true },
            shrine_guardian: { id: 'shrine_guardian', name: '社の守護機', emoji: '⛩️', hp: 190, maxHp: 190, attack: 20, defense: 18, magicDefense: 22, mp: 30, exp: 120, gold: 0, element: 'light', weakness: 'thunder,dark', elementalResistance: { light: 0.5, fire: 0.5, ice: 0.5 }, skills: ['prism_beam', 'mirror_guard', 'barrier'], description: '社に残された八百万の守護機。心を失った者を社の奥へ通さない。', boss: true, type: 'boss', bossId: 'shrine_guardian', dropTable: [ { id: 'elixir', rate: 0.5 } ] },
            plasma_lancer: { id: 'plasma_lancer', name: 'プラズマランサー', emoji: '🦾', hp: 360, maxHp: 360, attack: 38, defense: 26, magicDefense: 22, mp: 0, exp: 175, gold: 120, element: 'thunder', weakness: 'dark', elementalResistance: { thunder: 0.5, fire: 0.25 }, skills: ['plasma_thrust', 'charge_break', 'overload'], description: 'プラズマランサー', prescaled: true },
            cryo_warden: { id: 'cryo_warden', name: 'クライオウォーデン', emoji: '❄️', hp: 520, maxHp: 520, attack: 34, defense: 44, magicDefense: 38, mp: 0, exp: 190, gold: 130, element: 'ice', weakness: 'fire', elementalResistance: { ice: 0.75, thunder: 0.5 }, skills: ['glacier_slam', 'frost_nova_aoe', 'barrier', 'guard'], description: 'クライオウォーデン', prescaled: true, aoe: true },
            null_revenant: { id: 'null_revenant', name: 'ヌル・レヴナント', emoji: '🕳️', hp: 400, maxHp: 400, attack: 40, defense: 28, magicDefense: 30, mp: 0, exp: 210, gold: 140, element: 'none', weakness: null, elementalResistance: { fire: 0.3, ice: 0.3, thunder: 0.3, dark: 0.3, light: 0.3 }, skills: ['void_grasp', 'null_pulse_aoe', 'curse'], description: 'ヌル・レヴナント', prescaled: true, aoe: true },
            ember_seraph: { id: 'ember_seraph', name: 'エンバーセラフ', emoji: '😈', hp: 470, maxHp: 470, attack: 52, defense: 40, magicDefense: 46, mp: 0, exp: 260, gold: 180, element: 'fire', weakness: 'ice,dark', elementalResistance: { fire: 0.6, light: 0.4 }, skills: ['flare_burst', 'meteor_aoe', 'heat_howl'], description: 'エンバーセラフ', prescaled: true, aoe: true },
            glacier_titan: { id: 'glacier_titan', name: 'グレイシアタイタン', emoji: '🧊', hp: 500, maxHp: 500, attack: 50, defense: 56, magicDefense: 30, mp: 0, exp: 270, gold: 190, element: 'ice', weakness: 'fire,thunder', elementalResistance: { ice: 0.75 }, skills: ['avalanche_aoe', 'glacier_slam', 'harden'], description: 'グレイシアタイタン', prescaled: true, aoe: true },
            oblivion_shade: { id: 'oblivion_shade', name: 'オブリビオンシェイド', emoji: '🌒', hp: 460, maxHp: 460, attack: 48, defense: 38, magicDefense: 52, mp: 0, exp: 280, gold: 200, element: 'dark', weakness: 'light', elementalResistance: { dark: 0.75, ice: 0.4, fire: 0.4 }, skills: ['abyss_lance', 'dark_tide_aoe', 'drain', 'curse'], description: 'オブリビオンシェイド', prescaled: true, aoe: true },
            aegis_colossus: { id: 'aegis_colossus', name: 'イージスコロッサス', emoji: '🛡️', hp: 500, maxHp: 500, attack: 54, defense: 60, magicDefense: 48, mp: 0, exp: 290, gold: 210, element: 'none', weakness: null, elementalResistance: { fire: 0.4, ice: 0.4, thunder: 0.4, dark: 0.5, light: 0.5 }, skills: ['siege_slam', 'crushing_aoe', 'barrier', 'guard'], description: 'イージスコロッサス', prescaled: true, aoe: true },
            archon_deus: { id: 'archon_deus', name: 'アルコン・デウス', emoji: '👑', hp: 2800, maxHp: 2800, attack: 88, defense: 72, magicDefense: 60, mp: 100, exp: 700, gold: 1200, element: 'light', weakness: 'dark,thunder', elementalResistance: { light: 0.6, fire: 0.4, ice: 0.4 }, skills: ['judgment_ray_aoe', 'triple_lance', 'aegis_protocol', 'radiant_nova_burst'], description: 'アルコン・デウス', boss: true, type: 'boss', bossId: 'archon_deus', dropTable: [ { id: 'elixir', rate: 1.0 }, { id: 'deus_executioner', rate: 0.05 }, { id: 'divine_rod', rate: 0.04 }, { id: 'kamui_rod', rate: 0.03 }, { id: 'kamui_orb', rate: 0.03 }, { id: 'deus_crown', rate: 0.05 }, { id: 'deus_gauntlets', rate: 0.05 }, { id: 'empyrean_robe', rate: 0.05 } ] },
            leviathan_core: { id: 'leviathan_core', name: 'リヴァイアサン・コア', emoji: '🐉', hp: 3200, maxHp: 3200, attack: 95, defense: 90, magicDefense: 70, mp: 100, exp: 900, gold: 1500, element: 'none', weakness: null, elementalResistance: { fire: 0.5, ice: 0.5, thunder: 0.5, dark: 0.5, light: 0.5 }, skills: ['data_storm_aoe', 'recursive_strike', 'firewall', 'core_overload_burst'], description: 'リヴァイアサン・コア', boss: true, type: 'boss', bossId: 'leviathan_core', dropTable: [ { id: 'elixir', rate: 1.0 }, { id: 'deus_executioner', rate: 0.05 }, { id: 'deus_staff', rate: 0.04 }, { id: 'deus_bulwark', rate: 0.04 }, { id: 'kamui_staff', rate: 0.03 }, { id: 'kamui_robe', rate: 0.03 }, { id: 'empyrean_robe', rate: 0.05 }, { id: 'cosmos_orb', rate: 0.05 } ] },
            true_deus: { id: 'true_deus', name: '真・デウス', emoji: '🌟', hp: 6000, maxHp: 6000, attack: 120, defense: 100, magicDefense: 100, mp: 200, exp: 2000, gold: 3000, element: 'none', weakness: null, elementalResistance: { fire: 0.5, ice: 0.5, thunder: 0.5, dark: 0.5, light: 0.5 }, skills: ['judgment_ray_aoe', 'radiant_nova_burst', 'core_overload_burst', 'divine_retribution_aoe', 'aegis_protocol'], description: '八百万の神々の総意が具現化した最終審判者', boss: true, type: 'boss', bossId: 'true_deus', dropTable: [ { id: 'elixir', rate: 1.0 }, { id: 'deus_sigil', rate: 0.03 }, { id: 'deus_executioner', rate: 0.05 }, { id: 'deus_staff', rate: 0.04 }, { id: 'divine_rod', rate: 0.04 }, { id: 'deus_bulwark', rate: 0.04 }, { id: 'kamui_katana', rate: 0.04 }, { id: 'kamui_staff', rate: 0.03 }, { id: 'kamui_rod', rate: 0.03 }, { id: 'kamui_robe', rate: 0.03 }, { id: 'kamui_orb', rate: 0.03 } ] }
        });
        const _v2Retrofit = {
            watcher: { weakness: 'thunder', element: 'none', elementalResistance: null },
            patrol_drone: { weakness: 'thunder', element: 'none', elementalResistance: null },
            cerberus: { weakness: 'ice', element: 'fire', elementalResistance: { fire: 0.3 } },
            dustGolem: { weakness: 'thunder,ice', element: 'none', elementalResistance: null },
            alraune: { weakness: 'fire,light', element: 'dark', elementalResistance: { dark: 0.4 } },
            deusMachina: { weakness: 'thunder', element: 'thunder', elementalResistance: { fire: 0.3, ice: 0.3 } },
            data_spider: { weakness: 'fire', element: 'thunder', elementalResistance: { thunder: 0.5 } },
            phantom: { weakness: 'light', element: 'dark', elementalResistance: { dark: 0.6, ice: 0.3 } },
            security_drone: { weakness: 'thunder', element: 'none', elementalResistance: { fire: 0.4 } },
            shadow_entity: { weakness: 'light', element: 'dark', elementalResistance: { dark: 0.6, fire: 0.3 } },
            guard_robo: { weakness: 'thunder,ice', element: 'none', elementalResistance: null },
            glitch_spirit: { weakness: null, element: 'none', elementalResistance: { thunder: 0.5, dark: 0.5, fire: 0.5 } },
            queen_spider: { weakness: 'fire', element: 'ice', elementalResistance: { ice: 0.4 } },
            corrupted_drone_boss: { weakness: 'thunder,ice', element: 'none', elementalResistance: { fire: 0.4, light: 0.3 } },
            rogue_ai_core: { weakness: null, element: 'none', elementalResistance: { fire: 0.5, ice: 0.5, thunder: 0.5, dark: 0.5, light: 0.5 } }
        };
        Object.keys(_v2Retrofit).forEach(id => {
            const e = this.enemyDatabase[id];
            if (!e) return;
            Object.assign(e, _v2Retrofit[id]);
            // HP retrofit removed (was ×1.7 → balanced to ×1.0)
        });
        this.encounterTables = {
            city:    ['watcher', 'patrol_drone', 'rust_rat', 'spark_moth', 'watcher', 'patrol_drone'],
            subway:  ['data_spider', 'frost_widow', 'dustGolem', 'static_wisp', 'cerberus'],
            shrine:  ['phantom', 'venom_bloom', 'alraune', 'watcher'],
            garden:  ['alraune', 'venom_bloom', 'cinder_hound', 'security_drone', 'data_spider'],
            market:  ['shadow_entity', 'oblivion_shade', 'deusMachina', 'mirror_sentinel', 'cerberus'],
            gov:     ['guard_robo', 'glitch_spirit', 'plasma_lancer', 'cryo_warden', 'deusMachina'],
            dungeon: ['queen_spider', 'null_revenant', 'salt_pillar', 'glitch_spirit', 'aegis_colossus', 'oblivion_shade', 'dustGolem']
        };

    }
    
    // ランダムエンカウント歩数を決定
    // 注: countStep は1フレーム単位でカウントされるため、実距離としては
    //     1 タイル ≈ 10〜12 フレームの感覚で値を設定する
    getRandomEncounterSteps(encounterRate = 'medium') {
        const rateSettings = {
            extreme:   { min: 60,  max: 100 },  // 最危険（深層ダンジョン）
            very_high: { min: 90,  max: 140 },  // 危険エリア（都庁など）
            high:      { min: 160, max: 240 },  // 地下鉄など
            medium:    { min: 260, max: 400 },  // 通常エリア
            low:       { min: 500, max: 750 },  // 植物園・神社など
            none:      { min: 9999, max: 9999 }
        };

        const settings = rateSettings[encounterRate] || rateSettings.medium;
        return Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
    }

    // 歩数をカウント
    countStep(currentArea = 'city', encounterRate = 'medium') {
        if (this.inBattle) return;
        // マップ遷移中はエンカウント抽選しない。遷移とエンカウントが同フレームで
        // 競合すると、遷移の遅延フィールドBGM要求が戦闘BGMを上書きする不具合になる。
        if (window.mapSystem && window.mapSystem.transitioning) return;

        if (encounterRate === 'none') {
            this.encounterSteps = 0;
            return;
        }

        this.encounterSteps++;

        // 初回エンカウントは大幅に遅らせる（ゲーム開始直後の即戦闘を防ぐ）
        const threshold = this.firstEncounter
            ? this.encounterThreshold + 120
            : this.encounterThreshold;

        if (this.encounterSteps >= threshold) {
            this.firstEncounter = false;
            this.encounterSteps = 0;
            this.encounterThreshold = this.getRandomEncounterSteps(encounterRate);

            // 閾値超え後にもう一段の発生確率（低めに設定）
            const encounterChance = {
                extreme:   0.8,
                very_high: 0.7,
                high:      0.55,
                medium:    0.4,
                low:       0.25
            };

            const chance = encounterChance[encounterRate] || 0.4;
            if (Math.random() < chance) {
                this.triggerRandomEncounter(currentArea);
            } else {
                // 不発時はわずかに早める程度（旧来の0.7から0.92へ）
                this.encounterThreshold = Math.floor(this.encounterThreshold * 0.92);
            }
        }
    }
    
    // ランダムエンカウント発生
    // エリア（敵"種"テーブル）に加え、現在マップの zone（tier/levelRange）で
    // ステータスをスケールし「ダンジョンごとに敵の強さが違う」を成立させる。
    triggerRandomEncounter(area) {
        // 現在マップの難易度帯を取得（quest章進行に対応）。未定義なら tier1/該当areaテーブル。
        const zone = (typeof window !== 'undefined' && window.mapSystem && window.mapSystem.getEncounterZone)
            ? window.mapSystem.getEncounterZone()
            : null;
        const tableKey = (zone && zone.table) || area;
        // ★マルチ敵: 1-3体の群れを生成（同種複数/混成/前衛重の3パターン・分布はtableで維持）。
        const group = this.buildEncounterGroup(zone, tableKey);
        if (!group.length) return;
        console.log('エンカウント:', group.map(e => `${e.name}Lv${e.level}`).join(' / '), `(${group.length}体)`);
        this.startBattle(group);
    }

    // 単体の敵を tier倍率＋帯内レベルでスケールして生成（triggerから抽出・マルチ敵で再利用）
    makeScaledEnemy(enemyId, zone) {
        const base = this.enemyDatabase[enemyId];
        if (!base) return null;
        const tier = (zone && zone.tier) || 1;
        const mult = this.tierMultiplier[tier] || 1.0;
        const range = (zone && zone.levelRange) || [1, 1];
        const level = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
        // ★prescaled な敵(v2新規)は hp/atk/def/exp/gold すべて tier最終値（×1）。既存敵は base×tier。
        //   (新規敵の content値はその敵固有の最終値。zone tier で二重スケールしない＝レベリング過剰を防ぐ)
        const m = base.prescaled ? 1 : mult;
        const sc = (v) => Math.max(1, Math.round((v || 0) * m));
        const hp = sc(base.hp);
        return {
            ...base, hp, maxHp: hp, currentHp: hp, currentMp: base.mp || 0,
            attack: sc(base.attack), defense: sc(base.defense), exp: sc(base.exp), gold: sc(base.gold),
            // ★v2: 魔法防御は未定義なら物理防御の半分。属性/弱点/耐性は未定義なら無し(倍率1.0)。
            magicDefense: (base.magicDefense != null) ? sc(base.magicDefense) : Math.floor(sc(base.defense) * 0.5),
            element: base.element || 'none', weakness: base.weakness || null, elementalResistance: base.elementalResistance || null,
            level, id: enemyId, statusAilments: {}
        };
    }

    // エンカウント群を生成: 1-3体・分布は area の encounterTable で維持・組み合わせ3パターン。
    //   均一(同種をcount体) / 混成(table内の異種優先) / 前衛重(強敵1+雑魚で固める)。
    //   1体も残す＝序盤の単体戦の体感を維持しつつ、複数戦でレベリングを楽にする。
    buildEncounterGroup(zone, tableKey) {
        const key = tableKey || (zone && zone.table) || 'city';
        const table = this.encounterTables[key] || this.encounterTables.city;
        const roll = Math.random();
        const count = roll < 0.34 ? 1 : (roll < 0.74 ? 2 : 3); // 1体34% / 2体40% / 3体26%
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        let ids = [];
        if (count === 1) {
            ids = [pick(table)];
        } else {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) {
                // 均一: 同種を count 体（「同じキャラを3体」）
                const id = pick(table);
                ids = Array.from({ length: count }, () => id);
            } else if (pat === 1) {
                // 混成: table内の異種を優先（「AとBが並ぶ」）
                const pool = [...new Set(table)];
                for (let i = 0; i < count; i++) ids.push(pool.length ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : pick(table));
            } else {
                // 前衛重: 強敵(table末尾寄り)1体＋雑魚(table先頭)で固める
                ids = [table[table.length - 1], ...Array.from({ length: count - 1 }, () => table[0])];
            }
        }
        return ids.map(id => this.makeScaledEnemy(id, zone)).filter(Boolean);
    }

    // 生存している敵の配列
    livingEnemies() {
        return (this.enemies || []).filter(e => e && e.currentHp > 0);
    }

    // ★v2 バフ倍率（character.buffs[stat]={mul,turns}）。stat: physDef/magDef/atk/mag
    _buffMul(c, stat) {
        const b = c && c.buffs && c.buffs[stat];
        return (b && b.turns > 0 && b.mul) ? b.mul : 1;
    }

    // ★v2 バフ/挑発の持続ターンを1減らす（ラウンド終了時に各メンバーへ）
    tickBuffs(c) {
        if (c && c.buffs) {
            Object.keys(c.buffs).forEach(k => {
                if (c.buffs[k] && c.buffs[k].turns > 0) { c.buffs[k].turns--; if (c.buffs[k].turns <= 0) delete c.buffs[k]; }
            });
        }
        if (c && c.taunting > 0) c.taunting--;
    }

    // ターゲット解決: 指定indexが生存ならそれ、死んでいれば先頭の生存敵、全滅でもnullを返さない。
    resolveEnemyTarget(idx) {
        const list = this.enemies || [];
        if (typeof idx === 'number' && list[idx] && list[idx].currentHp > 0) return list[idx];
        const living = this.livingEnemies();
        return living[0] || list[idx] || list[0] || this.currentEnemy || null;
    }

    // 報酬の全敵合算（EXP/Gold）。「3体分のポイントが入る」=レベリング緩和の核。
    computeBattleRewards() {
        const list = (this.enemies && this.enemies.length) ? this.enemies : (this.currentEnemy ? [this.currentEnemy] : []);
        let exp = 0, gold = 0;
        list.forEach(e => { if (e) { exp += (e.exp || 0); gold += (e.gold || 0); } });
        return { exp, gold };
    }

    // 群れの表示名（"スパイダー×3" / "ドローン と ゴーレム" / 単体名）
    enemyGroupName() {
        const list = (this.enemies && this.enemies.length) ? this.enemies : (this.currentEnemy ? [this.currentEnemy] : []);
        if (list.length <= 1) return (list[0] || {}).name || 'てき';
        const counts = {};
        list.forEach(e => { counts[e.name] = (counts[e.name] || 0) + 1; });
        return Object.entries(counts).map(([n, c]) => (c > 1 ? `${n}×${c}` : n)).join(' と ');
    }
    
    // 戦闘開始
    startBattle(enemyOrGroup, isBossBattle = false, onBossDefeat = null) {
        if (window.playSE) window.playSE('encounter');
        this.inBattle = true;
        // ★単体(ボス/旧API)も配列(マルチ敵)も受ける。内部は常に this.enemies 配列で扱う。
        const group = Array.isArray(enemyOrGroup) ? enemyOrGroup : [enemyOrGroup];
        this.enemies = group.filter(Boolean).map(e => {
            const copy = { ...e };
            if (!copy.currentHp) copy.currentHp = copy.hp;
            if (!copy.maxHp) copy.maxHp = copy.hp;
            if (!copy.currentMp) copy.currentMp = copy.mp || 0;
            // ★v2: 魔法防御/属性/弱点の既定（ボス等 makeScaledEnemy を通らない敵でも v2式が NaN にならない）
            if (copy.magicDefense == null) copy.magicDefense = Math.floor((copy.defense || 0) * 0.5);
            if (copy.element == null) copy.element = 'none';
            if (copy.weakness === undefined) copy.weakness = null;
            copy.statusAilments = {};
            return copy;
        });
        if (!this.enemies.length) this.enemies = [{ ...group[0] }];
        this.currentEnemy = this.enemies[0];     // 表示/行動の「現在の敵」ポインタ
        this.targetEnemyIndex = 0;
        this.isBossBattle = isBossBattle || this.currentEnemy.boss || false;
        this.onBossDefeat = onBossDefeat;

        this.selectedCommand = 0;
        this.battleLog = [];
        this._resetBattleMessages();  // メッセージ部品をリセット（前回戦闘の残りを消す）
        this.turnCount = 1;
        this._akariRescueDone = false;  // ★案B: 戦闘毎にリセット。乱入が中断/半完了しても再挑戦で再び発火できる(softlock防止)
        this.waitingForCommand = false; // 初期状態では待機しない

        // 戦闘画像のプリロード（背景・敵画像をブラウザキャッシュへウォームアップ。await不要・失敗は無視）
        try {
            const mapSystem = window.mapSystem;
            const mapId = mapSystem?.currentMap || '';
            const currentMap = mapId && mapSystem?.maps ? mapSystem.maps[mapId] : null;
            let area = currentMap?.area || '';
            if (!area && typeof mapSystem?.getCurrentArea === 'function') {
                area = mapSystem.getCurrentArea() || '';
            }
            const bgWarm = new Image();
            bgWarm.onerror = () => {};
            bgWarm.src = this.getBattleBackground(area, mapId);
            const enemyImagePath = this.getEnemyImagePath(this.currentEnemy);
            if (enemyImagePath) {
                const enemyWarm = new Image();
                enemyWarm.onerror = () => {};
                enemyWarm.src = enemyImagePath;
            }
        } catch (e) {
            // プリロード失敗は無視（表示時に通常ロードされる）
        }

        // 戦闘画面表示
        this.showBattleScreen();
        this.addBattleLog(`${this.enemyGroupName()}が あらわれた！`);

        // パーティメンバーのステータス異常をクリア
        const allMembers = this.getPartyMembers();
        allMembers.forEach(member => {
            if (!member.statusAilments) {
                member.statusAilments = {};
            }
        });

        // 最初のターンのコマンド表示
        setTimeout(() => {
            this.startPlayerTurn();
        }, 1000);

        // 戦闘BGM開始（新しいBGMシステムを使用）
        // ★修正: 旧コードは未定義の `enemy` を参照(startBattle引数を enemyOrGroup に改名した際の取りこぼし)。
        //   ReferenceError が startBattle 末尾で送出され、BGM未開始＋gameLoopへ例外伝播でフィールド描画停止
        //   (戦闘後に画面真っ暗)の二重バグになっていた。isBossBattle フラグで判定する。
        if (window.bgmSystem) {
            window.bgmSystem.startBattleBGM(this.isBossBattle || false);
        }
    }

    // ボス戦を開始するヘルパーメソッド
    startBossBattle(bossId, onDefeat = null) {
        const bossData = this.enemyDatabase[bossId];
        if (!bossData) {
            console.error(`Boss ${bossId} not found in enemy database`);
            return false;
        }

        const boss = {
            ...bossData,
            currentHp: bossData.hp,
            currentMp: bossData.mp || 0,
            maxHp: bossData.maxHp || bossData.hp,
            id: bossId
        };

        this.startBattle(boss, true, onDefeat);
        console.log(`🔥 Boss battle started: ${boss.name}`);
        return true;
    }

    // プレイヤーターン開始
    startPlayerTurn() {
        // ★案B: 単騎Ω戦の2ターン目開始時にアカリが乱入加入。加入後この関数を再実行し、2人でターンを始める。
        if (this.turnCount >= 2 && this._omegaRescuePending()) {
            this._doOmegaRescue(() => this.startPlayerTurn());
            return;
        }
        // 多重起動の検出
        if (this.executingTurn) {
            console.warn('[Battle] startPlayerTurn called while executingTurn=true; resetting flag');
            this.executingTurn = false;
        }
        // 計画フェーズの残骸を掃除
        this.kamuiPlanning = false;
        this.kamuiPlanningMember = null;
        this.kamuiSkillExecuting = false;
        this.kamuiSkillMenuActive = false;
        const kamuiMenu = document.getElementById('kamuiSkillMenu');
        if (kamuiMenu) kamuiMenu.style.display = 'none';

        // パーティメンバーを取得
        const partyMembers = this.getPartyMembers();

        // パーティコマンドを初期化
        this.partyCommands = partyMembers.map(() => null);
        this.currentMemberIndex = 0;
        this.allCommandsSelected = false;

        this.addBattleLog(`ターン ${this.turnCount}`);

        // 最初のメンバーのコマンド選択開始
        this.showNextMemberCommand();
    }

    // パーティメンバーを取得
    getPartyMembers() {
        const members = [window.player];
        if (window.partySystem) {
            members.push(...window.partySystem.getMembers());
        }
        return members;
    }

    // ★案B: アカリ乱入加入の発火判定。単騎Ω戦(corrupted_drone_boss)・再会済(akariReunited)・未加入(!akariJoined)・未実行のとき true。
    _omegaRescuePending() {
        if (this._akariRescueDone) return false;
        const sf = (typeof window !== 'undefined' && window.storyFlags) || {};
        if (!sf.akariReunited || sf.akariJoined) return false;
        return (this.enemies || []).some(e => e && e.bossId === 'corrupted_drone_boss');
    }

    // ★案B: 戦闘の最中にアカリが乱入。ビート演出→カイトを回復→正式加入(joinMember)→UI再構築→cbで戦闘継続。
    //   加入を partyCommands 初期化より前(startPlayerTurn 冒頭 or gameOver安全網)で行うため配列長ズレが起きない。
    _doOmegaRescue(cb) {
        this._akariRescueDone = true;
        this.presentBeat([
            'カイト——！！',
            'アカリが 地下へ 駆け降りてくる！',
            '「もう、独りで 死なせない」',
            'アカリの 回復魔法が カイトを 包む！'
        ]);
        this.afterBattleMessages(() => {
            // ★joinMember はフィールドUI関数(updateUI/refreshObjective)を呼ぶ。万一そこで例外が出ても
            //   afterBattleMessagesのドレインに握り潰され、続行cb(startPlayerTurn)が登録されず戦闘が固まる。
            //   try/catchで隔離し、必ず cb まで到達させる(戦闘継続を最優先)。
            try {
                const p = window.player;
                if (p) p.hp = Math.max(p.hp || 0, Math.round((p.maxHp || 1) * 0.7));  // 死に際救出でも7割まで回復
                if (typeof window.joinMember === 'function') window.joinMember('akari');  // akariJoined=true・装備/スキル付与
                if (this.updatePartyStatus) this.updatePartyStatus();
                if (this.updateBattleUI) this.updateBattleUI();
            } catch (e) {
                console.error('[Battle] アカリ乱入加入の処理で例外(戦闘は継続):', e);
            }
            this.presentBeat(['アカリが 戦列に 加わった！']);
            this.afterBattleMessages(() => { if (typeof cb === 'function') cb(); });
        });
    }

    // 次のメンバーのコマンド選択を表示
    showNextMemberCommand() {
        const partyMembers = this.getPartyMembers();

        if (this.currentMemberIndex >= partyMembers.length) {
            // 全員のコマンド選択完了
            this.allCommandsSelected = true;
            this.executeTurn();
            return;
        }

        const currentMember = partyMembers[this.currentMemberIndex];

        // ★戦闘不能(HP0)は行動不能＝コマンド選択させず自動スキップ（蘇生するまで操作不可）。
        //   麻痺/毒など通常の状態異常はターン毎に確率回復するが、戦闘不能は回復まで復帰しない。
        if ((currentMember.hp || 0) <= 0) {
            this.partyCommands[this.currentMemberIndex] = { member: currentMember, command: 'skip' };
            this.currentMemberIndex++;
            this.showNextMemberCommand();
            return;
        }

        // ステータス異常チェック
        const ailmentResult = this.checkStatusAilmentBeforeAction(currentMember);

        if (ailmentResult.skipAction) {
            // 行動不能の場合、自動的に次のメンバーへ
            this.partyCommands[this.currentMemberIndex] = {
                member: currentMember,
                command: 'skip'
            };
            this.currentMemberIndex++;
            this.showNextMemberCommand();
            return;
        }

        // ★「○○の こうどう」のログは出さない。誰の入力番かは下のパーティUIのハイライト
        //   (updateCurrentMemberDisplay)で示す。ここでログを足すと人数分のノイズ行が並び、
        //   実際の行動ログ(「○○の攻撃」)の前に「○○のこうどう」が連発する違和感の原因になる。
        this.waitingForCommand = true;
        this.selectedCommand = 0;
        this.showCommands();
        this.updateCurrentMemberDisplay();
    }

    // 現在選択中のメンバーをUIに表示
    updateCurrentMemberDisplay() {
        const partyMembers = this.getPartyMembers();
        const statusContainer = document.getElementById('battlePartyStatus');
        if (!statusContainer) return;

        // 全てのステータスボックスのハイライトを更新
        const statusBoxes = statusContainer.children;
        for (let i = 0; i < statusBoxes.length; i++) {
            if (i === this.currentMemberIndex && this.waitingForCommand) {
                statusBoxes[i].style.border = '3px solid #ffff00';
                statusBoxes[i].style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.8)';
            } else {
                statusBoxes[i].style.border = '2px solid #00ffff';
                statusBoxes[i].style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
            }
        }
    }

    // ターン実行（全員のコマンドを速度順に実行）
    executeTurn() {
        if (this.executingTurn) {
            console.warn('[Battle] executeTurn already in progress, ignoring duplicate call');
            return;
        }
        this.executingTurn = true;
        console.log('Executing turn with commands:', this.partyCommands);

        // 全てのハイライトをクリア
        const statusContainer = document.getElementById('battlePartyStatus');
        if (statusContainer) {
            const statusBoxes = statusContainer.children;
            for (let i = 0; i < statusBoxes.length; i++) {
                statusBoxes[i].style.border = '2px solid #00ffff';
                statusBoxes[i].style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
            }
        }

        // パーティメンバーの行動を速度順にソート
        const actions = this.partyCommands
            .map((cmd, index) => ({
                ...cmd,
                speed: cmd.member.speed || 5,
                index
            }))
            .sort((a, b) => b.speed - a.speed); // 速度が高い順

        // 行動を順番に実行
        this.executeActionsSequentially(actions, 0);
    }

    // 行動を順番に実行
    executeActionsSequentially(actions, actionIndex) {
        if (actionIndex >= actions.length) {
            // 全員の行動が終わったら敵のターンへ（直前ビートの表示完了後に同期）
            this.executingTurn = false;
            this.afterBattleMessages(() => this.enemyTurn(window.player));
            return;
        }

        const action = actions[actionIndex];
        const member = action.member;
        const command = action.command;

        console.log(`Executing action for ${member.name}: ${command}`);

        // コマンドを実行
        switch (command) {
            case 'attack':
                this.memberAttack(member, () => {
                    this.executeActionsSequentially(actions, actionIndex + 1);
                }, action.enemyTarget);
                break;
            case 'kamui':
                // magicId / targetIndex は計画フェーズで確定済み
                this.memberKamui(member, () => {
                    this.executeActionsSequentially(actions, actionIndex + 1);
                }, action.magicId, action.targetIndex);
                break;
            case 'defend':
                this.memberDefend(member, () => {
                    this.executeActionsSequentially(actions, actionIndex + 1);
                });
                break;
            case 'item':
                // アイテム使用も行動フェーズで実行（攻撃等と同じ並び・速度順）
                this.memberUseItem(member, () => {
                    this.executeActionsSequentially(actions, actionIndex + 1);
                }, action.itemId, action.targetIndex);
                break;
            case 'skip':
                // 行動不能などスキップ（スキップ告知ビートの表示完了後に次へ）
                this.afterBattleMessages(() => {
                    this.executeActionsSequentially(actions, actionIndex + 1);
                });
                break;
            default:
                this.executeActionsSequentially(actions, actionIndex + 1);
                break;
        }
    }

    // メンバーの攻撃
    memberAttack(member, callback, enemyTarget) {
        // ★対象を解決（選択敵が既に死んでいれば生存敵へ振替）。this.currentEnemy をその敵に向ける。
        this.currentEnemy = this.resolveEnemyTarget(enemyTarget);
        const enemyIdx = (this.enemies || []).indexOf(this.currentEnemy);
        const baseDamage = (member.attack || 10) * this._buffMul(member, 'atk');   // ★ウォークライ等の攻撃バフ
        const variance = Math.floor(Math.random() * 5) - 2;
        let damage = Math.max(1, Math.floor(baseDamage) + variance - Math.floor(this.currentEnemy.defense / 2));

        // クリティカル判定
        const criticalResult = this.checkCritical(member, this.currentEnemy);
        const isCritical = criticalResult.isCritical;

        if (isCritical) damage = Math.floor(damage * criticalResult.multiplier);
        this.currentEnemy.currentHp = Math.max(0, this.currentEnemy.currentHp - damage);

        // ★攻撃→(会心)→ダメージ→(結果) を1ビートで表示。ダメージ数字/被弾フラッシュ/HPバーは
        //   「ダメージ行」が表示された瞬間に発火させ、メッセージと完全連動させる。
        const killed = this.currentEnemy.currentHp <= 0;
        const atkMsgs = isCritical
            ? [`${member.name}の こうげき！`, `かいしんの いちげき！`, `${this.currentEnemy.name}に ${Math.floor(damage)}の ダメージ！`]
            : [`${member.name}の こうげき！`, `${this.currentEnemy.name}に ${Math.floor(damage)}の ダメージ！`];
        if (killed) atkMsgs.push(`${this.currentEnemy.name}を たおした！`); // 結果行はビートの最後
        const dmgIdx = isCritical ? 2 : 1;
        const fx = [];
        fx[dmgIdx] = () => { this.showDamageEffect(damage, true, isCritical, enemyIdx); this.updateBattleUI(); };
        this.presentBeat(atkMsgs, { fx });
        this.afterBattleMessages(() => {
            // ★全敵を倒したときだけ勝利。1体撃破でも他が生存していれば次の行動へ継続。
            if (this.livingEnemies().length === 0) {
                this.updateBattleUI();
                this.battleVictory(window.player);
            } else if (callback) {
                callback();
            }
        });
    }

    // クリティカル判定
    checkCritical(attacker, target) {
        let critRate = 0.05; // 基本クリティカル率 5%

        // 速度による補正
        const attackerSpeed = attacker.speed || attacker.baseSpeed || 5;
        const targetSpeed = target.speed || 5;

        if (attackerSpeed >= targetSpeed * 2) {
            critRate += 0.10; // 速度が2倍以上なら +10%
        } else if (attackerSpeed >= targetSpeed * 1.5) {
            critRate += 0.05; // 速度が1.5倍以上なら +5%
        }

        const isCritical = Math.random() < critRate;
        const multiplier = isCritical ? 1.5 + Math.random() * 0.5 : 1.0; // 1.5x ~ 2.0x

        return { isCritical, multiplier, critRate };
    }

    // ステータス異常を付与。silent=true なら表示せずメッセージ文字列を返す
    // （呼び出し側が同一ビートに結果行として畳み込むため）。
    applyStatusAilment(target, ailmentType, duration = 3, silent = false) {
        if (!target.statusAilments) {
            target.statusAilments = {};
        }

        target.statusAilments[ailmentType] = duration;

        const ailmentNames = {
            poison: 'どく',
            paralysis: 'まひ',
            confusion: 'こんらん',
            sleep: 'ねむり',
            curse: 'のろい'
        };

        const msg = `${target.name}は ${ailmentNames[ailmentType]}になった！`;
        if (!silent) this.addBattleLog(msg);
        return msg;
    }

    // 行動前のステータス異常チェック
    checkStatusAilmentBeforeAction(character) {
        if (!character.statusAilments) {
            return { skipAction: false };
        }

        // 睡眠チェック
        if (character.statusAilments.sleep > 0) {
            this.addBattleLog(`${character.name}は ねむっている...`);
            return { skipAction: true };
        }

        // 麻痺チェック（50%確率で行動不能）
        if (character.statusAilments.paralysis > 0) {
            if (Math.random() < 0.5) {
                this.addBattleLog(`${character.name}は しびれて うごけない！`);
                return { skipAction: true };
            }
        }

        // 混乱チェック（後で攻撃時に処理）
        return { skipAction: false };
    }

    // ターン終了時のステータス異常処理（メッセージ行の配列を返す。表示は呼び出し側が1ビートで）
    processStatusAilmentsEndTurn(character) {
        const lines = [];
        this.tickBuffs(character);   // ★v2: バフ/挑発の持続を1ターン減らす（異常無しでも実行）
        if (!character.statusAilments) return lines;

        // 毒ダメージ
        if (character.statusAilments.poison > 0) {
            const poisonDamage = Math.floor(character.maxHp * 0.1);
            character.hp = Math.max(0, character.hp - poisonDamage);
            lines.push(`${character.name}は どくの ダメージを うけた！`);
            lines.push(`${character.name}に ${poisonDamage}の ダメージ！`);
        }

        // ステータス異常の持続ターンを減らす
        Object.keys(character.statusAilments).forEach(ailment => {
            character.statusAilments[ailment]--;
            if (character.statusAilments[ailment] <= 0) {
                delete character.statusAilments[ailment];

                const ailmentNames = {
                    poison: 'どく',
                    paralysis: 'まひ',
                    confusion: 'こんらん',
                    sleep: 'ねむり',
                    curse: 'のろい'
                };

                lines.push(`${character.name}の ${ailmentNames[ailment]}が なおった！`);
            }
        });

        this.updateBattleUI();
        return lines;
    }

    // メンバーのカムイ
    memberKamui(member, callback, magicId = null, targetIndex = 'enemy') {
        // 魔法IDが指定されていない場合は、習得済みカムイスキル一覧を表示
        if (!magicId) {
            this.showKamuiSkillSelection(member, callback);
            return;
        }

        // ★v2: 対象種別で分岐（全体攻撃 / 全体味方）。それ以外は従来の単体経路。
        const skillDef = window.magicSystem.getLearnedSkill ? window.magicSystem.getLearnedSkill(member, magicId) : null;
        const ttype = (skillDef && skillDef.target) || 'single';
        if (ttype === 'all') { this._kamuiAllEnemies(member, callback, magicId, skillDef); return; }
        if (ttype === 'allyAll') { this._kamuiAllAllies(member, callback, magicId, skillDef); return; }

        // 対象を解決。攻撃系は 'enemy'(=生存敵へ自動) または 'enemy:N'(=N番目の敵を指定)。
        let target = null;
        if (targetIndex === 'self') {
            target = member;
        } else if (typeof targetIndex === 'string' && targetIndex.indexOf('enemy') === 0) {
            const m = targetIndex.match(/enemy:(\d+)/);
            target = this.resolveEnemyTarget(m ? parseInt(m[1], 10) : undefined);
            this.currentEnemy = target;   // ★FX/撃破判定がこの敵を指すよう再ポイント
        } else if (typeof targetIndex === 'number') {
            const partyMembers = this.getPartyMembers();
            target = partyMembers[targetIndex] || member;
        } else {
            target = this.resolveEnemyTarget();
            this.currentEnemy = target;
        }

        console.log('[DEBUG] memberKamui called with:', {
            magicId,
            memberName: member.name,
            memberMp: member.mp,
            targetIndex,
            targetName: target ? target.name : 'none',
            inBattle: true
        });

        // 魔法システムから使用
        const result = window.magicSystem.useMagic(magicId, member, target, true);

        console.log('[DEBUG] useMagic result:', result);

        if (!result.success) {
            this.presentBeat([result.message]);
            this.afterBattleMessages(() => { if (callback) callback(); });
            return;
        }

        // 召喚→効果→(結果) を1ビートで。ダメージ系は効果行(result.message)と同時にエフェクト発火
        const enemyIdx = (this.enemies || []).indexOf(this.currentEnemy);
        const kamuiKilled = this.currentEnemy && this.currentEnemy.currentHp <= 0 && result.damage > 0;
        const kMsgs = [`${member.name}は ${result.magic.name}を よびだした！`, result.message];
        if (kamuiKilled) kMsgs.push(`${this.currentEnemy.name}を たおした！`);
        const fx = []; fx[1] = () => {
            if (result.damage && result.damage > 0) this.showDamageEffect(result.damage, true, true, enemyIdx);
            this.updateBattleUI();
        };
        this.presentBeat(kMsgs, { fx });
        this.afterBattleMessages(() => {
            // ★全敵撃破でのみ勝利。1体撃破でも生存敵がいれば次の行動へ。
            if (this.livingEnemies().length === 0) {
                this.updateBattleUI();
                this.battleVictory(window.player);
            } else if (callback) {
                callback();
            }
        });
    }

    // ★全体攻撃スキル: 生存敵全員へ独立ロール（MPは1回消費）。各敵のダメージを1ビートに連ねる。
    _kamuiAllEnemies(member, callback, magicId, skillDef) {
        if (member.mp < (skillDef ? skillDef.mpCost : 0)) {
            this.presentBeat(['MPが たりない！']);
            this.afterBattleMessages(() => { if (callback) callback(); });
            return;
        }
        const living = this.livingEnemies();
        if (!living.length) { if (callback) callback(); return; }
        const lines = [`${member.name}は ${skillDef.name}を よびだした！`];
        const fx = [];
        living.forEach((enemy, i) => {
            const res = window.magicSystem.useMagic(magicId, member, enemy, true, i > 0);  // 2体目以降はMP消費スキップ
            if (!res || !res.success) return;
            const idx = (this.enemies || []).indexOf(enemy);
            const dmgLine = lines.length;
            const tag = res.weak ? '　ばつぐん！' : '';
            lines.push(`${enemy.name}に ${res.damage}の ダメージ！${tag}`);
            fx[dmgLine] = () => { this.showDamageEffect(res.damage, true, true, idx); this.updateBattleUI(); };
            if (enemy.currentHp <= 0) lines.push(`${enemy.name}を たおした！`);
        });
        this.presentBeat(lines, { fx });
        this.afterBattleMessages(() => {
            if (this.livingEnemies().length === 0) { this.updateBattleUI(); this.battleVictory(window.player); }
            else if (callback) callback();
        });
    }

    // ★全体味方スキル: 回復/蘇生/バフを味方全員へ（MPは1回消費）。
    _kamuiAllAllies(member, callback, magicId, skillDef) {
        if (member.mp < (skillDef ? skillDef.mpCost : 0)) {
            this.presentBeat(['MPが たりない！']);
            this.afterBattleMessages(() => { if (callback) callback(); });
            return;
        }
        const party = this.getPartyMembers();
        const lines = [`${member.name}は ${skillDef.name}を となえた！`];
        party.forEach((m, i) => {
            const res = window.magicSystem.useMagic(magicId, member, m, true, i > 0);
            if (res && res.success && res.message) lines.push(res.message.split('\n').pop());
        });
        const fx = []; fx[lines.length - 1] = () => { this.updateBattleUI(); if (window.updateUI) window.updateUI(); };
        this.presentBeat(lines, { fx });
        this.afterBattleMessages(() => { if (callback) callback(); });
    }

    // ===== カムイスキル「計画フェーズ」=====
    // 「特技」コマンドを選んだ瞬間に battle-commands のリストを
    // スキル選択 → 対象選択 と段階的に切り替える。各段階の表示は
    // 通常コマンドと同じ command-item 形式で統一。
    beginKamuiPlanning() {
        if (this.kamuiPlanning) return;
        const partyMembers = this.getPartyMembers();
        const member = partyMembers[this.currentMemberIndex];
        if (!member) return;

        if (!window.magicSystem) {
            this.addBattleLog('魔法システムが初期化されていません');
            return;
        }
        const skills = window.magicSystem.getLearnedMagic(member);
        if (!skills || skills.length === 0) {
            this.addBattleLog(`${member.name || 'カイト'}は スキルを 習得していない！`);
            return;
        }

        this.kamuiPlanning = true;
        this.kamuiPlanningMember = member;
        this.availableSkills = skills;
        this.commandPhase = 'skill';
        this.selectedCommand = 0;
        this.waitingForCommand = true;

        this.renderSkillPhase();
    }

    // スキルリストをメッセージパネルに描画
    renderSkillPhase() {
        // ★2列表示＋消費MP明示（見やすさ/操作しやすさ）。MP不足は赤・全体スキルは「全」タグ。
        const member = this.kamuiPlanningMember;
        const curMp = member ? (member.mp || 0) : 0;
        const items = this.availableSkills.map((skill, index) => {
            const cost = skill.mpCost || 0;
            const afford = curMp >= cost;
            const mpHtml = `<span style="color:${afford ? '#88aaff' : '#ff6b6b'}; font-size:10px; margin-left:4px;">MP${cost}</span>`;
            const allTag = (skill.target === 'all' || skill.target === 'allyAll') ? ' <span style="color:#facc15; font-size:9px;">全</span>' : '';
            return {
                html: `${skill.emoji || ''} ${skill.name}${mpHtml}${allTag}`,
                onClick: () => {
                    this.selectedCommand = index;
                    this.refreshCurrentPhaseSelection();
                    this.confirmSkillSelection();
                }
            };
        });

        // キャンセル項目
        items.push({
            html: '↩ もどる',
            color: '#ff8888',
            onClick: () => this.cancelKamuiPlanning()
        });

        const memberName = (member && member.name) || 'カイト';
        BattlePanel.renderCommands(items, {
            headerLabel: `${memberName} のスキル`,
            title: '⚡ スキル',
            selectedIndex: this.selectedCommand,
            listMode: true   // ★1列のまま「一覧表」スタイル(枠を外した密な行)へ。メニューと作法を統一。
                             //   2列はパネル幅で名前が潰れ列が重なるため不可。消費MP/全タグは各行に明示。
        });
    }

    // スキル決定 → ターゲットが必要なら 'target' フェーズに、不要ならコマンド確定
    confirmSkillSelection() {
        if (!this.kamuiPlanning) return;
        const skill = this.availableSkills[this.selectedCommand];
        if (!skill) return;

        // MP 不足なら何もしない（赤い警告のみ）
        const member = this.kamuiPlanningMember;
        if (member && member.mp < skill.mpCost) {
            this.addBattleLog('MPが たりない！');
            return;
        }

        this.pendingMagic = skill;
        const tgt = skill.target || 'single';

        // ★v2: 対象範囲で分岐
        if (tgt === 'all') {
            // 全体攻撃: 対象選択なしで確定（生存敵全員）
            this.commitKamuiCommand(skill.id, 'all');
        } else if (tgt === 'allyAll') {
            // 全体味方（全体回復/蘇生/バフ）: 対象選択なしで確定
            this.commitKamuiCommand(skill.id, 'allyAll');
        } else if (tgt === 'self' || (skill.type === 'support' && tgt !== 'ally')) {
            // 自分のみ（バフ等）: 自動確定
            this.commitKamuiCommand(skill.id, 'self');
        } else if (skill.type === 'healing' || skill.type === 'revive' || skill.type === 'support' || tgt === 'ally') {
            // 単体味方を選ぶ（回復/蘇生/単体バフ。蘇生は戦闘不能の味方が対象）
            this.targetMode = 'skill';   // キャンセル時はスキル選択へ戻す
            this.availableTargets = this.getPartyMembers().map((m, i) => ({ member: m, index: i, scope: 'ally' }));
            this.commandPhase = 'target';
            this.selectedCommand = 0;
            this.renderTargetPhase('ally');
        } else {
            // offensive / kamui 単体: 敵が複数なら対象を選ぶ、単体なら自動。
            const living = this.livingEnemies();
            if (living.length > 1) {
                this.beginEnemyTargeting('skill', (enemyIdx) => this.commitKamuiCommand(skill.id, 'enemy:' + enemyIdx));
            } else {
                const idx = (this.enemies || []).indexOf(living[0]);
                this.commitKamuiCommand(skill.id, 'enemy:' + (idx >= 0 ? idx : 0));
            }
        }
    }

    // ★敵ターゲット選択フェーズを開始（攻撃/攻撃スキル共通）。onPick(enemyIndex) で確定。
    beginEnemyTargeting(mode, onPick) {
        this.targetMode = mode;                 // 'attack' | 'skill'（キャンセル時の戻り先判定）
        this._onEnemyTargetPick = onPick;
        this.availableTargets = (this.enemies || [])
            .map((e, i) => ({ enemy: e, index: i }))
            .filter(x => x.enemy && x.enemy.currentHp > 0);
        this.commandPhase = 'target';
        this.selectedCommand = 0;
        this.waitingForCommand = true;
        this.renderEnemyTargetPhase();
    }

    renderEnemyTargetPhase() {
        const items = this.availableTargets.map((entry, i) => {
            const e = entry.enemy;
            // ★敵HPは見せない（簡単になりすぎ防止）。どの敵かを名前で選ぶだけ。
            return {
                html: `${e.name}`,
                onClick: () => {
                    this.selectedCommand = i;
                    this.refreshCurrentPhaseSelection();
                    const cb = this._onEnemyTargetPick;
                    this._onEnemyTargetPick = null;
                    if (cb) cb(entry.index);
                }
            };
        });
        items.push({ html: '↩ もどる', color: '#ff8888', onClick: () => this.cancelTargetPhase() });
        BattlePanel.renderCommands(items, { headerLabel: 'たいしょう', title: '🎯 てきを えらぶ', selectedIndex: this.selectedCommand });
    }

    // 対象選択フェーズのキャンセル。攻撃ならコマンド選択へ、スキルならスキル選択へ戻る。
    cancelTargetPhase() {
        this._onEnemyTargetPick = null;
        if (this.targetMode === 'attack') {
            this.targetMode = null;
            this.commandPhase = 'command';
            this.selectedCommand = 0;
            this.waitingForCommand = true;
            this.showCommands();
            this.updateCurrentMemberDisplay();
        } else {
            this.targetMode = null;
            this.commandPhase = 'skill';
            this.selectedCommand = 0;
            this.renderSkillPhase();
        }
    }

    // 攻撃コマンドを対象付きで積む（道具/カムイと同じ＝即時実行せず次メンバーへ）。
    commitAttackCommand(enemyTarget) {
        this.targetMode = null;
        const member = this.getPartyMembers()[this.currentMemberIndex];
        this.partyCommands[this.currentMemberIndex] = { member, command: 'attack', enemyTarget };
        this.commandPhase = 'command';
        this.waitingForCommand = false;
        const commands = document.getElementById('battleCommands');
        if (commands) commands.style.display = 'none';
        const body = document.getElementById('gameMessageBody');
        if (body) body.classList.remove('battle-cmd-mode', 'battle-cmd-grid');
        this.currentMemberIndex++;
        setTimeout(() => this.showNextMemberCommand(), 200);
    }

    // 攻撃コマンド選択時の入口（複数敵なら対象選択、単体なら自動確定）。
    beginAttackTargeting() {
        const living = this.livingEnemies();
        if (living.length > 1) {
            this.beginEnemyTargeting('attack', (idx) => this.commitAttackCommand(idx));
        } else {
            const idx = (this.enemies || []).indexOf(living[0]);
            this.commitAttackCommand(idx >= 0 ? idx : 0);
        }
    }

    renderTargetPhase(scope) {
        const items = this.availableTargets.map((entry, index) => {
            const tgt = entry.member;
            const hp = (tgt.hp != null && tgt.maxHp != null)
                ? `<span style="color:#88ff88; font-size:11px;">HP:${tgt.hp}/${tgt.maxHp}</span>`
                : '';
            return {
                html: `${tgt.name || 'カイト'} ${hp}`,
                onClick: () => {
                    this.selectedCommand = index;
                    this.refreshCurrentPhaseSelection();
                    this.commitKamuiCommand(this.pendingMagic.id, entry.index);
                }
            };
        });

        // キャンセル項目
        items.push({
            html: '↩ もどる',
            color: '#ff8888',
            onClick: () => {
                this.commandPhase = 'skill';
                this.selectedCommand = 0;
                this.renderSkillPhase();
            }
        });

        const title = scope === 'ally' ? '🎯 対象を選ぶ（味方）' : '🎯 対象を選ぶ';
        BattlePanel.renderCommands(items, {
            headerLabel: 'たいしょう',
            title,
            selectedIndex: this.selectedCommand
        });
    }

    commitKamuiCommand(magicId, targetIndex) {
        if (!this.kamuiPlanning) return;
        const member = this.kamuiPlanningMember;

        this.partyCommands[this.currentMemberIndex] = {
            member: member,
            command: 'kamui',
            magicId: magicId,
            targetIndex: targetIndex
        };

        // 計画フェーズを終了
        this.kamuiPlanning = false;
        this.kamuiPlanningMember = null;
        this.pendingMagic = null;
        this.availableSkills = [];
        this.availableTargets = [];
        this.commandPhase = 'command';
        this.waitingForCommand = false;

        const commands = document.getElementById('battleCommands');
        if (commands) commands.style.display = 'none';

        // パネルをログモードに戻して直近のメッセージを表示できるようにする
        const body = document.getElementById('gameMessageBody');
        if (body) body.classList.remove('battle-cmd-mode', 'battle-cmd-grid');

        this.currentMemberIndex++;
        setTimeout(() => this.showNextMemberCommand(), 200);
    }

    // 戦闘中のアイテム使用を「このメンバーのコマンド」として積む（攻撃/カムイと同じ＝即時実行しない）。
    // 実際の効果適用は executeActionsSequentially → memberUseItem で、全員のコマンド選択が終わってから。
    commitItemCommand(itemId, targetIndex) {
        const member = this.getPartyMembers()[this.currentMemberIndex];
        this.partyCommands[this.currentMemberIndex] = {
            member: member,
            command: 'item',
            itemId: itemId,
            targetIndex: targetIndex
        };
        this.waitingForCommand = false;
        const commands = document.getElementById('battleCommands');
        if (commands) commands.style.display = 'none';
        const body = document.getElementById('gameMessageBody');
        if (body) body.classList.remove('battle-cmd-mode', 'battle-cmd-grid');
        this.currentMemberIndex++;
        setTimeout(() => this.showNextMemberCommand(), 200);
    }

    // アイテム使用の実行（行動フェーズ）。効果適用＋消費はここ＝選択時ではなく実行時。
    memberUseItem(member, callback, itemId, targetIndex) {
        const members = this.getPartyMembers();
        const target = (typeof targetIndex === 'number' && members[targetIndex]) ? members[targetIndex] : member;
        let result = { success: false, message: 'アイテムを つかえなかった' };
        if (window.itemSystem) result = window.itemSystem.useItem(itemId, target, true);
        if (result && result.success) {
            const itemName = (result.item && result.item.name) || 'どうぐ';
            const msgs = [`${member.name}は ${itemName}を つかった！`];
            if (result.message) msgs.push(result.message);
            // 回復のHPバー更新は結果行の表示と同時に
            const fx = []; fx[msgs.length - 1] = () => { this.updateBattleUI(); if (window.updateUI) window.updateUI(); };
            this.presentBeat(msgs, { fx });
        } else {
            this.presentBeat([(result && result.message) || 'アイテムを つかえなかった']);
        }
        this.afterBattleMessages(() => { if (callback) callback(); });
    }

    confirmKamuiPlanning(magicId) {
        // 旧API互換: ターゲットなしの単純確定
        this.commitKamuiCommand(magicId, 'enemy');
    }

    cancelKamuiPlanning() {
        if (!this.kamuiPlanning) return;

        this.kamuiPlanning = false;
        this.kamuiPlanningMember = null;
        this.pendingMagic = null;
        this.availableSkills = [];
        this.availableTargets = [];
        this.commandPhase = 'command';
        this.selectedCommand = 0;

        this.waitingForCommand = true;
        this.showCommands();
        this.updateCurrentMemberDisplay();
    }

    // 現在のフェーズの選択ハイライトを更新（パネル内のコマンドリスト）
    refreshCurrentPhaseSelection() {
        BattlePanel.setSelectedIndex(this.selectedCommand);
        // 旧コマンド領域にも互換のため反映（DOM 残骸の整合性維持用）
        const items = document.querySelectorAll('#battleCommands .command-item');
        items.forEach((item, i) => {
            if (i === this.selectedCommand) item.classList.add('selected');
            else item.classList.remove('selected');
        });
    }

    // カムイスキル選択UIを表示
    showKamuiSkillSelection(member, callback) {
        if (!window.magicSystem) {
            this.presentBeat(['魔法システムが初期化されていません']);
            this.afterBattleMessages(() => { if (callback) callback(); });
            return;
        }

        const kamuiSkills = window.magicSystem.getLearnedMagic(member);

        if (kamuiSkills.length === 0) {
            this.presentBeat([`${member.name}は スキルを 習得していない！`]);
            this.afterBattleMessages(() => { if (callback) callback(); });
            return;
        }

        // スキル選択UIを表示
        this.currentKamuiCallback = callback;
        this.currentKamuiMember = member;
        this.selectedKamuiSkill = 0;
        this.showKamuiSkillMenu(kamuiSkills);
    }

    // カムイスキルメニューを表示
    showKamuiSkillMenu(skills) {
        const menu = document.getElementById('kamuiSkillMenu');
        if (!menu) {
            console.error('カムイスキルメニューが見つかりません');
            return;
        }

        const skillList = menu.querySelector('.kamui-skill-list');
        if (!skillList) {
            console.error('カムイスキルリストが見つかりません');
            return;
        }

        // スキルリストを作成
        skillList.innerHTML = '';
        skills.forEach((skill, index) => {
            const skillItem = document.createElement('div');
            skillItem.className = 'kamui-skill-item' + (index === this.selectedKamuiSkill ? ' selected' : '');
            skillItem.dataset.index = index;
            skillItem.dataset.magicId = skill.id;

            skillItem.innerHTML = `
                <div class="skill-icon">${skill.emoji}</div>
                <div class="skill-details">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-mp">MP: ${skill.mpCost}</div>
                </div>
                <div class="skill-description">${skill.description}</div>
            `;

            // クリックイベント
            skillItem.onclick = () => {
                this.selectedKamuiSkill = index;
                this.updateKamuiSkillSelection();
                this.executeKamuiSkill(skill.id);
            };

            skillList.appendChild(skillItem);
        });

        menu.style.display = 'block';

        // キーボード操作を有効化
        this.kamuiSkillMenuActive = true;
    }

    // カムイスキル選択を更新
    updateKamuiSkillSelection() {
        const skillItems = document.querySelectorAll('.kamui-skill-item');
        skillItems.forEach((item, index) => {
            if (index === this.selectedKamuiSkill) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // カムイスキルを実行（決定キー / クリックから呼ばれる）
    executeKamuiSkill(magicId) {
        if (window.playSE) {
            const m = window.magicSystem && window.magicSystem.magicData && window.magicSystem.magicData[magicId];
            const isHeal = m && (m.type === 'heal' || /heal/i.test(magicId));
            window.playSE(isHeal ? 'heal' : 'magic');
        }
        if (this.kamuiSkillExecuting) return; // 連打による多重実行を防止
        this.kamuiSkillExecuting = true;
        try {
            // 計画フェーズなら確定処理（コマンド保存→次メンバー）
            if (this.kamuiPlanning) {
                this.confirmKamuiPlanning(magicId);
                return;
            }

            // ターン実行中の途中起動（旧フロー互換）
            const menu = document.getElementById('kamuiSkillMenu');
            if (menu) menu.style.display = 'none';
            this.kamuiSkillMenuActive = false;
            this.memberKamui(this.currentKamuiMember, this.currentKamuiCallback, magicId);
        } finally {
            // 同フレーム連打を防止しつつ、次の入力は受け付けたい
            setTimeout(() => { this.kamuiSkillExecuting = false; }, 150);
        }
    }

    // カムイスキルメニューを閉じる（戻るキー / X から呼ばれる）
    closeKamuiSkillMenu() {
        // 計画フェーズ中ならコマンド選択へ戻る（スキップしない）
        if (this.kamuiPlanning) {
            this.cancelKamuiPlanning();
            return;
        }

        // 旧フロー（ターン実行中の途中起動）。callbackがあれば次のアクションへ
        const menu = document.getElementById('kamuiSkillMenu');
        if (menu) menu.style.display = 'none';
        this.kamuiSkillMenuActive = false;

        if (this.currentKamuiCallback) {
            const cb = this.currentKamuiCallback;
            this.currentKamuiCallback = null;
            cb();
        }
    }

    // メンバーの防御
    memberDefend(member, callback) {
        member.defending = true;
        this.presentBeat([`${member.name}は みをまもっている！`]);
        this.afterBattleMessages(() => { if (callback) callback(); });
    }

    // 戦闘画面表示
    showBattleScreen() {
        const battleScreen = document.getElementById('battleScreen');
        if (battleScreen) {
            battleScreen.classList.add('active');
            // モバイルでは viewport を縦に開放して戦闘画面を大きく使う（CSS .battle-active 参照）
            const gc = document.querySelector('.game-container');
            if (gc) gc.classList.add('battle-active');
            document.getElementById('gameUI').style.display = 'none';
            battleScreen.classList.remove('is-shaking');

            this.setBattleBackground();
            this.renderEnemyGroup();

            // ★上部の敵名＋HP HUDは非表示（名前は「あらわれた」メッセージで一度だけ告知。
            //   常時の名前/HP表示は混乱の元・かつ敵HPを見せると簡単すぎるため出さない）。
            const hud = document.querySelector('.enemy-hud');
            if (hud) hud.style.display = 'none';

            // 旧コマンド領域は使わないが互換のため非表示維持
            const commands = document.getElementById('battleCommands');
            if (commands) {
                commands.style.display = 'none';
            }

            // 旧バトルメッセージもクリア
            const battleMessage = document.getElementById('battleMessage');
            if (battleMessage) {
                battleMessage.textContent = '';
            }

            // メッセージパネルをバトルモードで起動（最初はログモード）
            BattlePanel.activate('戦闘');
            BattlePanel.renderLog([`${this.enemyGroupName()} が あらわれた！`]);

            this.updateBattleUI();
        }
    }

    getBattleBackground(area, mapId) {
        const normalizedArea = String(area || '');
        const normalizedMapId = String(mapId || '');
        let key = 'bg_city';

        if (normalizedMapId.includes('tokyo_gov')) {
            key = 'bg_gov';
        } else if (['city', 'town', 'market', 'shop', 'residential_street', 'house'].includes(normalizedArea)) {
            key = 'bg_city';
        } else if (normalizedArea === 'subway') {
            key = 'bg_subway';
        } else if (normalizedArea === 'dungeon') {
            key = 'bg_abyss';
        } else if (normalizedArea === 'shrine') {
            key = 'bg_shrine';
        } else if (normalizedArea === 'garden') {
            key = 'bg_biodome';
        }

        // ?v=2: 旧キャッシュ画像対策（onerror の .webp→.png 置換でも ?v=2 は引き継がれる）
        return `assets/battle/${key}.webp?v=2`;
    }

    setBattleBackground() {
        const bgImage = document.getElementById('battleBgImage');
        if (!bgImage) return;

        const mapSystem = window.mapSystem;
        const mapId = mapSystem?.currentMap || '';
        const currentMap = mapId && mapSystem?.maps ? mapSystem.maps[mapId] : null;
        let area = currentMap?.area || '';
        if (!area && typeof mapSystem?.getCurrentArea === 'function') {
            area = mapSystem.getCurrentArea() || '';
        }

        bgImage.style.display = 'block';
        delete bgImage.dataset.fallbackTried;
        bgImage.onerror = function() {
            if (!this.dataset.fallbackTried && this.src.includes('.webp')) {
                this.dataset.fallbackTried = '1';
                this.src = this.src.replace('.webp', '.png');
                return;
            }
            this.style.display = 'none';
        };
        bgImage.src = this.getBattleBackground(area, mapId);
    }

    // ★マルチ敵: enemy-stage に 1-3体のスロット（影＋スプライト＋複数時はミニ名/HP）を描画。
    //   スロット0のスプライトは id="enemySprite" を維持（旧FX/参照との互換）。
    renderEnemyGroup() {
        const stage = document.querySelector('.enemy-stage');
        if (!stage) { this.renderEnemySprite(this.currentEnemy); return; }
        const list = (this.enemies && this.enemies.length) ? this.enemies : (this.currentEnemy ? [this.currentEnemy] : []);
        stage.innerHTML = '';
        stage.style.display = 'flex';
        stage.style.justifyContent = 'center';
        stage.style.alignItems = 'stretch';   // 各スロットがstageの高さを継承（spriteのheight:100%崩壊を防ぐ）
        stage.style.gap = list.length > 1 ? '3%' : '0';
        const multi = list.length > 1;
        const scale = list.length === 3 ? 0.66 : (list.length === 2 ? 0.82 : 1);
        list.forEach((enemy, idx) => {
            const slot = document.createElement('div');
            slot.className = 'enemy-slot';
            slot.dataset.enemyIndex = String(idx);
            // ★高さはstageを継承(height:100%)。名前/HPはabsoluteでspriteの高さを食わない。
            slot.style.cssText = `position:relative;height:100%;flex:0 1 ${Math.floor(96 / list.length)}%;min-width:0;`;

            const shadow = document.createElement('div');
            shadow.className = 'enemy-shadow';
            shadow.setAttribute('aria-hidden', 'true');
            slot.appendChild(shadow);

            const sprite = document.createElement('div');
            sprite.className = 'enemy-sprite';
            if (idx === 0) sprite.id = 'enemySprite';     // 互換: 旧参照/FXの主スプライト
            sprite.dataset.enemyIndex = String(idx);
            if (scale !== 1) sprite.style.transform = `scale(${scale})`;
            const imagePath = this.getEnemyImagePath(enemy);
            if (imagePath) {
                const img = document.createElement('img');
                img.src = imagePath; img.alt = enemy?.name || ''; img.decoding = 'async';
                img.onerror = function () {
                    if (!this.dataset.fallbackTried && this.src.includes('.webp')) { this.dataset.fallbackTried = '1'; this.src = this.src.replace('.webp', '.png'); return; }
                    this.style.display = 'none';
                };
                sprite.appendChild(img);
            } else {
                sprite.textContent = enemy?.emoji || '??';
            }
            // ★撃破済みは表示自体を消す（透明化ではなくスロットごと非表示＝画面から消える）
            if ((enemy.currentHp || 0) <= 0 || enemy.defeated) { slot.style.display = 'none'; }
            slot.appendChild(sprite);

            // 複数体時のみ各敵のミニ名ラベル（識別＝どの敵を狙うか把握用）。★HPバーは出さない(簡単になりすぎ防止)。
            if (multi) {
                const plate = document.createElement('div');
                plate.style.cssText = 'position:absolute;left:50%;bottom:0;transform:translateX(-50%);z-index:3;display:flex;flex-direction:column;align-items:center;pointer-events:none;';
                const label = document.createElement('div');
                label.style.cssText = 'font-size:10px;color:#d8f4ff;max-width:78px;text-align:center;line-height:1.1;text-shadow:0 1px 2px #000;';
                label.textContent = enemy.name;
                plate.appendChild(label);
                slot.appendChild(plate);
            }
            stage.appendChild(slot);
        });
    }

    renderEnemySprite(enemy) {
        const enemyArea = document.getElementById('enemyArea');
        const enemySprite = document.getElementById('enemySprite');
        if (!enemySprite) return;

        if (enemyArea) {
            enemyArea.classList.remove('is-hit');
        }
        enemySprite.classList.remove('is-hit');
        enemySprite.style.opacity = '1';
        enemySprite.style.filter = 'none';
        enemySprite.innerHTML = '';

        const imagePath = this.getEnemyImagePath(enemy);
        if (imagePath) {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = enemy?.name || '';
            img.decoding = 'async';
            img.onerror = function() {
                if (!this.dataset.fallbackTried && this.src.includes('.webp')) {
                    this.dataset.fallbackTried = '1';
                    this.src = this.src.replace('.webp', '.png');
                    return;
                }
                this.style.display = 'none';
            };
            enemySprite.appendChild(img);
        } else {
            enemySprite.textContent = enemy?.emoji || '??';
        }
    }

    getEnemyImagePath(enemy) {
        if (!enemy) return null;
        const path = (
            enemy.image ||
            (enemy.bossId && this.enemyImageMap[enemy.bossId]) ||
            (enemy.name && this.enemyImageMap[enemy.name]) ||
            (enemy.type && this.enemyImageMap[enemy.type]) ||
            (enemy.name && enemy.name.includes('スパイダー') ? 'assets/enemies/enemy_data_spider.png' : null) ||
            (enemy.name && enemy.name.includes('ドローン') ? 'assets/enemies/enemy_patrol_drone.png' : null) ||
            (enemy.name && enemy.name.includes('アーク') ? 'assets/enemies/enemy_ark_prime.png' : null)
        );
        if (typeof path === 'string' && path.startsWith('assets/enemies/') && path.endsWith('.png')) {
            return path.replace(/\.png$/, '.webp');
        }
        if (path) return path;
        return null;
    }
    
    // プレイヤーの攻撃
    playerAttack(player) {
        console.log('playerAttack called, waiting:', this.waitingForCommand);
        // 先頭の生存敵を対象に（旧ソロ経路）
        this.currentEnemy = this.resolveEnemyTarget();
        const enemyIdx = (this.enemies || []).indexOf(this.currentEnemy);
        const baseDamage = player.attack || 15;
        const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const damage = Math.max(1, baseDamage + variance - Math.floor(this.currentEnemy.defense / 2));

        this.currentEnemy.currentHp = Math.max(0, this.currentEnemy.currentHp - damage);

        // 攻撃→ダメージ→(結果) を1ビートで表示。エフェクトはダメージ行と同時に発火
        const killed = this.currentEnemy.currentHp <= 0;
        const msgs = [`カイトの こうげき！`, `${this.currentEnemy.name}に ${Math.floor(damage)}の ダメージ！`];
        if (killed) msgs.push(`${this.currentEnemy.name}を たおした！`);
        const fx = []; fx[1] = () => { this.showDamageEffect(damage, true, false, enemyIdx); this.updateBattleUI(); };
        this.presentBeat(msgs, { fx });
        this.afterBattleMessages(() => {
            if (this.livingEnemies().length === 0) {
                this.updateBattleUI();
                this.battleVictory(player);
            } else {
                this.enemyTurn(player);
            }
        });
    }

    // 神威（カムイ）攻撃
    playerKamui(player) {
        console.log('playerKamui called, MP:', player.mp);
        
        if (player.mp < 10) {
            this.presentBeat(['MPが たりない！']);
            // コマンド選択に戻る
            this.afterBattleMessages(() => {
                this.waitingForCommand = true;
                this.showCommands();
            });
            return;
        }

        player.mp -= 10;
        this.currentEnemy = this.resolveEnemyTarget();
        const enemyIdx = (this.enemies || []).indexOf(this.currentEnemy);
        const baseDamage = 25;
        const variance = Math.floor(Math.random() * 10);
        const damage = baseDamage + variance;

        this.currentEnemy.currentHp = Math.max(0, this.currentEnemy.currentHp - damage);

        // 召喚→ダメージ→(結果) を1ビートで。エフェクトはダメージ行と同時に発火
        const killed = this.currentEnemy.currentHp <= 0;
        const msgs = [`カイトは スサノオの力を よびだした！`, `${this.currentEnemy.name}に ${damage}の ダメージ！`];
        if (killed) msgs.push(`${this.currentEnemy.name}を たおした！`);
        const fx = []; fx[1] = () => { this.showDamageEffect(damage, true, true, enemyIdx); this.updateBattleUI(); };
        this.presentBeat(msgs, { fx });
        this.afterBattleMessages(() => {
            if (this.livingEnemies().length === 0) {
                this.updateBattleUI();
                this.battleVictory(player);
            } else {
                this.enemyTurn(player);
            }
        });
    }
    
    // 敵のターン（★マルチ敵: 生存敵が1体ずつ順に行動 → 全員行動後に次ラウンドへ）
    enemyTurn(player) {
        const acting = this.livingEnemies();           // このフェーズ開始時点の生存敵
        let i = 0;
        const finishPhase = () => {
            if (this.checkPartyWipeout()) { this.gameOver(); return; }
            // 状態異常処理・ターン加算・次プレイヤーターンはフェーズ末で1回だけ
            this.processAllMembersStatusAilments(() => {
                this.turnCount++;
                this.startPlayerTurn();
            });
        };
        const step = () => {
            if (this.checkPartyWipeout()) { this.gameOver(); return; }  // 途中で全滅したら即終了
            if (i >= acting.length) { finishPhase(); return; }
            const e = acting[i]; i++;
            if (!e || e.currentHp <= 0) { step(); return; }             // フェーズ中に倒された敵は飛ばす
            this.currentEnemy = e;                                       // 行動主体をこの敵へ
            const action = this.determineEnemyAction();
            const done = () => step();                                  // この敵の行動完了 → 次の敵へ
            if (action === 'defend') this.enemyDefend(player, done);
            else if (action === 'skill') this.enemySkillAttack(player, done);
            else this.enemyAttack(player, done);
        };
        step();
    }

    // 敵の行動を決定
    determineEnemyAction() {
        if (!this.currentEnemy || !this.currentEnemy.aiPattern) {
            return 'attack';
        }

        const hpRatio = this.currentEnemy.currentHp / this.currentEnemy.maxHp;
        const aiPattern = this.currentEnemy.aiPattern;

        // HP閾値以下の場合、低HP時の行動
        if (hpRatio <= aiPattern.lowHpThreshold) {
            return aiPattern.lowHpAction;
        }

        // スキル使用判定
        if (aiPattern.skillChance && Math.random() < aiPattern.skillChance) {
            return 'skill';
        }

        return aiPattern.normalAction || 'attack';
    }

    // 敵の通常攻撃（done: この敵の行動完了後に敵フェーズを進めるコールバック）
    enemyAttack(player, done) {
        // ★生存メンバーからターゲット選択（戦闘不能は狙わない・挑発中の味方を優先）
        const allMembers = this.getPartyMembers();
        const aliveMembers = allMembers.filter(m => (m.hp || 0) > 0);
        if (!aliveMembers.length) { this.gameOver(); return; }
        const taunters = aliveMembers.filter(m => (m.taunting || 0) > 0);
        const pool = taunters.length ? taunters : aliveMembers;
        const target = pool[Math.floor(Math.random() * pool.length)];

        // ★物理攻撃: 対象の物理防御(プロテスト等のバフ込み)で軽減
        const baseDamage = this.currentEnemy.attack;
        const variance = Math.floor(Math.random() * 3);
        const tPhysDef = (target.defense || 5) * this._buffMul(target, 'physDef');
        let damage = Math.max(1, baseDamage + variance - Math.floor(tPhysDef / 2));

        const msgs = [`${this.currentEnemy.name}の こうげき！`];
        if (target.defending) {
            damage = Math.floor(damage / 2);
            msgs.push(`${target.name}は ぼうぎょしている！`);
            target.defending = false;
        }
        target.hp = Math.max(0, target.hp - damage);
        msgs.push(`${target.name}に ${Math.floor(damage)}の ダメージ！`);
        const dmgIdx = msgs.length - 1;                         // ダメージ行の添字
        const targetIdx = allMembers.indexOf(target);
        if (target.hp <= 0) msgs.push(`${target.name}は たおれた！`); // 結果行（味方が倒れた）

        // ★攻撃→(防御)→ダメージ→(結果) を1ビートで表示。被弾エフェクト/HPバーはダメージ行と同時発火
        const fx = []; fx[dmgIdx] = () => { this.showDamageEffect(damage, false, false, targetIdx); this.updateBattleUI(); };
        this.presentBeat(msgs, { fx });
        this.afterBattleMessages(() => { if (done) done(); });
    }

    // 敵の防御
    enemyDefend(player, done) {
        this.currentEnemy.defending = true;
        this.presentBeat([`${this.currentEnemy.name}は みをまもっている！`]);
        this.afterBattleMessages(() => { if (done) done(); });
    }

    // 敵のスキル攻撃（done: 敵フェーズ継続コールバック）。★v2: 魔法系=対象の魔法防御で軽減。
    enemySkillAttack(player, done) {
        // ★ボス/高tierでAoEスキル持ちは確率で全体魔法バースト（大回復との釣り合い）
        if (this._shouldUseAoE()) { this.enemyAoEAttack(player, done); return; }

        // ★生存メンバーからターゲット（挑発優先）
        const allMembers = this.getPartyMembers();
        const aliveMembers = allMembers.filter(m => (m.hp || 0) > 0);
        if (!aliveMembers.length) { this.gameOver(); return; }
        const taunters = aliveMembers.filter(m => (m.taunting || 0) > 0);
        const pool = taunters.length ? taunters : aliveMembers;
        const target = pool[Math.floor(Math.random() * pool.length)];

        const skillDamage = Math.floor(this.currentEnemy.attack * 1.5);
        const variance = Math.floor(Math.random() * 5);
        const tMagDef = ((target.magicDefense != null ? target.magicDefense : Math.floor((target.defense || 0) * 0.5))) * this._buffMul(target, 'magDef');
        let damage = Math.max(1, skillDamage + variance - Math.floor(tMagDef / 3));

        // 特殊攻撃→(防御)→ダメージ→(状態異常)→(結果) を1ビートに畳み込む
        const msgs = [`${this.currentEnemy.name}の とくしゅこうげき！`];
        // 防御中は特殊攻撃も半減（通常攻撃と同じ扱い。従来は特殊に防御が効かなかった）
        if (target.defending) {
            damage = Math.floor(damage / 2);
            msgs.push(`${target.name}は ぼうぎょしている！`);
            target.defending = false;
        }

        target.hp = Math.max(0, target.hp - damage);
        msgs.push(`${target.name}に ${Math.floor(damage)}の ダメージ！`);
        const dmgIdx = msgs.length - 1;                         // ダメージ行の添字
        const targetIdx = allMembers.indexOf(target);

        // ステータス異常付与判定（30%確率）— 同一ビートに告知を畳み込む（silent）
        if (Math.random() < 0.3) {
            const ailments = ['poison', 'paralysis', 'sleep'];
            const randomAilment = ailments[Math.floor(Math.random() * ailments.length)];
            msgs.push(this.applyStatusAilment(target, randomAilment, 3, true));
        }
        if (target.hp <= 0) msgs.push(`${target.name}は たおれた！`); // 結果行

        // 被弾エフェクト/HPバーはダメージ行と同時発火
        const fx = []; fx[dmgIdx] = () => { this.showDamageEffect(damage, false, true, targetIdx); this.updateBattleUI(); };
        this.presentBeat(msgs, { fx });
        this.afterBattleMessages(() => { if (done) done(); });
    }

    // ★ボス/高tier敵が全体魔法バーストを撃つべきか（大回復との釣り合い＝消耗戦の自動化防止）
    _shouldUseAoE() {
        const e = this.currentEnemy;
        if (!e) return false;
        const hasAoE = (e.aoe === true) || (Array.isArray(e.skills) && e.skills.some(s => /aoe|burst|storm|nova|rain|tide|meteor|avalanche/i.test(s)));
        if (!hasAoE) return false;
        return Math.random() < (e.boss ? 0.45 : 0.3);
    }

    // ★敵の全体攻撃（魔法ベース＝貫通良くタンクにも通る）。生存メンバー全員へ。
    enemyAoEAttack(player, done) {
        const allMembers = this.getPartyMembers();
        const alive = allMembers.filter(m => (m.hp || 0) > 0);
        if (!alive.length) { this.gameOver(); return; }
        const base = Math.floor((this.currentEnemy.attack || 10) * 1.3);
        const lines = [`${this.currentEnemy.name}の ぜんたいこうげき！`];
        const fx = [];
        alive.forEach(m => {
            const variance = Math.floor(Math.random() * 5);
            const md = ((m.magicDefense != null ? m.magicDefense : Math.floor((m.defense || 0) * 0.5))) * this._buffMul(m, 'magDef');
            let dmg = Math.max(1, base + variance - Math.floor(md / 3));
            if (m.defending) { dmg = Math.floor(dmg / 2); m.defending = false; }
            m.hp = Math.max(0, m.hp - dmg);
            const idx = allMembers.indexOf(m);
            const li = lines.length;
            lines.push(`${m.name}に ${dmg}の ダメージ！`);
            fx[li] = () => { this.showDamageEffect(dmg, false, true, idx); this.updateBattleUI(); };
            if (m.hp <= 0) lines.push(`${m.name}は たおれた！`);
        });
        this.presentBeat(lines, { fx });
        this.afterBattleMessages(() => { if (done) done(); });
    }

    // 全メンバーのステータス異常処理（1メンバー=1ビート。固定タイマー廃止・ビート完了で次へ）
    processAllMembersStatusAilments(callback) {
        const allMembers = this.getPartyMembers();
        let index = 0;

        const processNext = () => {
            if (index >= allMembers.length) {
                callback();
                return;
            }

            const member = allMembers[index];
            index++;
            const lines = this.processStatusAilmentsEndTurn(member);
            if (lines.length) {
                this.presentBeat(lines);                          // そのメンバーの異常処理を1ビートで
                this.afterBattleMessages(processNext);            // 表示完了後に次メンバー
            } else {
                processNext();                                    // メッセージ無し＝即次
            }
        };

        processNext();
    }

    // パーティ全滅チェック
    checkPartyWipeout() {
        const allMembers = this.getPartyMembers();
        return allMembers.every(member => member.hp <= 0);
    }
    
    // 戦闘勝利
    battleVictory(player) {
        if (window.playSE) window.playSE('victory');
        this.waitingForCommand = false;

        // コマンドを非表示に（旧UI互換）
        const commands = document.getElementById('battleCommands');
        if (commands) {
            commands.style.display = 'none';
        }
        // パネルをログモードに切り替え
        const body = document.getElementById('gameMessageBody');
        if (body) body.classList.remove('battle-cmd-mode', 'battle-cmd-grid');

        // 経験値・ゴールド・ドロップを先に適用（データ確定）。表示は1つずつ順次に。
        // ★全敵の報酬を合算（マルチ敵=「3体分のポイント」）。単体時は従来通り単体分。
        const rewards = this.computeBattleRewards();
        const expGained = rewards.exp || 10;
        const goldGained = rewards.gold || 5;
        player.gold = (player.gold || 0) + goldGained;
        const allMembers = [player];
        if (window.partySystem) allMembers.push(...window.partySystem.getMembers());
        allMembers.forEach(member => { member.exp = (member.exp || 0) + expGained; });
        const droppedItems = this.processItemDrops();

        // ビート化: 勝利+報酬を1ビート、ドロップを1ビート、完了後にレベルアップ。
        // 「○○を たおした！」は撃破した行動ビートで既出のため、ここでは重複させない。
        this.presentBeat([
            `せんとうに しょうり！`,
            `${expGained} の けいけんちを かくとく！`,
            `${goldGained} ゴールドを てにいれた！`
        ]);
        if (droppedItems.length) {
            this.presentBeat(droppedItems.map(item => `${item.name}を てにいれた！`));
        }
        this.afterBattleMessages(() => this.processLevelUps(allMembers, 0));
    }

    // ドロップアイテム処理（★全敵のdropTableを走査＝マルチ敵では各敵が個別に抽選）
    processItemDrops() {
        const droppedItems = [];
        const enemies = (this.enemies && this.enemies.length) ? this.enemies : (this.currentEnemy ? [this.currentEnemy] : []);

        enemies.forEach(enemy => {
            if (!enemy || !enemy.dropTable) return;
            enemy.dropTable.forEach(dropEntry => {
                const roll = Math.random();
                if (roll < dropEntry.rate) {
                    // アイテムかチェック
                    if (window.itemSystem && window.itemSystem.itemDatabase[dropEntry.id]) {
                        const success = window.itemSystem.addItem(dropEntry.id, 1);
                        if (success) {
                            const itemData = window.itemSystem.itemDatabase[dropEntry.id];
                            droppedItems.push(itemData);
                        }
                    }
                    // 装備品かチェック
                    else if (window.equipmentSystem && window.equipmentSystem.equipmentDatabase[dropEntry.id]) {
                        // 装備品は equipmentSystem.inventory へ入れる（装備メニューはこちらを読む。
                        // 旧 player.equipmentInventory 配列はメニュー未参照で永久に使えなかったバグを修正）
                        const equipData = window.equipmentSystem.equipmentDatabase[dropEntry.id];
                        window.equipmentSystem.addEquipment(dropEntry.id, 1);
                        droppedItems.push({ name: equipData.name, emoji: equipData.emoji });
                        console.log(`装備品ドロップ: ${equipData.name}`);
                    }
                }
            });
        });

        return droppedItems;
    }

    // レベルアップ処理を順番に実行（1メンバーのレベルアップ = 1ビート。固定タイマー廃止）
    processLevelUps(members, index) {
        if (index >= members.length) {
            // 全員のレベルアップ処理完了（直前ビート表示後に戦闘終了へ同期）
            this.afterBattleMessages(() => this.endBattle(true));
            return;
        }

        const member = members[index];
        const characterId = member.characterId || 'kaito';
        const expCurve = window.CHARACTER_GROWTH?.[characterId]?.expCurve || 'normal';
        const expNeeded = window.calculateExpNeeded ? window.calculateExpNeeded(member.level, expCurve) : member.level * 100;

        if (member.exp >= expNeeded) {
            // レベルアップ行(成長3行＋習得)を1ビートにまとめて表示→同memberを再チェック(多段Lv)
            const lines = this.levelUpCharacter(member);
            this.presentBeat(lines);
            this.afterBattleMessages(() => this.processLevelUps(members, index));
        } else {
            // 次のメンバーへ（メッセージ無し＝即時）
            this.processLevelUps(members, index + 1);
        }
    }

    // キャラクターのレベルアップ処理
    levelUpCharacter(character) {
        if (window.playSE) window.playSE('level_up');
        const characterId = character.characterId || 'kaito';
        const oldLevel = character.level;
        // Lv50 ハードキャップ: 上限到達後は余剰expを切り捨て、それ以上 level++ しない。
        if (character.level >= 50) {
            character.exp = 0;
            if (window.updateUI) window.updateUI();
            return [`${character.name}は さいだいレベルに たっした！`];
        }
        // このレベルに必要だったexpを消費（消費しないとprocessLevelUpsが同レベルで無限/多段暴発する）
        const expCurve = window.CHARACTER_GROWTH?.[characterId]?.expCurve || 'normal';
        const needed = window.calculateExpNeeded ? window.calculateExpNeeded(character.level, expCurve) : character.level * 100;
        character.exp = Math.max(0, (character.exp || 0) - needed);
        character.level++;

        // ステータス成長（ランダム幅付き）
        const hpGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'hp') : 20;
        const mpGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'mp') : 10;
        const attackGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'attack') : 3;
        const defenseGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'defense') : 2;
        const magicGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'magic') : 2;
        const speedGain = window.calculateStatGrowth ? window.calculateStatGrowth(characterId, 'speed') : 1;

        // 基本ステータスを上昇
        character.baseMaxHp = (character.baseMaxHp || character.maxHp) + hpGain;
        character.baseMaxMp = (character.baseMaxMp || character.maxMp) + mpGain;
        character.baseAttack = (character.baseAttack || character.attack) + attackGain;
        character.baseDefense = (character.baseDefense || character.defense) + defenseGain;
        character.baseMagic = (character.baseMagic || character.magic || 0) + magicGain;
        character.baseSpeed = (character.baseSpeed || character.speed || 5) + speedGain;

        // 装備込みのステータスを再計算（プレイヤーのみ）
        if (character === window.player && window.equipmentSystem) {
            window.equipmentSystem.recalculatePlayerStats(character);
        } else {
            character.maxHp = character.baseMaxHp;
            character.maxMp = character.baseMaxMp;
            character.attack = character.baseAttack;
            character.defense = character.baseDefense;
            character.magic = character.baseMagic;
            // ★v2: 魔法防御は物理防御基礎の半分から導出（成長に追従）。装備分はrecalcAllで後乗せ。
            character.baseMagicDefense = Math.floor((character.baseDefense || 5) * 0.5);
            character.magicDefense = character.baseMagicDefense;
            character.speed = character.baseSpeed;
        }

        // HP/MPを全回復
        character.hp = character.maxHp;
        character.mp = character.maxMp;

        // レベルアップメッセージ（addBattleLogせず行を返し、呼び出し側が1ビートに畳む）
        const lines = [
            `${character.name}が レベルアップ！`,
            `レベル ${character.level} になった！`,
            `HP+${hpGain} MP+${mpGain} 攻撃+${attackGain} 防御+${defenseGain}`
        ];

        // 新規スキル習得チェック（習得行も同じビートに連結）
        lines.push(...this.checkSkillLearning(character, oldLevel));

        // UIを更新
        if (window.updateUI) {
            window.updateUI();
        }
        return lines;
    }

    // スキル習得チェック（習得メッセージ行の配列を返す。表示は呼び出し側がビートで行う）
    checkSkillLearning(character, oldLevel) {
        const lines = [];
        const characterId = character.characterId || 'kaito';
        const skillLearning = window.CHARACTER_GROWTH?.[characterId]?.skillLearning;

        if (!skillLearning || !window.magicSystem) return lines;

        const newLevel = character.level;

        // レベル範囲内のスキルを習得
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            const skills = skillLearning[level];
            if (skills && Array.isArray(skills)) {
                skills.forEach(skillId => {
                    const learned = window.magicSystem.learnMagic(skillId, character);
                    if (learned) {
                        const magic = window.magicSystem.magicDatabase[skillId];
                        if (magic) {
                            lines.push(`${character.name}は ${magic.name}を おぼえた！`);
                        }
                    }
                });
            }
        }
        return lines;
    }
    
    // 防御
    playerDefend(player) {
        console.log('playerDefend called');

        player.defending = true;
        this.presentBeat(['カイトは みをまもっている！']);
        // 防御してもターンは消費、敵のターンへ（ビート表示完了後）
        this.afterBattleMessages(() => this.enemyTurn(player));
    }
    
    // 逃走処理
    tryEscape() {
        console.log('tryEscape called');

        // ボス戦では逃げられない
        if (this.isBossBattle) {
            this.presentBeat(['ボスせんから にげることは できない！']);
            this.afterBattleMessages(() => this.enemyTurn(window.player));
            return;
        }

        const escapeChance = Math.random();

        if (escapeChance > 0.4) { // 60%の確率で逃走成功
            if (window.playSE) window.playSE('escape');
            this.presentBeat(['うまく にげきれた！']);
            this.afterBattleMessages(() => this.endBattle(false));
        } else {
            // 逃走失敗時も敵のターンへ
            this.presentBeat(['にげられない！']);
            this.afterBattleMessages(() => this.enemyTurn(window.player));
        }
    }
    
    // 戦闘終了
    endBattle(victory = false) {
        const wasBossBattle = this.isBossBattle;
        const bossId = this.currentEnemy ? this.currentEnemy.bossId : null;
        const bossDefeatCallback = this.onBossDefeat;

        this.inBattle = false;
        this.currentEnemy = null;
        this.turnCount = 0;
        this.waitingForCommand = false;
        this.battleLog = [];
        this._resetBattleMessages();  // メッセージ部品の保留タイマ等をクリア
        this.isBossBattle = false;
        this.onBossDefeat = null;

        // 戦闘で付与されたステータス異常を全員クリア（フィールドに持ち越さない）
        try {
            const partyForClear = this.getPartyMembers ? this.getPartyMembers() : [];
            [window.player, ...partyForClear].forEach(m => { if (m) m.statusAilments = {}; });
        } catch (e) { /* noop */ }

        // 戦闘UIに残存しているフラグ・要素を強制クリア（フィールド復帰時の入力封じ防止）
        this.kamuiSkillMenuActive = false;
        this.kamuiPlanning = false;
        this.kamuiPlanningMember = null;
        this.kamuiSkillExecuting = false;
        this.executingTurn = false;
        this.allCommandsSelected = false;
        this.partyCommands = [];
        this.currentMemberIndex = 0;
        this.currentKamuiCallback = null;
        this.currentKamuiMember = null;

        const kamuiMenu = document.getElementById('kamuiSkillMenu');
        if (kamuiMenu) kamuiMenu.style.display = 'none';

        // index.html 側の入力状態（押しっぱなしキー / メッセージ表示中フラグ等）をリセット
        if (typeof window.resetBattleUIState === 'function') {
            window.resetBattleUIState();
        }

        // 戦闘後は少し安全期間を設ける
        this.encounterSteps = 0;
        this.encounterThreshold = Math.floor(this.getRandomEncounterSteps('medium') * 1.5);
        // ★戦闘終了直後のインタラクション再発火を封じる。ボス撃破フラグは onBossDefeat コールバック
        //   (〜500ms後)で立つため、その窓でZ押下すると bossDefeated 未確定のままボス再戦が起きていた。
        this.justEndedBattle = true;
        if (typeof setTimeout === 'function') setTimeout(() => { this.justEndedBattle = false; }, 900);

        const battleScreen = document.getElementById('battleScreen');
        if (battleScreen) {
            battleScreen.classList.remove('active');
            document.getElementById('gameUI').style.display = 'block';
        }
        const gcEnd = document.querySelector('.game-container');
        if (gcEnd) gcEnd.classList.remove('battle-active');

        // メッセージパネルをバトルモードから解除
        BattlePanel.deactivate();

        // フィールドBGMに戻す（新しいBGMシステムを使用）
        if (window.bgmSystem) {
            window.bgmSystem.endBattleBGM();
        }

        // ボス戦勝利時のコールバック実行
        if (wasBossBattle && victory && bossDefeatCallback) {
            setTimeout(() => {
                bossDefeatCallback(bossId);
            }, 500);
        }

        // ⚠️ ボス撃破後イベントは onBossDefeat コールバック一本に統一する。
        // 以前ここで直接 triggerEvent('shrine_path_opens') していたが、これは
        // (a) 全ボスで shrine_path_opens を撃つためアーク撃破でも誤発火し、
        // (b) コールバック側(onBossDefeated)と二重発火していた。
        // onBossDefeated(bossKey) が corrupted_drone→shrine_path_opens /
        // arc_prime→arc_defeated_ending を正しく振り分けるのでここでは何もしない。

        // UI更新
        if (window.updateUI) {
            window.updateUI();
        }
        
        // マップメッセージをクリア
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.textContent = 'せんとうが おわった';
            setTimeout(() => {
                messageBox.textContent = '';
            }, 2000);
        }
    }
    
    // ゲームオーバー
    gameOver() {
        // ★案B 安全網: 単騎Ω戦でカイトが倒れかけたら、ゲームオーバーにせずアカリ乱入で救出し戦闘継続。
        //   (2ターン目を待たずに撃沈した場合の保険。akariJoined後は発火しないので通常の敗北は素通り)
        if (this._omegaRescuePending()) {
            this._doOmegaRescue(() => this.startPlayerTurn());
            return;
        }
        // ★フィールドを凍結（gameLoopは!inBattleで回り続けるため、index側の updatePlayer/keydown
        //   ガードが効くよう、ここで真っ先にフラグを立てる）。解除はロード/New Game時。
        window.isGameOver = true;

        // 全滅の結果をビートで表示（個々の「○○は たおれた！」は直前の敵攻撃ビートで既出）
        this.presentBeat(['パーティは ぜんめつした…']);
        // 戦闘UI状態を解除
        this.kamuiSkillMenuActive = false;
        this.kamuiPlanning = false;
        this.kamuiSkillExecuting = false;
        this.executingTurn = false;
        const kamuiMenu = document.getElementById('kamuiSkillMenu');
        if (kamuiMenu) kamuiMenu.style.display = 'none';

        // ⚠️ 敗北経路は endBattle を通らないため、戦闘終了の後始末を必ずここで「同期的に」行う。
        // 怠ると inBattle=true のまま固定＋戦闘BGMがループし続ける。ロード画面はフィールドの上に出すので
        // 戦闘画面を閉じてからロード画面を開く（ロード成功時はこの後始末済みのフィールドが再開する）。
        const teardownToField = () => {
            this.inBattle = false;
            this.waitingForCommand = false;
            this.currentEnemy = null;
            if (window.bgmSystem) window.bgmSystem.stop(true); // 戦闘BGMを停止
            const battleScreen = document.getElementById('battleScreen');
            if (battleScreen) {
                battleScreen.classList.remove('active');
                const ui = document.getElementById('gameUI');
                if (ui) ui.style.display = 'block';
            }
            const gcOver = document.querySelector('.game-container');
            if (gcOver) gcOver.classList.remove('battle-active');
            if (typeof BattlePanel !== 'undefined' && BattlePanel.deactivate) BattlePanel.deactivate();
            if (typeof window.resetBattleUIState === 'function') window.resetBattleUIState();
        };
        // 死亡ビートの表示完了後に「戦闘を畳んでから」ゲームオーバー＝ロード画面を開く。
        // teardownを先に同期実行すると BattlePanel.deactivate が死亡ビート表示前にパネルを消すため、
        // ビート表示(afterBattleMessages)後に畳む。死亡ビート中は inBattle=true がフィールドを止める。
        // ロード画面は閉じられない＝ロード or New Game までフィールドは凍結のまま。
        this.afterBattleMessages(() => {
            teardownToField(); // 戦闘画面/BGM/パネルを畳む（クリーンなフィールド上にロード画面を出す）
            if (typeof window.openGameOverScreen === 'function') {
                window.openGameOverScreen();
            } else if (confirm('ゲームオーバー。タイトルに戻りますか？')) {
                location.reload();
            }
        });
    }
    
    // ===== バトルメッセージ部品（行動ごと「ビート」表示・自動送り＋明確な区切り） =====
    // 1行動 = 1ビート{行動行→ダメージ行→任意の結果行}。ビートを1まとまりで出し切り、
    // 完了後にパネルをクリア＋間を置いてから次ビート → 可視窓に2行動を混在させない。
    // presentBeat が唯一の入口。addBattleLog は1行ビートのshim（既存全サイトは無改修でも安全）。
    // 全ビート枯渇後/各境界で afterBattleMessages の進行(次行動/勝利/敗北)をテキストに同期発火。
    // opts.fx: 行と同じ添字の関数配列。その行が表示された瞬間に発火（ダメージ数字/被弾フラッシュ等を
    //   メッセージのダメージ行と連動させる＝「数字が先に飛ぶ」ズレを解消）。
    presentBeat(lines, opts) {
        const arr = Array.isArray(lines) ? lines.filter(l => l != null).map(String) : [String(lines)];
        if (arr.length === 0) return;
        const fx = (opts && Array.isArray(opts.fx)) ? opts.fx.slice() : null;
        this._beatQueue = this._beatQueue || [];
        this._beatQueue.push(Object.freeze({ lines: Object.freeze(arr.slice()), fx: fx }));
        // 旧バトルメッセージ枠(DOM互換)＋battleLogにも積む
        arr.forEach(m => this.battleLog.push(m));
        const battleMessage = document.getElementById('battleMessage');
        if (battleMessage) {
            battleMessage.textContent = this.battleLog.slice(-4).join('\n');
            battleMessage.scrollTop = battleMessage.scrollHeight;
        }
        // idle かつ非ドレイン中なら送り開始（ドレインcb内での追加はpost-checkが継続）
        const idle = (this._beatPhase === 'idle' || this._beatPhase == null);
        if (this.inBattle && idle && !this._inDrain) this._pumpBattleMsg();
    }

    // 後方互換shim: 単発 = 1行ビート（どこから呼ばれても自己完結ビート＝混ざらない）
    addBattleLog(message) { this.presentBeat([message]); }

    // 3相ビートマシン（タイマーは常に1本）: revealing(1行ずつ)→pausing(読ませる間)→clear→次ビート/idle
    _pumpBattleMsg() {
        const PER_LINE_MS = 520, INTER_BEAT_PAUSE_MS = 360, CLEAR_GAP_MS = 140;
        this._beatQueue = this._beatQueue || [];
        if (this._beatIndex == null) this._beatIndex = -1;

        // idle: 次ビートがあれば開始、無ければドレイン(進行発火)
        if (this._beatPhase === 'idle' || this._beatPhase == null) {
            if (this._beatIndex + 1 >= this._beatQueue.length) { this._runDrainCbs(); return; }
            this._beatIndex++;
            this._beatShown = 0;
            this._beatPhase = 'revealing';
        }

        const beat = this._beatQueue[this._beatIndex];
        if (!beat) { this._beatPhase = 'idle'; this._runDrainCbs(); return; }

        if (this._beatPhase === 'revealing') {
            this._beatShown++;
            this._renderBeat(beat, this._beatShown);
            // その行に紐づくエフェクト(ダメージ数字/被弾フラッシュ/HPバー更新)を表示と同時に発火
            if (beat.fx && typeof beat.fx[this._beatShown - 1] === 'function') {
                try { beat.fx[this._beatShown - 1](); } catch (e) {}
            }
            if (this._beatShown >= beat.lines.length) {
                this._beatPhase = 'pausing';                 // 全行表示→読ませる間
                this._scheduleMsgTick(INTER_BEAT_PAUSE_MS);
            } else {
                this._scheduleMsgTick(PER_LINE_MS);          // 次の行
            }
            return;
        }

        if (this._beatPhase === 'pausing') {
            this._clearBeatPanel();                          // クリア＝次ビートと混ざらない不変条件
            this._beatPhase = 'idle';
            if (this._beatIndex + 1 < this._beatQueue.length) {
                this._scheduleMsgTick(CLEAR_GAP_MS);         // 区切りの空白→次ビート
            } else {
                if (this._msgTimer) { clearTimeout(this._msgTimer); this._msgTimer = null; }
                this._runDrainCbs();                          // キュー枯渇→進行発火
            }
            return;
        }
    }

    _scheduleMsgTick(ms) {
        if (this._msgTimer) clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => this._pumpBattleMsg(), ms);
    }

    // 現ビートの先頭shownCount行をパネルへ（cmd入力中はヘッダにフラッシュ）
    _renderBeat(beat, shownCount) {
        const body = document.getElementById('gameMessageBody');
        const isCommandMode = body && body.classList.contains('battle-cmd-mode');
        if (!isCommandMode) BattlePanel.renderLog(beat.lines.slice(0, shownCount));
        else this._flashCommandHeaderMessage(beat.lines[shownCount - 1]);
    }

    // ビート間のクリア（log modeのみ。cmd中はフラッシュが自然消灯するので触らない）
    _clearBeatPanel() {
        const body = document.getElementById('gameMessageBody');
        const isCommandMode = body && body.classList.contains('battle-cmd-mode');
        if (!isCommandMode) BattlePanel.renderLog([]);
    }

    // ドレインcb実行。cbがpresentBeatすれば新ビートを継続。再入(cb内afterBattleMessages)も消化。
    _runDrainCbs() {
        this._beatPhase = 'idle';
        this._inDrain = true;
        // 新ビートが積まれない限り、溜まったcbを順に消化（cb内の追加cbも拾う）
        while ((this._msgDrainCbs && this._msgDrainCbs.length) &&
               (this._beatIndex + 1 >= this._beatQueue.length)) {
            const cbs = this._msgDrainCbs; this._msgDrainCbs = [];
            cbs.forEach(cb => { try { cb(); } catch (e) {} });
        }
        this._inDrain = false;
        if (this._beatIndex + 1 < this._beatQueue.length) this._scheduleMsgTick(0);
    }

    // 表示中ビートが全部出て区切りも終わってから cb 実行（行動間の進行をテキストに同期）
    afterBattleMessages(cb) {
        if (!cb) return;
        const idx = (this._beatIndex == null ? -1 : this._beatIndex);
        const qlen = this._beatQueue ? this._beatQueue.length : 0;
        const drained = (this._beatPhase === 'idle' || this._beatPhase == null) && (idx + 1 >= qlen);
        if (drained && !this._inDrain) { cb(); return; }
        (this._msgDrainCbs = this._msgDrainCbs || []).push(cb);
    }

    // バトル開始/終了/teardownでビート部品を完全リセット（保留ビート・タイマを残さない）
    _resetBattleMessages() {
        this._beatQueue = [];
        this._beatIndex = -1;
        this._beatShown = 0;
        this._beatPhase = 'idle';
        this._inDrain = false;
        this._msgDrainCbs = [];
        if (this._msgTimer) { clearTimeout(this._msgTimer); this._msgTimer = null; }
        if (this._flashTimer) { clearTimeout(this._flashTimer); this._flashTimer = null; }
    }

    // コマンド入力中に小さく警告ログを表示する
    _flashCommandHeaderMessage(message) {
        const headerLabel = document.getElementById('gameMessageCharacter');
        if (!headerLabel) return;
        // 直近の本来のラベルを保持
        if (headerLabel.dataset.battleOriginalLabel == null) {
            headerLabel.dataset.battleOriginalLabel = headerLabel.textContent || '';
        }
        // 表示
        headerLabel.dataset.battleFlashing = '1';
        headerLabel.textContent = `${headerLabel.dataset.battleOriginalLabel} — ${message}`;
        // 既存のタイマを破棄して上書き
        if (this._flashTimer) clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => {
            const orig = headerLabel.dataset.battleOriginalLabel || '';
            headerLabel.textContent = orig;
            delete headerLabel.dataset.battleFlashing;
            delete headerLabel.dataset.battleOriginalLabel;
            this._flashTimer = null;
        }, 1800);
    }
    
    // ダメージエフェクト表示
    // targetIndex: 味方側のダメージ表示先（getPartyMembers() のインデックス）。
    //              null の場合は従来通り currentMemberIndex のカードに表示する。
    showDamageEffect(damage, isEnemy, isCritical = false, targetIndex = null) {
        if (window.playSE) window.playSE(isEnemy ? 'hit' : 'damage');
        const battleScreen = document.getElementById('battleScreen');
        if (!battleScreen) return;

        const damageEl = document.createElement('div');
        damageEl.className = 'damage-number' + (isEnemy ? '' : ' party-damage') + (isCritical ? ' critical' : '');
        damageEl.textContent = Math.floor(damage);
        const screenRect = battleScreen.getBoundingClientRect();

        if (isEnemy) {
            const enemyArea = document.getElementById('enemyArea');
            // ★被弾した敵スロット（targetIndex=敵index）を特定。未指定/不在なら主スプライト。
            const stage = document.querySelector('.enemy-stage');
            let hitSprite = document.getElementById('enemySprite');
            let anchor = enemyArea;
            if (stage && typeof targetIndex === 'number' && targetIndex >= 0) {
                const slot = stage.querySelector(`.enemy-slot[data-enemy-index="${targetIndex}"]`);
                if (slot) { anchor = slot; const sp = slot.querySelector('.enemy-sprite'); if (sp) hitSprite = sp; }
            }
            if (anchor) {
                const enemyRect = anchor.getBoundingClientRect();
                damageEl.style.left = `${enemyRect.left + enemyRect.width / 2 - screenRect.left}px`;
                damageEl.style.top = `${enemyRect.top + enemyRect.height * 0.34 - screenRect.top}px`;
                enemyArea && enemyArea.classList.remove('is-hit');
                if (enemyArea) { void enemyArea.offsetWidth; enemyArea.classList.add('is-hit'); setTimeout(() => enemyArea.classList.remove('is-hit'), 320); }
            } else {
                damageEl.style.left = '50%';
                damageEl.style.top = '30%';
            }
            if (hitSprite) {
                hitSprite.classList.remove('is-hit');
                void hitSprite.offsetWidth;
                hitSprite.classList.add('is-hit');
                setTimeout(() => hitSprite.classList.remove('is-hit'), 320);
            }
        } else {
            const partyContainer = document.getElementById('battlePartyStatus');
            const partyPanels = partyContainer ? Array.from(partyContainer.children) : [];
            // 敵攻撃のターゲットが指定されていればそのカードへ、未指定なら従来通り行動中メンバーのカードへ
            const baseIndex = (targetIndex !== null && targetIndex >= 0) ? targetIndex : (this.currentMemberIndex || 0);
            const panelIndex = Math.min(Math.max(baseIndex, 0), Math.max(partyPanels.length - 1, 0));
            const targetPanel = partyPanels[panelIndex];

            if (targetPanel) {
                const panelRect = targetPanel.getBoundingClientRect();
                damageEl.style.left = `${panelRect.left + panelRect.width / 2 - screenRect.left}px`;
                damageEl.style.top = `${panelRect.top + panelRect.height * 0.18 - screenRect.top}px`;
                targetPanel.classList.remove('is-hit');
                void targetPanel.offsetWidth;
                targetPanel.classList.add('is-hit');
                setTimeout(() => targetPanel.classList.remove('is-hit'), 320);
            } else {
                damageEl.style.left = '72%';
                damageEl.style.top = '70%';
            }
        }

        if (isCritical || this.isBossBattle) {
            battleScreen.classList.remove('is-shaking');
            void battleScreen.offsetWidth;
            battleScreen.classList.add('is-shaking');
            setTimeout(() => battleScreen.classList.remove('is-shaking'), 460);
        }

        battleScreen.appendChild(damageEl);
        setTimeout(() => damageEl.remove(), 1000);
    }
    
    // UI更新
    updateBattleUI() {
        // ★敵HPは一切表示しない（上部HUDは非表示・スロットのHPバーも撤去）。
        //   撃破された敵は defeated フラグを立て、スロットごと画面から消す（透明化ではなく非表示）。
        const stage = document.querySelector('.enemy-stage');
        const list = (this.enemies && this.enemies.length) ? this.enemies : (this.currentEnemy ? [this.currentEnemy] : []);
        if (stage) {
            list.forEach((enemy, idx) => {
                if ((enemy.currentHp || 0) <= 0) enemy.defeated = true;   // 撃破フラグ
                const slot = stage.querySelector(`.enemy-slot[data-enemy-index="${idx}"]`);
                if (!slot) return;
                if (enemy.defeated) slot.style.display = 'none';           // 画面から消す
            });
        }

        // パーティメンバー全員のステータス更新
        this.updatePartyStatus();
    }

    createBattlePartyMeter(label, current, max, ratio, type) {
        const meter = document.createElement('div');
        meter.className = 'battle-party-meter';

        const row = document.createElement('div');
        row.className = 'battle-party-meter-row';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;

        const valueEl = document.createElement('span');
        valueEl.className = 'battle-party-meter-value';
        valueEl.textContent = `${Math.floor(current)}/${Math.floor(max)}`;

        const track = document.createElement('div');
        track.className = 'battle-party-track';

        const fill = document.createElement('div');
        fill.className = `battle-party-fill ${type}`;
        if (type === 'hp' && ratio <= 0.25) {
            fill.classList.add('danger');
        } else if (type === 'hp' && ratio <= 0.5) {
            fill.classList.add('warn');
        }
        fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;

        row.appendChild(labelEl);
        row.appendChild(valueEl);
        track.appendChild(fill);
        meter.appendChild(row);
        meter.appendChild(track);
        return meter;
    }

    // パーティメンバーのステータス表示を更新（★ドラクエ5風: 画面下に名前＋HP/MP数値の横並び窓）
    updatePartyStatus() {
        const statusContainer = document.getElementById('battlePartyStatus');
        if (!statusContainer) return;
        const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const allMembers = this.getPartyMembers();

        statusContainer.innerHTML = '';
        allMembers.forEach((member, index) => {
            if (!member) return;

            const maxHp = Math.max(1, member.maxHp ?? member.baseMaxHp ?? 100);
            const maxMp = Math.max(0, member.maxMp ?? member.baseMaxMp ?? 50);
            const currentHp = Math.max(0, Math.min(maxHp, member.hp ?? maxHp));
            const currentMp = maxMp > 0 ? Math.max(0, Math.min(maxMp, member.mp ?? maxMp)) : 0;
            const hpPct = Math.round(currentHp / maxHp * 100);
            const mpPct = maxMp > 0 ? Math.round(currentMp / maxMp * 100) : 0;
            const name = member.name || 'カイト';
            const isActive = index === this.currentMemberIndex && this.waitingForCommand;
            const down = currentHp <= 0;

            // ★DOMは軽量・横並びの数値窓。クラス名(battle-party-card)とdataset/is-active/is-downは
            //   既存のヒット演出・手番ハイライト・入力ハンドラが参照するため維持する。
            const cell = document.createElement('div');
            cell.className = 'battle-party-card' + (isActive ? ' is-active' : '') + (down ? ' is-down' : '');
            cell.dataset.memberIndex = String(index);
            cell.setAttribute('role', 'listitem');
            cell.innerHTML =
                `<div class="bp-name">${esc(name)}${down ? ' <span class="bp-down">(ひんし)</span>' : ''}</div>` +
                `<div class="bp-line"><span class="bp-k">HP</span><span class="bp-v${hpPct <= 25 ? ' low' : ''}">${currentHp}</span><span class="bp-max">/${maxHp}</span></div>` +
                `<div class="bp-bar"><i class="bp-fill hp" style="width:${hpPct}%"></i></div>` +
                `<div class="bp-line"><span class="bp-k">MP</span><span class="bp-v">${currentMp}</span><span class="bp-max">/${maxMp}</span></div>` +
                `<div class="bp-bar"><i class="bp-fill mp" style="width:${mpPct}%"></i></div>`;

            statusContainer.appendChild(cell);
        });
    }
    
    // コマンド表示（標準のメインコマンドリストをパネルに描画）
    showCommands() {
        // フェーズを通常のコマンドモードに戻す
        this.commandPhase = 'command';
        this.waitingForCommand = true;
        this.selectedCommand = 0;

        // ★保留中の「○○の こうどう」ヘッダフラッシュ復元タイマを確定キャンセル。
        //   これをしないと、メンバー交代で正しく更新したヘッダ(例 リク のコマンド)を、
        //   1800ms後にフラッシュ復元が古いラベル(カイト のコマンド)で上書きしてズレる。
        if (this._flashTimer) { clearTimeout(this._flashTimer); this._flashTimer = null; }
        const hdrEl = document.getElementById('gameMessageCharacter');
        if (hdrEl && hdrEl.dataset) { delete hdrEl.dataset.battleFlashing; delete hdrEl.dataset.battleOriginalLabel; }

        // 現在行動中のメンバー名をヘッダに表示
        const partyMembers = this.getPartyMembers();
        const currentMember = partyMembers[this.currentMemberIndex] || partyMembers[0];
        const headerLabel = currentMember ? `${currentMember.name || 'カイト'} のコマンド` : 'コマンド';

        const standard = [
            { command: 'attack', label: 'こうげき' },
            { command: 'kamui',  label: 'カムイ' },
            { command: 'defend', label: 'ぼうぎょ' },
            { command: 'item',   label: 'どうぐ' },
            { command: 'escape', label: 'にげる' }
        ];

        BattlePanel.renderCommands(standard, {
            headerLabel,
            selectedIndex: 0,
            grid: true
        });

        // index.html 側で onclick / 選択ハイライトを設定（互換）
        if (window.setupBattleCommands) {
            window.setupBattleCommands();
        }
    }
}

// グローバルにエクスポート
window.BattleSystem = BattleSystem;
