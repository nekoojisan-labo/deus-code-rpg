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

        // アカリ加入(第2章・Ω戦): 単騎のカイトが押し負ける所へアカリが乱入→ヒールで救い共闘加入
        this.registerEvent('recruit_akari', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'システム', text: '暴走監視ドローン・Ωが、奪った無数の心を地下へ吸い上げている。吸引口の奥から、子どもの声に似たノイズが、途切れ途切れに漏れていた。' },
                { character: 'カイト', text: '（あの音…。地下に吸い込まれていく、奪われた人の心の残響か）' },
                { character: 'システム', text: 'カイトは独り、その巨体の前に立つ。' },
                { character: 'カイト', text: 'くっ…これが、心を奪う機械兵…！押し…負ける…！' },
                { character: 'システム', text: 'Ωが新たな心の糸を手繰り寄せる。カイトの膝が砕け、手の紋様の光が陰っていく。神威が、吸い上げられかける。' },
                { character: 'カイト', text: '（…まただ。俺はまた、誰かの手の届かない所で…）' },
                { character: 'アカリ', text: '（駅の灯の下。地下から響く衝撃に、足が竦む）…ここで待つって、つまり——あなたが倒れる音を、独りで聞くってこと…？' },
                { character: 'アカリ', text: '……ちがう。私が怖いのは、隣で失うことじゃない。手の届かない所で、失うことだったのに。' },
                { character: 'アカリ', text: 'カイト——！！' },
                { character: 'アカリ', text: 'やっぱり、置いていけない。あなたが無茶する時、隣にいるって決めたでしょ！' },
                { character: 'システム', text: 'アカリの回復魔法がカイトを包む。陰りかけた紋様に、光が戻る。——今度は、間に合った。あの日、腕の中で止まりかけた鼓動に、光がちゃんと届く。' },
                { character: 'アカリ', text: 'もう、独りで死なせない。…次は偶然になんて、させないから。あなたの心だけは、絶対に渡さない。' },
                { character: 'カイト', text: 'アカリ…。…ああ。秩序だけじゃ、人は生きられない。…お前が来てくれて、それが分かった気がする。' },
                { character: 'アカリ', text: 'うん。今度は、私も一緒に戦う。…あなたの隣で、ちゃんと届く所で。行こう、カイト。' },
                { character: 'システム', text: 'アカリが仲間に加わった！\n回復魔法で、あなたを支えてくれる。\nもう一度、ドローンに挑もう。' }
            ],
            onComplete: (storyFlags) => {
                if (window.joinMember) window.joinMember('akari');
                storyFlags.metAkari = true;
            }
        });

        // ※旧 recruit_akari_join(駅でheal一幕→加入)・startAkariTrial は廃止。アカリは第2章Ω戦で乱入加入(recruit_akari)に統合。

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
                    text: 'やった！カイト、すごい力ね...'
                },
                {
                    character: 'カイト',
                    text: 'この力...まだ完全にはコントロールできない。'
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
        // 老神主の神託（神宮で老神主に話しかけた時に index.html から発火）
        this.registerEvent('priest_oracle', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: '老神主', text: 'よく来た、神威の力に目覚めし者よ。わしはこの社を守りし最後の神主じゃ。' },
                { character: '老神主', text: 'アーク...あの機械仕掛けの神は、人から「心」を奪い、完全なる管理で世を凍りつかせた。' },
                { character: 'カイト', text: '感情を失った市民たち...あれはアークの仕業だったのか。' },
                { character: '老神主', text: 'アークの中枢は東京都庁にある。だが、お前一人の力では届かぬ。八百万の神々が遣わした同志を集めよ。' },
                { character: '老神主', text: '守りの戦士リクは、既に汝と在るな。…ならば残るは一人。闇市に潜む、魔を操る者「ヤミ」じゃ。' },
                { character: '老神主', text: '彼女を仲間にし、都庁のアークへ挑むのじゃ。八百万の神々が、汝らを見守っておる。' },
                { character: 'アカリ', text: 'ヤミ…闇市の魔法使い。その人を探せばいいのね。' },
                { character: 'システム', text: '目標が更新された：闇市でヤミを仲間にする' }
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
                { character: 'リク', text: 'お前がカイトか。その手の紋様…神威の力、か。噂は本当だったらしいな。' },
                { character: 'リク', text: '俺は元・アーク警備隊。…この地下の避難区画を封鎖したのも、俺だ。' },
                { character: 'カイト', text: '封鎖…？まさか、中に人が——' },
                { character: 'リク', text: '上の命令だった。取り残された避難民ごと、俺はこの手で扉を閉じた。守るべきものを、見捨てたんだ。' },
                { character: 'アカリ', text: 'そんな…どうして…' },
                { character: 'リク', text: 'だからこそ、次は間違えたくない。だが——力ある者なら誰でも背中を預ける、とは思わん。' },
                { character: 'リク', text: 'カイト。お前の覚悟、この身で確かめさせてもらう。構えろ。手加減はしない。' },
                { character: 'システム', text: '——リクが「守護の試練機」を起動した！' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.rikuTrialSeen = true;
                if (window.startRikuTrial) setTimeout(() => window.startRikuTrial(), 400);
            }
        });

        // リク加入②: 試練に勝利（onRikuTrialWin から発火）
        this.registerEvent('recruit_riku_join', {
            trigger: 'manual',
            oneTime: true,
            scenes: [
                { character: 'リク', text: '…いい目だ。力に振り回されず、仲間を守ろうとする目をしている。' },
                { character: 'リク', text: 'カイト。お前になら、背中を預けられる。…俺の贖罪に、付き合ってもらうぞ。' },
                { character: 'アカリ', text: 'リクさん。一緒に、行きましょう。…きっと、まだ取り戻せるものがある。' },
                { character: 'システム', text: 'リクが仲間に加わった！\n鉄壁の守りで、前線を支えてくれる。' }
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
                { character: 'ヤミ', text: '神託に遣わされた…ね。くだらない。八百万の神も、ずいぶん人手不足みたい。' },
                { character: 'ヤミ', text: 'いいわ、一つだけ聞かせて。その力で——あんたは、何をするつもり?' },
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
                { character: 'ヤミ', text: '私の事情は聞かないで。それでいいなら——その賭け、乗ってあげる。' },
                { character: 'ヤミ', text: 'ただし、闇市はあたしが居ないと荒れる。都庁の前で合流するわ。先に行きなさい。' },
                { character: 'システム', text: 'ヤミと契約を交わした。\n都庁へ乗り込む時、彼女が合流する。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.yamiPactMade = true;  // ★本加入は都庁入場時 index.html onEnterMap('tokyo_gov_approach') で発火
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
                { character: 'ヤミ', text: '...悪くない結末ね。八百万の神々も、満足でしょう。' },
                { character: 'システム', text: '【八百万の神託 — 完】\nアークは倒れ、東京に心が戻った。ご褒美に、裏ダンジョン「深層トンネル」が解放された。' }
            ],
            onComplete: (storyFlags) => {
                storyFlags.arcDefeated = true;
                storyFlags.chapter3_complete = true;
                storyFlags.gameCleared = true;
                console.log('✅ Arc Prime defeated - Game cleared!');
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
