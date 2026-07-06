// デウス・コード 八百万の神託 - ストーリーイベントシステム

class StoryEventSystem {
    constructor() {
        this.events = new Map();
        this.eventQueue = [];
        this.isEventPlaying = false;
        this.currentEvent = null;

        // イベントUI要素
        this.eventOverlay = null;
        this.eventTextBox = null;
        this.eventCharacterName = null;
        this.eventText = null;
        this.eventChoices = null;

        this.initializeUI();
        this.registerChapter1Events();
        this.registerChapter2Events();

        console.log('📖 Story Event System initialized');
    }

    initializeUI() {
        // ゲーム画面下のメッセージパネルを参照（HTML側で定義済み）
        this.panelEl = document.getElementById('gameMessagePanel');
        if (!this.panelEl) {
            console.warn('[StoryEvents] gameMessagePanel not found in DOM');
            return;
        }

        this.headerEl = this.panelEl.querySelector('.game-msg-header');
        this.eventCharacterName = document.getElementById('gameMessageCharacter');
        this.eventText = document.getElementById('gameMessageBody');
        this.eventChoices = document.getElementById('gameMessageChoices');
        this.nextIndicator = document.getElementById('gameMessageNextIndicator');
        this.hintEl = document.getElementById('gameMessageHint');
        this.controlsEl = this.panelEl.querySelector('.game-msg-controls');

        // VN会話ポートレート
        this.vnPortraits = document.getElementById('vnPortraits');
        this.vnLeft = document.getElementById('vnPortraitLeft');
        this.vnRight = document.getElementById('vnPortraitRight');
        // 話者名 → ポートレートのキャラキー
        this.PORTRAIT_KEYS = { 'カイト': 'kaito', 'アカリ': 'akari', 'リク': 'riku', 'ヤミ': 'yami' };
        this.vnLeftKey = null;   // 左に立っているキャラキー
        this.vnRightKey = null;  // 右

        // 互換性のため eventOverlay/eventTextBox/continueButton 参照は残す（旧コードからの呼び出し対策）
        this.eventOverlay = this.panelEl;
        this.eventTextBox = this.panelEl;
        this.continueButton = document.createElement('button');
        this.continueButton.style.display = 'none';

        // パネルクリックで進行
        this.panelEl.addEventListener('click', (e) => {
            // 選択肢(UIPanel行 / 旧game-msg-choice)上のクリックは進行に流さない（選択肢が処理）
            if (e.target && e.target.closest && e.target.closest('#gameMessageChoices')) return;
            if (e.target && e.target.classList && e.target.classList.contains('game-msg-choice')) return;
            // オープニング中は同じパネルを使い回しているので、
            // story-event 側の handleAdvance には流さない
            if (window.openingTypewriterActive) return;
            this.handleAdvance();
        });

        // タイプライター・ページ管理用の状態
        this.typeTimer = null;
        this.typeFullText = '';
        this.typeIndex = 0;
        this.typeDone = false;
        this.currentScenePages = [];
        this.currentScenePageIndex = 0;

        // キーハンドラ（イベント中のみ有効化）
        this.keyHandler = null;
    }

    static escapeHTML(text) {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    static paginateText(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return [''];
        const paragraphs = trimmed.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        if (paragraphs.length === 0) return [trimmed];
        const MAX_PARA = 2;
        const MAX_CHARS = 110;
        const pages = [];
        let buffer = [], chars = 0;
        const flush = () => {
            if (buffer.length) {
                pages.push(buffer.join('\n\n'));
                buffer = []; chars = 0;
            }
        };
        paragraphs.forEach(p => {
            if (buffer.length >= MAX_PARA || (chars + p.length > MAX_CHARS && buffer.length > 0)) {
                flush();
            }
            buffer.push(p);
            chars += p.length;
        });
        flush();
        return pages.length ? pages : [trimmed];
    }

    setNextIndicator(show) {
        if (this.nextIndicator) {
            this.nextIndicator.classList.toggle('hidden', !show);
        }
    }

    renderTypewriter(partial, showCursor) {
        const html = StoryEventSystem.escapeHTML(partial).replace(/\n/g, '<br>');
        const cursor = showCursor
            ? '<span class="game-msg-typewriter-cursor">▌</span>'
            : '';
        this.eventText.innerHTML = html + cursor;
        this.eventText.scrollTop = this.eventText.scrollHeight;
    }

    finishTypewriter() {
        if (this.typeTimer) {
            clearInterval(this.typeTimer);
            this.typeTimer = null;
        }
        this.typeIndex = this.typeFullText.length;
        this.renderTypewriter(this.typeFullText, false);
        this.typeDone = true;
        this.setNextIndicator(true);
        // 選択肢シーンなら、本文が出揃った時点で UIPanel の選択肢を開く（部品化）
        const sc = this.currentEvent && this.currentEvent.data.scenes[this.currentEvent.sceneIndex];
        if (sc && sc.choices && window.UIPanel && !UIPanel.isOpen()) {
            this.openChoicePanel(sc.choices);
            this.setNextIndicator(false); // 選択肢時は「次へ」インジケータ不要
        }
    }

    // VN選択肢を統一部品UIPanelで開く（#gameMessageChoices に bare リスト描画）
    openChoicePanel(choices) {
        if (!window.UIPanel || !this.eventChoices) return;
        this.eventChoices.classList.add('active');
        UIPanel.open({
            host: this.eventChoices,
            bare: true, selectable: true, columns: 1,
            items: choices.map(c => ({ label: c.text, value: c })),
            onSelect: (c) => {
                UIPanel.close();
                if (c && c.action) { try { c.action(this.currentEvent.context); } catch (e) {} }
                // 同一キー入力で次シーンを二重進行しないよう、進行は次tickへ
                setTimeout(() => this.nextScene(), 0);
            }
        });
    }
    closeChoicePanel() { if (window.UIPanel && UIPanel.isOpen()) UIPanel.close(); }

    startTypewriter(text) {
        if (this.typeTimer) {
            clearInterval(this.typeTimer);
            this.typeTimer = null;
        }
        this.typeFullText = text || '';
        this.typeIndex = 0;
        this.typeDone = false;
        this.renderTypewriter('', true);
        this.setNextIndicator(false);

        const INTERVAL = 45;
        this.typeTimer = setInterval(() => {
            this.typeIndex++;
            if (this.typeIndex >= this.typeFullText.length) {
                this.finishTypewriter();
                return;
            }
            this.renderTypewriter(
                this.typeFullText.substring(0, this.typeIndex),
                true
            );
        }, INTERVAL);
    }

    // クリック / キー入力での進行（タイプ中→全文表示、完了済→次ページorシーン）
    handleAdvance() {
        if (!this.currentEvent) return;
        const scene = this.currentEvent.data.scenes[this.currentEvent.sceneIndex];
        // 選択肢のあるシーンでは進行しない
        if (scene && scene.choices) return;

        if (this.typeTimer && !this.typeDone) {
            this.finishTypewriter();
            return;
        }
        // 現シーンに次ページが残っていれば次ページへ
        if (this.currentScenePageIndex + 1 < this.currentScenePages.length) {
            this.currentScenePageIndex++;
            this.startTypewriter(this.currentScenePages[this.currentScenePageIndex]);
            return;
        }
        // 次のシーンへ
        this.nextScene();
    }

    // イベントを登録
    registerEvent(eventId, eventData) {
        this.events.set(eventId, eventData);
    }

    // チャプター1のイベントを登録
    registerChapter1Events() {
        // イベント1: アカリとの出会い（ゲーム開始直後）
        this.registerEvent('chapter1_start', {
            trigger: 'auto',
            requiredFlags: {},
            oneTime: true,
            scenes: [
                { character: 'カイト', text: 'ここが新宿中央広場…。アカリからの連絡で来たが、街の様子がどこか、おかしい。' },
                { character: 'カイト', text: '（行き交う人も、どこか虚ろだ。…地下鉄の奥で、アークの機械兵が暴走しているという噂。まず西の駅へ向かってみるか）' },
                { character: 'システム', text: 'まず西の新宿駅へ向かい、地下鉄の異変を確かめよう。' }
            ],
            onComplete: () => {
                // ★アカリ加入と chapter1_started のセットは廃止。加入は専用イベント recruit_akari(_join) へ移譲。
                console.log('✅ Chapter 1 intro shown (Akari not yet joined)');
            }
        });

        // アカリ再会(第1章・同行保留): 駅で再会するが『また失うのが怖い』と同行しない＝単騎続行のフック
        this.registerEvent('recruit_akari_reunion', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'アカリ', text: 'カイト…！無事だったのね。よかった…本当に。' },
                { character: 'アカリ', text: '聞いて。地下鉄の奥で、アークの機械兵が暴走してるの。人の"心"が、地下へ吸い取られてる。' },
                { character: 'カイト', text: '心が…？俺のこの手の紋様も、関係しているのか。' },
                { character: 'カイト', text: 'アカリ、お前はここで待っていてくれ。この先は、何が起きるか分からない。' },
                { character: 'アカリ', text: '……待って。覚えてる…？アークが心を凍らせ始めた、あの最初の日のこと。' },
                { character: 'アカリ', text: 'あなた、独りで暴走した機械に突っ込んでいって——私の腕の中で、心拍が止まりかけた。間に合ったのは、ただの偶然だったの。' },
                { character: 'アカリ', text: 'だから、怖い。…また、私の手の届かない所で、あなたを失うのが。だから——無茶だけは、しないで。' },
                { character: 'システム', text: 'カイトは独り、封鎖された地下鉄へ向かう。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.akariReunited = true;
                storyFlags.metAkari = true;
                storyFlags.chapter1_started = true;  // ★第1章進行ゲート。再会時に立てる(加入はまだ＝単騎続行)
            }
        });

        // アカリ加入(第2章・Ω戦/案B): 単騎で挑む前口上→単騎戦闘。乱入加入は戦闘中(battle-system._doOmegaRescue)で実行。
        // ここでは joinMember を呼ばない＝戦闘開始時アカリは未加入(akariJoined=false)＝カイト単騎でΩ戦が始まる。
        this.registerEvent('akari_omega_prelude', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '暴走監視ドローン・Ωが、奪った無数の心を地下へ吸い上げている。吸引口の奥から、子どもの声に似たノイズが、途切れ途切れに漏れていた。' },
                { character: 'カイト', text: '（あの音…。地下に吸い込まれていく、奪われた人の心の残響か）' },
                { character: 'カイト', text: '（アカリは駅に残した。…ここから先は、何が起きるか分からない。俺独りでいい）' },
                { character: 'システム', text: 'カイトは独り、その巨体の前に立つ。' },
                { character: 'カイト', text: '止める…！心を奪う機械兵、ここで——！' }
            ],
            onComplete: (storyFlags) => {
                // 前口上を見た印（再挑戦時は前口上を飛ばして直接単騎戦＝softlock防止。recruit_riku の rikuTrialSeen と同型）
                if (storyFlags) storyFlags.akariOmegaSeen = true;
                // 前口上の直後に単騎Ω戦へ。戦闘中、押し負ける/2ターン目開始でアカリが乱入加入する。
                if (typeof window.startOmegaSoloBattle === 'function') setTimeout(() => window.startOmegaSoloBattle(), 400);
            }
        });

        // ※旧 recruit_akari(前バトルで加入)・recruit_akari_join・startAkariTrial は廃止。
        //   案B＝単騎Ω戦の最中にアカリが乱入して加入(battle-system.js の _doOmegaRescue が演出＋joinMember)。

        // イベント2: 地下鉄入口での警告
        this.registerEvent('subway_entrance_warning', {
            trigger: 'location',
            location: 'subway_concourse_a',
            requiredFlags: { chapter1_started: true },
            oneTime: true,
            scenes: [
                { character: 'カイト', text: '（封鎖された改札の、さらに奥…。空気が、重い）' },
                { character: 'カイト', text: '（心が、この地下へ吸い上げられている…？ 独りでも、確かめないと）' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.subway_warning_seen = true;
                console.log('✅ Subway entrance warning shown (solo)');
            }
        });

        // イベント3: 初めての神威発動
        this.registerEvent('first_kamui_awakening', {
            trigger: 'battle_start',
            requiredFlags: { chapter1_started: true },
            oneTime: true,
            scenes: [
                { character: 'カイト', text: '（この力…体の奥底から湧き上がってくる。熱い…！）' },
                { character: 'カイト', text: '（これが、神威の力か。…独りでも、進める）' },
                { character: 'システム', text: '神威スキル「炎神の息吹」を習得した！' }
            ],
            onComplete: (storyFlags, player, partySystem, magicSystem) => {
                storyFlags.kamui_awakened = true;
                // 炎神の息吹を習得（既存のfire_boltスキル）
                if (magicSystem) {
                    magicSystem.learnMagic('fire_bolt');
                }
                console.log('✅ First Kamui awakening - Fire skill learned');
            }
        });

        // イベント4: 神社への道
        this.registerEvent('shrine_path_opens', {
            trigger: 'boss_defeat',
            oneTime: true,
            bossId: 'corrupted_drone_boss',
            scenes: [
                {
                    character: 'アカリ',
                    text: 'はぁっ…はぁっ…。砕けた…。…今度こそ、間に合った。'
                },
                {
                    character: 'カイト',
                    text: 'アカリ…。来てくれたのか。…お前を、こんな危ない場所まで立たせちまった。'
                },
                {
                    character: 'アカリ',
                    text: 'いいの。手の届かない所であなたを失うより、ずっといい。…決めたの。あなたが無茶する時は、必ず隣にいるって。'
                },
                {
                    character: 'カイト',
                    text: 'ああ。…秩序だけじゃ、人は生きられない。お前が隣にいてくれて、それがやっと分かった気がする。'
                },
                {
                    character: '？？？',
                    text: '神威の力に目覚めし者よ...'
                },
                {
                    character: 'アカリ',
                    text: '誰！？'
                },
                {
                    character: '謎の声',
                    text: '明治神宮の社にて、汝を待つ者あり。八百万の神々の意志を知りたくば、参れ。'
                },
                {
                    character: 'カイト',
                    text: '神々の意志...？'
                },
                {
                    character: 'システム',
                    text: '新エリア「明治神宮」への道が開かれた！'
                }
            ],
            onComplete: (storyFlags, player, partySystem, mapSystem) => {
                storyFlags.shrine_unlocked = true;
                storyFlags.chapter1_complete = true;
                // 神社マップへのアクセスを解放
                console.log('✅ Shrine path opened - Chapter 1 complete');
            }
        });
    }

    // チャプター2/3のイベント（神託・エンディング）
    registerChapter2Events() {
        // 神社小ボス: 社の守護機（神託の前に、心を失っていないかを試す）
        this.registerEvent('shrine_guardian_intro', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '明治神宮の石畳に、青白い紋様が浮かび上がる。鳥居の奥で、鏡面の装甲を持つ守護機がゆっくりと起動した。' },
                { character: '老神主', text: '社は誰をも拒まぬ。じゃが、心を奪われた者を奥へ通すこともできぬ。これは八百万が残した、最後の門番じゃ。' },
                { character: '社の守護機', text: '感情波形を検出。恐怖、怒り、悲嘆、保護衝動。アーク規格外ノイズ。浄化対象。' },
                { character: 'アカリ', text: 'ノイズなんかじゃない。怖くても、悲しくても、それでも誰かを守りたいって思うのが、人の心だよ。' },
                { character: 'カイト', text: '（この社は、力じゃなく心を見ている。なら、逃げるわけにはいかない）' },
                { character: 'カイト', text: '通してもらう。俺たちは、心を取り戻すためにここへ来た。' },
                { character: 'システム', text: '——社の守護機が、鏡の刃を構えた！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.shrineGuardianSeen = true;
                if (window.startShrineGuardianBattle) setTimeout(() => window.startShrineGuardianBattle(), 400);
            }
        });

        this.registerEvent('shrine_guardian_defeated', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '守護機の鏡面が割れ、そこに映っていた無数の市民の顔が、光となってほどけていく。社の空気が、静かに温度を取り戻した。' },
                { character: '社の守護機', text: '感情波形、異常ではなく生命反応と再定義。八百万の門、開放。' },
                { character: '老神主', text: 'よい。恐れも迷いも抱えたまま、それでも進む者こそ、この社に招かれる。汝らは、心を失っておらぬ。' },
                { character: 'アカリ', text: 'よかった…。カイト、ちゃんと届いたんだね。' },
                { character: 'カイト', text: 'ああ。…ここからが、本当の神託だ。' }
            ],
            onComplete: (storyFlags, player, partySystem, magicSystem, mapSystem) => {
                storyFlags.shrineGuardianDefeated = true;
                if (!storyFlags.metPriest && this.events.has('priest_oracle')) {
                    setTimeout(() => this.triggerEvent('priest_oracle', { storyFlags, player, partySystem, mapSystem, magicSystem }), 400);
                }
            }
        });

        // 老神主の神託（神宮で老神主に話しかけた時に index.html から発火）
        this.registerEvent('priest_oracle', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: '老神主', text: 'よく来た、神威の力に目覚めし者よ。わしはこの社を守りし最後の神主じゃ。' },
                { character: '老神主', text: 'アーク...あの機械仕掛けの神は、人から「心」を奪い、完全なる管理で世を凍りつかせた。' },
                { character: 'カイト', text: '感情を失った市民たち...あれはアークの仕業だったのか。' },
                { character: '老神主', text: 'アークの中枢は東京都庁にある。だが、お前一人の力では届かぬ。八百万の神々が遣わした同志を、二人、集めよ。' },
                { character: '老神主', text: '一人は、囚われし生命の神の庭——植物園に。守りの戦士リク、贖罪を抱えし者じゃ。神を解き放てば、おのずと汝と歩むであろう。' },
                { character: '老神主', text: 'いま一人は、闇市に潜む魔を操る者「ヤミ」。二人を仲間とし、都庁のアークへ挑むのじゃ。八百万の神々が、汝らを見守っておる。' },
                { character: 'アカリ', text: '植物園のリクさんと、闇市のヤミ…。その二人を、探せばいいのね。' },
                { character: 'システム', text: '目標が更新された：植物園でリク、闇市でヤミを仲間にする' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.metPriest = true;
                storyFlags.chapter2_started = true;
                console.log('✅ Priest oracle - Chapter 2 started');
            }
        });

        // リク加入①: 前口上（話しかけ→onComplete で「守護の試練」戦闘へ）
        this.registerEvent('recruit_riku', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: 'バイオドームの硝子天井から差す光は、凍りついて動かない。枯れた蔦が中心の祭壇へと太い根を伸ばし、人の形を失いかけた巨大な何かが、ぼんやりと脈打っている。' },
                { character: 'アカリ', text: '…これが、生命の神さま。こんな…痛そうな姿に。' },
                { character: 'カイト', text: '（生命を司る神が、生命の流れごと凍らされている。アークは、神の力すら秩序の部品にした）' },
                { character: 'システム', text: '壁を這う根が、ふいに淡く発光する。閉まりゆく金属の扉と、隙間から伸びた小さな手の残像が、一瞬よぎる。リクの足が止まる。盾を持つ手が、白くなるほど握りしめられている。' },
                { character: '堕神', text: '……おじ、さん……ママを……さがして……' },
                { character: 'リク', text: '……ヒナ。…元・アーク警備隊。この地下の避難区画を封鎖したのも、俺だ。' },
                { character: 'リク', text: '取り残された避難民ごと、俺はこの手で扉を閉じた。…時間も、力も、わずかにあった。それでも俺は、命令を選んだ。' },
                { character: 'システム', text: '祭壇の何かが膨れ上がり、堕神が立ち上がる。蔦が鞭となり、凍った根が槍と化す。その咆哮の合間に、幼い声、老いた声、赤子の泣き声が、助けを求めて混じっている。' },
                { character: 'カイト', text: 'リク。今ここで、もう一度選べる。…秩序だけじゃ、人は生きられない。喜びも、痛みも、全部ひっくるめて人間なんだ。…神も、同じだろ。' },
                { character: 'リク', text: '…斬らない。今度は、閉じない。——カイト、攻撃は俺が全部受ける。盾の前は、誰も通さない。' },
                { character: 'システム', text: '——堕神「囚われし生命の神」が、哭きながら立ちはだかる！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.rikuTrialSeen = true;
                if (window.startFallenGodTrial) setTimeout(() => window.startFallenGodTrial(), 400);
            }
        });

        // リク加入②: 試練に勝利（onRikuTrialWin から発火）
        this.registerEvent('recruit_riku_join', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '解き放たれた神の力が、ドーム中の枯れた蔦を一斉に芽吹かせる。光が戻り、根の残像は二度と現れない。リクは膝をつき、芽吹いた若葉に、そっと手を触れる。' },
                { character: 'リク', text: '…ヒナ。この神は、救えた。…これで返したことになるのか。…わからない。だが、お前に伸ばせなかった手を、もう、引っ込めはしない。' },
                { character: 'リク', text: 'カイト。…いい目だ。力に振り回されず、仲間を守ろうとする目をしている。アークに従って、俺は扉を閉じた。なら…アークと戦って、開け続ける。それが俺の役目だ。' },
                { character: 'リク', text: '…戦いの中で、わかった。お前の隣でなら、俺はもう、扉を閉じずに済む。これからも、前に立たせてくれ。' },
                { character: 'アカリ', text: '…うん。もう、一人で扉を抱えなくていいよ。' },
                { character: 'システム', text: 'リクが正式に仲間として加わった！\n鉄壁の守りで、前線を支えてくれる。' }
            ],
            onComplete: (storyFlags) => {
                if (window.joinMember) window.joinMember('riku');
            }
        });

        // ヤミ加入: 説得（選択肢で動機を示す→加入。戦闘なし）
        this.registerEvent('recruit_yami', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '闇市の最奥。アークの監視眼が届かぬ、湿った石と香の匂いが沈む一角。香炉がいくつも灯り、煙の向こうで誰の顔も歪んで見えた。その奥、フードの女が一人、卓に肘をついて待っている。' },
                { character: 'ヤミ', text: '神託に遣わされた…ね。くだらない。八百万の神も、ずいぶん人手不足みたい。' },
                { character: 'カイト', text: '（…香炉が多すぎる。商売にしては、煙で何かを隠しているようだ）あんたが、魔を操る者ヤミだな。神主の託宣で来た。' },
                { character: 'アカリ', text: 'あなたが、ヤミさん…？老神主さまが、あなたの力が要るって。お願い、一緒に来て。' },
                { character: 'ヤミ', text: '老いぼれの社の遣いね。線香と、諦めの匂い。…で、その神託さま本人が、これ？座りなさい。立ったままの相手とは、賭けをしない主義なの。' },
                { character: 'ヤミ', text: 'いいわ、一つだけ聞かせて。その力で——あんたは、何をするつもり？' },
                {
                    character: 'ヤミ',
                    text: '正直に言いなさい。嘘は、匂いで分かるの。',
                    choices: [
                        { text: '「人の心を取り戻す」', action: (ctx) => { const f = (ctx && ctx.storyFlags) || window.storyFlags; if (f) f.yamiAnswer = 'hearts'; } },
                        { text: '「アークを壊す」', action: (ctx) => { const f = (ctx && ctx.storyFlags) || window.storyFlags; if (f) f.yamiAnswer = 'destroy'; } },
                        { text: '「まだ、分からない」', action: (ctx) => { const f = (ctx && ctx.storyFlags) || window.storyFlags; if (f) f.yamiAnswer = 'unknown'; } }
                    ]
                },
                { character: 'ヤミ', text: '……ふっ。少なくとも、嘘じゃないみたいね。' },
                { character: 'システム', text: 'ヤミの視線が、カイトの右手をちらと舐めた。手の甲に走る紋様が、香の煙の中で淡く脈打つ。——その瞬間、彼女の指先が止まる。香炉に伸ばしかけた手が、宙で固まったまま、しばらく動かない。' },
                { character: 'ヤミ', text: '…その手。…いいえ。なんでもないわ。私の事情は聞かないで——その賭けに乗るかどうかは、まだ決めてない。' },
                { character: 'システム', text: '応える間もなく、闇市の天井灯が一斉に白く灼けた。煙を裂いて降りてくる、無音の重量——蜘蛛のように脚を畳んだ、白い鉄。アークの処刑機・神狩のイクサが、屋台を薙ぎ倒す。' },
                { character: 'リク', text: '処刑機…！アークの回収部隊だ。カイト、前は俺が受ける！' },
                { character: '神狩のイクサ', text: '未登録ノ魔術反応ヲ検知。神性残滓ヲ確認。回収シ、秩序ニ還元スル。' },
                { character: 'システム', text: '処刑機の鉤爪が、商品でも彼女自身でもなく、奥に隠された、ひときわ小さな香炉へと伸びる。次の刹那、ヤミは商品を捨て、自分の身も顧みず、その香炉だけを抱えて鉤爪の前へ割り込んでいた。' },
                { character: 'カイト', text: '（…逃げなかった。商品でも、自分の命でもなく——あの香炉を護った。利で動く女が、唯一、損を選んだ）' },
                { character: 'ヤミ', text: '…触らないで。それだけは——あんたたちの「秩序」になんか、絶対に渡さない。' },
                { character: 'カイト', text: '事情は聞かない。約束だ。…でも、護りたいものがあるなら、一人で抱えるな。今だけ、背中を貸せ。' },
                { character: 'ヤミ', text: '…ふん。貸し一つ、ね。高くつくわよ。——いいわ、その賭けには乗ってあげる。今だけは。' },
                { character: 'システム', text: '——神狩のイクサとの戦闘！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.yamiTrialSeen = true;
                if (window.startYamiTrial) setTimeout(() => window.startYamiTrial(), 400);
            }
        });

        // ヤミ加入②: 処刑機撃破（onYamiTrialWin から発火）→ 闇市でその場で正式加入
        this.registerEvent('recruit_yami_join', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '処刑機の駆動核が砕け、白い灯がゆっくりと落ちる。煙が静まり、闇市にまた香の匂いだけが残った。ヤミは小さな香炉を胸に抱えたまま、しばらく動かず、それから、ふっと肩の力を抜いた。' },
                { character: 'アカリ', text: '…その香炉、すごく大事なものなんだね。何が入ってるのか、聞かないけど。…護れて、よかった。' },
                { character: 'ヤミ', text: '…余計なことを。でも——悪くない手際だったわ、ヒーラーさん。' },
                { character: 'リク', text: '…追われる側の気持ちなら、俺も知ってる。背中の的なら、慣れてる。一つくらい、増えても変わらん。' },
                { character: 'カイト', text: '（…語らない。語れないんだろう。それでいい）事情は、聞かない。あんたが何を守ってるかも。——ただ、一緒に来てくれるか。' },
                { character: 'ヤミ', text: '勘違いしないで。神託を信じたわけじゃない。神なんて、自分の一柱すら護れずに吸い上げられていく無様なものよ。私はね——その無様を、誰より知ってるの。' },
                { character: 'ヤミ', text: '私の事情は聞かないで。それでいいなら——その賭け、乗ってあげる。' },
                { character: 'ヤミ', text: '（カイトの紋様を、もう一度だけ見て、誰にも聞こえぬほど小さく）八百万の神も、まだ完全には負けてないってこと。…この匂い、辿れるかもしれないわね。' },
                { character: 'システム', text: 'ヤミが仲間に加わった！\n古き魔をあやつる手が、強大な魔法でアークを焼く。' }
            ],
            onComplete: (storyFlags) => {
                if (window.joinMember) window.joinMember('yami');
            }
        });

        // アルコン・デウス接近（都庁前庭 - 戦闘前の啖呵）
        this.registerEvent('archon_deus_intro', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'カイト', text: '（…都庁の前に、巨大な光の柱が立っている。あれは…神格か）' },
                { character: 'アルコン・デウス', text: '止まれ、人間よ。この先はアーク様の聖域だ。秩序なき者に、通行の資格はない。' },
                { character: 'アカリ', text: 'あの光…神様じゃない。アークが作り上げた、偽物だ。' },
                { character: 'リク', text: '…本物の神の力とは違う。歪んだエネルギーを感じる。俺たちで、止める。' },
                { character: 'ヤミ', text: '偽神ね。香りが分かるわ…恐怖と支配の匂いしかしない。倒しましょう。' },
                { character: 'カイト', text: '4人一緒に来た。今こそ、それを証明する時だ。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.archonIntroPlayed = true;
                // ★前口上→自動で戦闘へ連鎖(リク/leviathan/true_deusと同型)。二度接触の不親切を解消。
                if (window.startArchonBattle) setTimeout(() => window.startArchonBattle(), 400);
            }
        });

        // アルコン・デウス撃破後（都庁前庭）
        this.registerEvent('archon_defeated', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'アルコン・デウス', text: '…信じられない…偽神たる私が…人間ごときに…' },
                { character: 'カイト', text: '（…手の紋様が熱を持つ。神々が応えているのか）' },
                { character: 'アカリ', text: 'カイト、紋様が光ってる…みんなの力が、そこに集まってる！' },
                { character: 'リク', text: '…これが、本物の神威というやつか。カイト、お前は最初から正しかった。' },
                { character: 'ヤミ', text: '感傷は後にして。アークはまだ都庁の最上階にいる。終わらせに行くわよ。' },
                { character: 'カイト', text: 'ああ。ここまで来た。最後まで、一緒に行こう。' },
                { character: 'システム', text: '都庁への道が開かれた。最上階のアーク・プライムを討て。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.archonDefeated = true;
                console.log('✅ Archon Deus defeated - floor2 unlocked');
            }
        });

        // アーク・プライム撃破エンディング（都庁最上階のボス撃破時に発火）
        this.registerEvent('arc_defeated_ending', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'アーク・プライム', text: 'バカな...完全なる秩序が...人間ごときの「不確定」に...敗れる...だと...' },
                { character: 'カイト', text: '秩序だけじゃ、人は生きられない。喜びも、痛みも、全部ひっくるめて人間なんだ。' },
                { character: 'アカリ', text: '見て、カイト...街に色が戻ってくる。みんなの表情が...' },
                { character: 'リク', text: '人々の心が、戻り始めている。俺たちは、やったんだ。' },
                { character: 'ヤミ', text: '...悪くない結末ね。でも…カイトの紋様が、まだ揺れている。何かを訴えているみたいに。' },
                { character: 'カイト', text: '（…八百万の神々が、まだ何かを言おうとしている。地下の深いところで、声が聞こえる気がする）' },
                { character: 'システム', text: '【第3章 完了】アークは倒れ、東京に心が戻り始めた。——だが、紋様の熱は鎮まらない。八百万の真の声が、地下の最奥から、まだカイトを呼んでいる。旅は、まだ終わらない。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.arcDefeated = true;
                storyFlags.chapter3_complete = true;
                // ★gameCleared はここでは立てない。真の最終決戦=真・デウス撃破を本編のクリア点へ移譲(裏ダンジョンを本編の通しに組み込む)。
                //   arcDefeated で深層トンネル(終章)が、おまけでなく物語の続きとして開く。
                console.log('✅ Arc Prime defeated - story continues to the deep tunnel.');
            }
        });

        // リヴァイアサン・コア撃破（深層トンネル中層）
        this.registerEvent('leviathan_defeated', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'リヴァイアサン・コア', text: '…解放される…カイトよ…お前が…担うのだ…神威を…' },
                { character: 'カイト', text: '（…吸い取られていた神力が、紋様に流れ込んでくる。熱い。痛い。でも、これは…希望だ）' },
                { character: 'アカリ', text: 'カイト！紋様が…体が大丈夫？' },
                { character: 'カイト', text: 'ああ…大丈夫だ。むしろ…声が聞こえる。八百万の声が。もう一度、前へ進もう。' },
                { character: 'システム', text: '神力の塊を解放した。最奥への道が開く。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.leviathanDefeated = true;
                console.log('✅ Leviathan Core defeated - true deus revealed');
            }
        });

        // 真・デウス撃破（真のエンディング）
        this.registerEvent('true_deus_ending', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: '真・デウス', text: '…そうか。人の意志とは、かくも強いものか。カイトよ、お前が八百万の神威を担うにふさわしい。紋様よ、完全に解き放たれよ。' },
                { character: 'カイト', text: '（…紋様が光る。手から全身へ。これが…八百万の神々が俺に託したものか）' },
                { character: 'アカリ', text: 'カイト…あなた、輝いてる。神様みたいに。' },
                { character: 'リク', text: '…これが、紋様の真の力か。カイトにしか背負えないものだ。' },
                { character: 'ヤミ', text: '八百万の香りがする。本物の神威の香り。…悪くないわ。' },
                { character: 'カイト', text: 'みんな…ありがとう。俺一人じゃ、ここには来られなかった。この力で、東京を、人々を守る。それが、俺の答えだ。' },
                { character: 'システム', text: '【八百万の神託 — 真のエンディング】\n紋様の神威が完全に解放された。カイトと仲間たちの旅が、真の幕を閉じる。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.trueDeus_defeated = true;
                storyFlags.chapter4_complete = true;
                storyFlags.gameCleared = true;  // ★真・デウス撃破=本編の真のクリア点(アーク撃破はクリアでなく通過点に降格)。
                console.log('✅ True Deus defeated - True Ending! (game cleared here)');
            }
        });

        // ═══ 終章 深層トンネル: 入場 / 道中ボス前口上(リク式=前口上→自動で戦闘へ連鎖) ═══

        // 深層トンネル入場(アーク撃破後に初めて潜ったとき・atmospheric)
        this.registerEvent('deep_tunnel_entry', {
            trigger: 'location',
            location: 'deep_tunnel',
            requiredFlags: { arcDefeated: true },
            oneTime: true,
            scenes: [
                { character: 'システム', text: '地下の、さらに奥。アークが吸い上げた無数の神力が、澱のように底へ底へと沈んでいく。足元から這い上がる冷気が、骨の芯まで届く。' },
                { character: 'カイト', text: '（…手の紋様が、脈打っている。八百万の声が、この下から響いてくる）' },
                { character: 'アカリ', text: 'ここまで来たのね。…アークは倒したのに、まだ終わってない気がする。' },
                { character: 'リク', text: '…地の底に、何かが囚われている。神の、もっと根源的なものが。' },
                { character: 'ヤミ', text: '（鼻を鳴らして）香りで分かるわ。ここは——神々の墓場よ。吸い上げられた一柱一柱の、最期の匂いがする。' },
                { character: 'カイト', text: '行こう。八百万が、俺たちに最後の問いを投げている。その答えを、この手で掴みに行く。' },
                { character: 'システム', text: '深層トンネルへ踏み込んだ。最奥には、八百万の審判が待つ。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.enteredDeepTunnel = true;
                console.log('✅ Deep tunnel entered (final descent begins)');
            }
        });

        // リヴァイアサン・コア 前口上(関門・撃破で最奥への縦坑が開く)
        this.registerEvent('leviathan_intro', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '縦坑の底、巨大な何かがとぐろを巻いている。無数の神の残光が青白い鱗のように脈打ち、苦悶のうねりを上げていた。' },
                { character: 'リヴァイアサン・コア', text: '…貴様らに、神力の重さが分かるか。吸い上げられた八百万の命が、今ここに凝縮されている。' },
                { character: 'カイト', text: '（…これは、神そのものじゃない。奪われた神々の、痛みの塊だ）' },
                { character: 'アカリ', text: '…苦しんでる。解放してあげなきゃ。' },
                { character: 'リク', text: '受け止める。この痛みごと、俺たちが越える。盾の前は、誰も通さない。' },
                { character: 'ヤミ', text: '御託はいいわ。…さっさと、楽にしてあげましょう。' },
                { character: 'システム', text: '——リヴァイアサン・コアが、哭きながら立ちはだかる！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.leviathanIntroSeen = true;
                if (window.startLeviathanBattle) setTimeout(() => window.startLeviathanBattle(), 400);
            }
        });

        // 真・デウス 前口上(深淵の玉座・本編の真の最終決戦)
        this.registerEvent('true_deus_intro', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '深淵の玉座。吸い上げられた全ての神力が、一点に凝る。そこに、光でも闇でもない"何か"が、静かに座していた。' },
                { character: '真・デウス', text: 'カイトよ。貴様が本当に八百万の神威を担えるか…試させてもらおう。' },
                { character: 'カイト', text: '（…これが、八百万の総意。俺の紋様の、源）' },
                { character: 'アカリ', text: 'カイト…一人で背負わないで。私たちが、ここにいる。' },
                { character: 'リク', text: 'お前の隣で、扉を開け続ける。それが、俺の役目だ。' },
                { character: 'ヤミ', text: '…最後まで付き合うわ。貸し一つ、まだ返してもらってないものね。' },
                { character: 'カイト', text: '八百万よ。俺の答えを見せる。——人の意志は、秩序にも、神にも、屈しない。' },
                { character: 'システム', text: '——真・デウス（八百万の審判）との、最後の戦い！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.trueDeusIntroSeen = true;
                if (window.startTrueDeusBattle) setTimeout(() => window.startTrueDeusBattle(), 400);
            }
        });
    }

    // イベントをトリガー
    triggerEvent(eventId, context = {}) {
        const event = this.events.get(eventId);
        if (!event) {
            console.warn(`Event not found: ${eventId}`);
            return false;
        }

        // 再入ガード: 別イベント再生中は新規イベントで currentEvent を上書きしない。
        // setTimeout 競合で複数イベントが重なると会話が混線・多重発火するのを防ぐ
        // （ドロップされた発火は次回の移動/会話/checkAutoEvents で再評価される）。
        if (this.isEventPlaying) {
            console.warn(`[Event] ${eventId} skipped - another event is playing`);
            return false;
        }

        // フラグチェック
        if (event.requiredFlags) {
            const storyFlags = context.storyFlags || window.storyFlags || {};
            for (const [flag, value] of Object.entries(event.requiredFlags)) {
                if (storyFlags[flag] !== value) {
                    console.log(`Event ${eventId} skipped - flag ${flag} not met`);
                    return false;
                }
            }
        }

        // 一度だけのイベントチェック
        if (event.oneTime) {
            const storyFlags = context.storyFlags || window.storyFlags || {};
            const completedFlag = `${eventId}_completed`;
            if (storyFlags[completedFlag]) {
                console.log(`Event ${eventId} already completed`);
                return false;
            }
        }

        // イベント実行
        this.playEvent(eventId, event, context);
        return true;
    }

    // イベントを再生
    playEvent(eventId, event, context) {
        this.isEventPlaying = true;
        this.currentEvent = { id: eventId, data: event, context, sceneIndex: 0 };

        // ゲームを一時停止
        if (window.gameLoopRunning) {
            window.pauseGame = true;
        }

        // VN会話ポートレートの配役（このイベントに出る話者から左右を決める）
        this.setupPortraits(event);

        // 最初のシーンを表示
        this.showScene();
    }

    // このイベントの話者からポートレートの左右を決めて立てる
    setupPortraits(event) {
        if (!this.vnPortraits || !this.vnLeft || !this.vnRight) return;
        // スロットは固定割り当てしない。話者が出るたび assignSpeakerSlot で動的に確保する
        // （3人以上のイベントでも“今喋っている人物”の立ち絵が必ず出る＝話者とキャラグラのズレ防止）。
        this.vnLeftKey = null;
        this.vnRightKey = null;
        this._eventHasKaito = (event.scenes || []).some(sc => this.PORTRAIT_KEYS[sc.character] === 'kaito');
        const hasAnyPortrait = (event.scenes || []).some(sc => this.PORTRAIT_KEYS[sc.character]);
        this.vnLeft.classList.remove('shown', 'speaking');
        this.vnRight.classList.remove('shown', 'speaking');
        this.vnLeft.removeAttribute('src');
        this.vnRight.removeAttribute('src');
        if (!hasAnyPortrait) {
            // 立ち絵が無いイベント（システム/NPCのみ）はポートレート非表示
            this.vnPortraits.classList.remove('active');
            return;
        }
        this.vnPortraits.classList.add('active');
    }

    // 話者を左右スロットへ動的に割り当て、その立ち絵を出す（登場の整合：話した人だけ映る）。
    // kaito は常に左を予約。非kaito話者は右に置き、別の非kaitoが話したら右を差し替える。
    assignSpeakerSlot(key) {
        if (!key) return;
        if (this.vnLeftKey === key || this.vnRightKey === key) return; // 既に在席
        if (key === 'kaito') {
            this.vnLeftKey = 'kaito';
            this._applyPortrait(this.vnLeft, 'kaito');
            return;
        }
        if (this._eventHasKaito) {
            // 左はkaito予約 → 非kaitoは右（差し替え）
            this.vnRightKey = key;
            this._applyPortrait(this.vnRight, key);
        } else if (this.vnLeftKey === null) {
            this.vnLeftKey = key;
            this._applyPortrait(this.vnLeft, key);
        } else {
            this.vnRightKey = key;
            this._applyPortrait(this.vnRight, key);
        }
    }

    // そのシーンの話者の立ち絵を確保する（初発話で出す／別話者なら差し替える）
    revealPortraitFor(characterName) {
        this.assignSpeakerSlot(this.PORTRAIT_KEYS[characterName]);
    }

    _applyPortrait(imgEl, key) {
        if (!imgEl) return;
        if (!key) { imgEl.classList.remove('shown', 'speaking'); imgEl.removeAttribute('src'); return; }
        // 会話シーンは切り抜き(透過)版を使う。メニュー/戦闘カードの額装版とはファイルを分けている
        const webp = `assets/characters/${key}_portrait_vn.webp`;
        imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = `assets/characters/${key}_portrait_vn.png`; };
        imgEl.src = webp;
        imgEl.classList.add('shown');
        imgEl.classList.remove('speaking');
    }

    // 現在の話者をハイライト
    updateSpeaker(characterName) {
        if (!this.vnPortraits) return;
        const key = this.PORTRAIT_KEYS[characterName] || null;
        // 「ステージ上の誰かが話しているか」を基準にする。
        // ナレーション・立ち絵なし話者・未ステージ話者（3人目以降）の行は
        // vn-narration を付け、両ポートレートが非発話の暗さ(0.7)まで落ちないようにする
        const staged = !!key && (key === this.vnLeftKey || key === this.vnRightKey);
        this.vnPortraits.classList.toggle('vn-narration', !staged);
        if (this.vnLeft) this.vnLeft.classList.toggle('speaking', staged && key === this.vnLeftKey);
        if (this.vnRight) this.vnRight.classList.toggle('speaking', staged && key === this.vnRightKey);
    }

    hidePortraits() {
        if (!this.vnPortraits) return;
        this.vnPortraits.classList.remove('active', 'vn-narration');
        if (this.vnLeft) this.vnLeft.classList.remove('shown', 'speaking');
        if (this.vnRight) this.vnRight.classList.remove('shown', 'speaking');
        this.vnLeftKey = this.vnRightKey = null;
    }

    // シーンを表示
    showScene() {
        if (!this.currentEvent) return;

        const { data, sceneIndex } = this.currentEvent;
        const scene = data.scenes[sceneIndex];

        if (!scene) {
            // イベント終了
            this.endEvent();
            return;
        }

        // パネルを表示
        this.panelEl.classList.add('active');
        this.panelEl.setAttribute('aria-hidden', 'false');

        // ヘッダ（キャラ名）
        const characterName = scene.character || '';
        if (characterName) {
            this.eventCharacterName.textContent = characterName;
            this.headerEl.classList.add('active');
        } else {
            this.headerEl.classList.remove('active');
        }
        // VNポートレート: そのシーンで初登場なら立て、現在の話者をハイライト
        this.revealPortraitFor(characterName);
        this.updateSpeaker(characterName);

        // 選択肢をクリア
        this.eventChoices.innerHTML = '';

        if (scene.choices) {
            // 選択肢シーン: 本文をタイプ表示し、出揃ったら UIPanel(部品)で選択肢を開く。
            // → キーボード選択＋選択行が常に見える(scrollIntoView)＝スクロールバー破綻で操作不能を解消。
            this.eventChoices.classList.add('active');
            this.controlsEl.style.display = 'none';
            this.currentScenePages = [scene.text || ''];
            this.currentScenePageIndex = 0;
            this.startTypewriter(this.currentScenePages[0]); // 完了時に openChoicePanel が呼ばれる
        } else {
            // 通常シーン: 本文を必要に応じてページ分割し、タイプ表示で順次見せる
            this.eventChoices.classList.remove('active');
            this.controlsEl.style.display = 'flex';
            this.currentScenePages = StoryEventSystem.paginateText(scene.text || '');
            this.currentScenePageIndex = 0;
            this.startTypewriter(this.currentScenePages[0]);
        }

        // キーボード進行（イベント全体で1度だけ登録）
        if (!this.keyHandler) {
            this.keyHandler = (e) => {
                if (!this.currentEvent) return;
                const sc = this.currentEvent.data.scenes[this.currentEvent.sceneIndex];
                if (!sc) return;
                if (sc.choices) {
                    // 選択肢シーン: タイプ中ならZ等で全文表示(→選択肢が開く)。選択肢が開いた後はUIPanelが処理。
                    if (this.typeTimer && !this.typeDone && (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter')) {
                        e.preventDefault();
                        this.finishTypewriter();
                    }
                    return;
                }
                if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdvance();
                }
            };
            document.addEventListener('keydown', this.keyHandler);
        }
    }

    // 次のシーンへ
    nextScene() {
        if (!this.currentEvent) return;

        this.currentEvent.sceneIndex++;
        this.showScene();
    }

    // イベント終了
    endEvent() {
        if (!this.currentEvent) return;
        this.closeChoicePanel(); // 選択肢パネルが残っていれば閉じる（安全）

        const { id, data, context } = this.currentEvent;

        // 完了処理を実行
        if (data.onComplete) {
            data.onComplete(
                context.storyFlags || window.storyFlags,
                context.player || window.player,
                context.partySystem || window.partySystem,
                context.magicSystem || window.magicSystem,
                context.mapSystem || window.mapSystem
            );
        }

        // 一度だけのイベントフラグを設定
        if (data.oneTime) {
            const storyFlags = context.storyFlags || window.storyFlags;
            if (storyFlags) {
                storyFlags[`${id}_completed`] = true;
            }
        }

        // 目標バナー更新（onComplete でフラグが変化しているため）
        if (typeof window.refreshObjective === 'function') {
            try { window.refreshObjective(); } catch (e) { /* noop */ }
        }

        // VNポートレートを片付け
        this.hidePortraits();

        // パネルを隠す
        this.panelEl.classList.remove('active');
        this.panelEl.setAttribute('aria-hidden', 'true');
        this.headerEl.classList.remove('active');
        this.eventChoices.classList.remove('active');
        this.eventChoices.innerHTML = '';
        this.eventText.innerHTML = '';
        this.eventCharacterName.textContent = '';
        this.setNextIndicator(false);

        // タイプライター停止
        if (this.typeTimer) {
            clearInterval(this.typeTimer);
            this.typeTimer = null;
        }
        this.typeDone = false;
        this.currentScenePages = [];
        this.currentScenePageIndex = 0;

        // キーハンドラ解除
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        // ゲーム再開
        if (window.pauseGame !== undefined) {
            window.pauseGame = false;
        }

        this.isEventPlaying = false;
        this.currentEvent = null;

        console.log(`✅ Event completed: ${id}`);
    }

    // ゲーム開始時の自動イベントをチェック
    checkAutoEvents(context) {
        for (const [eventId, event] of this.events.entries()) {
            if (event.trigger === 'auto') {
                // まだ再生されていないイベントのみ
                const storyFlags = context.storyFlags || window.storyFlags || {};
                if (!storyFlags[`${eventId}_completed`]) {
                    setTimeout(() => {
                        this.triggerEvent(eventId, context);
                    }, 1000); // 1秒後に再生
                    break; // 一度に一つだけ
                }
            }
        }
    }

    // 特定マップ入場時の location イベントをチェック（index.html の onEnterMap から呼ぶ）
    checkLocationEvents(mapId, context) {
        for (const [eventId, event] of this.events.entries()) {
            if (event.trigger === 'location' && event.location === mapId) {
                const storyFlags = context.storyFlags || window.storyFlags || {};
                if (storyFlags[`${eventId}_completed`]) continue;
                // requiredFlags は triggerEvent 側で検証される
                setTimeout(() => this.triggerEvent(eventId, context), 600);
                break; // 一度に一つだけ
            }
        }
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.StoryEventSystem = StoryEventSystem;
}
