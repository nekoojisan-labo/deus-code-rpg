// ==========================================
// 魔法システム (Magic System)
// ==========================================

class MagicSystem {
    constructor() {
        // 魔法データベース
        this.magicDatabase = {
            // 攻撃魔法
            fire_bolt: {
                id: 'fire_bolt',
                name: 'ファイアボルト',
                emoji: '🔥',
                type: 'offensive',
                mpCost: 8,
                power: 20,
                description: '火炎の矢を放つ',
                price: 500,
                requiredLevel: 2,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            ice_lance: {
                id: 'ice_lance',
                name: 'アイスランス',
                emoji: '❄️',
                type: 'offensive',
                mpCost: 10,
                power: 25,
                description: '氷の槍で敵を貫く',
                price: 700,
                requiredLevel: 4,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            thunder_strike: {
                id: 'thunder_strike',
                name: 'サンダーストライク',
                emoji: '⚡',
                type: 'offensive',
                mpCost: 12,
                power: 30,
                description: '雷を落として攻撃',
                price: 900,
                requiredLevel: 6,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            explosion: {
                id: 'explosion',
                name: 'エクスプロージョン',
                emoji: '💥',
                type: 'offensive',
                mpCost: 20,
                power: 50,
                description: '大爆発を起こす',
                price: 1500,
                requiredLevel: 10,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            // 闇魔法（メイジ＝ヤミの代名詞スキル。加入時から使える攻撃手段）
            dark_pulse: {
                id: 'dark_pulse',
                name: 'ダークパルス',
                emoji: '🌑',
                type: 'offensive',
                mpCost: 7,
                power: 22,
                description: '闇の波動で敵を撃つ',
                price: 450,
                requiredLevel: 1,
                allowedRoles: ['mage', 'all-rounder']
            },
            curse: {
                id: 'curse',
                name: 'カース',
                emoji: '💀',
                type: 'offensive',
                mpCost: 12,
                power: 30,
                description: '呪詛の刃で大きく削る',
                price: 700,
                requiredLevel: 1,
                allowedRoles: ['mage']
            },

            // 回復魔法
            heal: {
                id: 'heal',
                name: 'ヒール',
                emoji: '💚',
                type: 'healing',
                mpCost: 7,
                power: 30,
                description: 'HPを回復する',
                price: 400,
                requiredLevel: 1,
                allowedRoles: ['all-rounder', 'healer']
            },
            mega_heal: {
                id: 'mega_heal',
                name: 'メガヒール',
                emoji: '💚',
                type: 'healing',
                mpCost: 15,
                power: 80,
                description: 'HPを大幅に回復',
                price: 800,
                requiredLevel: 5,
                allowedRoles: ['all-rounder', 'healer']
            },
            // 蘇生魔法（戦闘不能の味方専用。通常回復では復帰できない）
            revive: {
                id: 'revive',
                name: 'リザレクト',
                emoji: '✨',
                type: 'revive',
                mpCost: 20,
                power: 0,
                reviveRatio: 0.5,
                description: '戦闘不能の味方を ふっかつさせる（HP50%）',
                price: 1500,
                requiredLevel: 8,
                allowedRoles: ['healer']
            },

            // 補助魔法
            protect: {
                id: 'protect',
                name: 'プロテクト',
                emoji: '🛡️',
                type: 'support',
                mpCost: 10,
                duration: 3,
                effect: 'defense_up',
                power: 1.5,
                description: '防御力を上げる（3ターン）',
                price: 600,
                requiredLevel: 3,
                allowedRoles: ['all-rounder', 'healer', 'mage']
            },
            haste: {
                id: 'haste',
                name: 'ヘイスト',
                emoji: '💨',
                type: 'support',
                mpCost: 12,
                duration: 3,
                effect: 'speed_up',
                description: '素早さを上げる（3ターン）',
                price: 700,
                requiredLevel: 4,
                allowedRoles: ['all-rounder', 'healer', 'mage']
            },

            // 神威魔法
            kamui_storm: {
                id: 'kamui_storm',
                name: '神威・嵐',
                emoji: '🌪️',
                type: 'kamui',
                mpCost: 25,
                power: 60,
                description: '神の嵐を呼び起こす',
                price: 2000,
                requiredLevel: 8,
                allowedRoles: ['all-rounder']
            },
            kamui_blessing: {
                id: 'kamui_blessing',
                name: '神威・祝福',
                emoji: '✨',
                type: 'kamui',
                target: 'self',
                buffMul: 1.3,
                mpCost: 20,
                duration: 5,
                effect: 'all_up',
                power: 1.3,
                description: '全能力を上昇させる（5ターン）',
                price: 2500,
                requiredLevel: 12,
                allowedRoles: ['all-rounder']
            }
        };

        // ★v2 スキル(再較正済み・属性/単体全体/二系統)。既存IDは上書き・新規は追加。
        Object.assign(this.magicDatabase, {
            heal: { id: 'heal', name: 'ヒール', emoji: '💚', type: 'healing', target: 'single', element: 'light', basePower: 0.7, scalingStat: 'magic', mpCost: 6, requiredLevel: 1, price: 400, minHeal: 30, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりのHPを回復する基本の癒し術。' },
            light_arrow: { id: 'light_arrow', name: 'ライトアロー', emoji: '🏹', type: 'offensive', target: 'single', element: 'light', basePower: 0.8, scalingStat: 'magic', mpCost: 7, requiredLevel: 1, allowedRoles: ['all-rounder', 'healer'], description: '光の矢を放つ。アカリ加入時からの攻撃手段。闇属性の敵に刺さる。' },
            cure_status: { id: 'cure_status', name: 'キュアラ', emoji: '🌿', type: 'support', target: 'single', element: 'light', basePower: 0, scalingStat: 'magic', mpCost: 8, requiredLevel: 3, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりの状態異常をすべて取り除く。毒・麻痺・睡眠を浄化。', effect: 'cure_status', duration: 3 },
            protect_shell: { id: 'protect_shell', name: 'プロテス', emoji: '🛡️', type: 'support', target: 'single', element: 'light', basePower: 1.5, scalingStat: 'magic', mpCost: 9, requiredLevel: 5, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりの物理防御を1.5倍に高める(3ターン)。前衛の被弾を軽減。', effect: 'phys_def_up', duration: 3, buffMul: 1.5 },
            regen_field: { id: 'regen_field', name: 'リジェネ', emoji: '🍃', type: 'healing', target: 'single', element: 'light', basePower: 0.45, scalingStat: 'magic', mpCost: 8, requiredLevel: 7, minHeal: 30, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりに再生の力を宿し、数ターンかけてHPを回復し続ける。' },
            revive: { id: 'revive', name: 'リザレクト', emoji: '✨', type: 'revive', target: 'ally', element: 'light', basePower: 0, scalingStat: 'magic', mpCost: 18, requiredLevel: 9, price: 1500, allowedRoles: ['healer'], description: '戦闘不能の味方をHP50%で復活させる。通常の回復術では復帰できない。', reviveRatio: 0.5 },
            holy_ray: { id: 'holy_ray', name: 'ホーリーレイ', emoji: '🌟', type: 'offensive', target: 'single', element: 'light', basePower: 1.3, scalingStat: 'magic', mpCost: 12, requiredLevel: 11, allowedRoles: ['healer'], description: '聖なる光線で敵を撃つ。闇や不浄な敵に大きなダメージ。' },
            shell_barrier: { id: 'shell_barrier', name: 'シェル', emoji: '🔮', type: 'support', target: 'single', element: 'light', basePower: 1.5, scalingStat: 'magic', mpCost: 11, requiredLevel: 13, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりの魔法防御を1.5倍に高める(3ターン)。敵の大魔法に備える。', effect: 'mag_def_up', duration: 3, buffMul: 1.5 },
            group_heal: { id: 'group_heal', name: 'エリアヒール', emoji: '💞', type: 'healing', target: 'allyAll', element: 'light', basePower: 1, scalingStat: 'magic', mpCost: 16, requiredLevel: 15, minHeal: 40, allowedRoles: ['all-rounder', 'healer'], description: 'パーティ全員のHPをまとめて回復する。全体攻撃への立て直しに。' },
            purify_wave: { id: 'purify_wave', name: 'エスナ・ウェーブ', emoji: '🌀', type: 'support', target: 'allyAll', element: 'light', basePower: 0, scalingStat: 'magic', mpCost: 14, requiredLevel: 18, allowedRoles: ['healer'], description: '浄化の波動でパーティ全員の状態異常を一掃する。', effect: 'cure_status', duration: 3 },
            holy_nova: { id: 'holy_nova', name: 'ホーリーノヴァ', emoji: '💫', type: 'offensive', target: 'all', element: 'light', basePower: 0.6, scalingStat: 'magic', mpCost: 20, requiredLevel: 22, allowedRoles: ['healer'], description: '聖光を爆ぜさせ敵全体を焼く。闇属性の群れに有効。' },
            haste_boon: { id: 'haste_boon', name: 'ヘイスト', emoji: '💨', type: 'support', target: 'single', element: 'light', basePower: 0, scalingStat: 'magic', mpCost: 12, requiredLevel: 25, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりの素早さを高め、行動を早める(3ターン)。', effect: 'speed_up', duration: 3 },
            mega_heal: { id: 'mega_heal', name: 'メガヒール', emoji: '💚', type: 'healing', target: 'single', element: 'light', basePower: 1.4, scalingStat: 'magic', mpCost: 14, requiredLevel: 28, price: 800, minHeal: 80, allowedRoles: ['all-rounder', 'healer'], description: '味方ひとりのHPを大きく回復する。前衛の被弾を素早く立て直す。' },
            sanctuary: { id: 'sanctuary', name: 'サンクチュアリ', emoji: '🕊️', type: 'support', target: 'allyAll', element: 'light', basePower: 1.4, scalingStat: 'magic', mpCost: 22, requiredLevel: 34, allowedRoles: ['healer'], description: '聖域を展開し、パーティ全員の物理・魔法防御を1.4倍に(3ターン)。', effect: 'both_def_up', duration: 3, buffMul: 1.4 },
            holy_lance: { id: 'holy_lance', name: 'ホーリーランス', emoji: '⚜️', type: 'offensive', target: 'single', element: 'light', basePower: 1.8, scalingStat: 'magic', mpCost: 18, requiredLevel: 38, allowedRoles: ['healer'], description: '極大の光槍で敵ひとりを貫く。アカリの単体最大火力。' },
            omega_heal: { id: 'omega_heal', name: 'オメガヒール', emoji: '🌈', type: 'healing', target: 'single', element: 'light', basePower: 3.4, scalingStat: 'magic', mpCost: 26, requiredLevel: 44, minHeal: 200, allowedRoles: ['healer'], description: '虹の癒光で味方ひとりをほぼ全快させる。アカリの究極回復術。' },
            dark_pulse: { id: 'dark_pulse', name: 'ダークパルス', emoji: '🌑', type: 'offensive', target: 'single', element: 'dark', basePower: 0.85, scalingStat: 'magic', mpCost: 6, requiredLevel: 1, allowedRoles: ['mage'], description: '闇の波動で敵を撃つ低燃費の連射術。ヤミの代名詞で加入時から使える。' },
            curse: { id: 'curse', name: 'カース', emoji: '💀', type: 'offensive', target: 'single', element: 'dark', basePower: 1.15, scalingStat: 'magic', mpCost: 11, requiredLevel: 1, allowedRoles: ['mage'], description: '呪詛の刃で深く抉る闇の単体術。耐性持ちにも無属性として安定して通る。' },
            fire_bolt: { id: 'fire_bolt', name: 'ファイアボルト', emoji: '🔥', type: 'offensive', target: 'single', element: 'fire', basePower: 1, scalingStat: 'magic', mpCost: 8, requiredLevel: 2, price: 500, allowedRoles: ['mage', 'all-rounder'], description: '火炎の矢を放つ基本攻撃術。氷耐性の敵を炙る火属性の入り口。' },
            ice_lance: { id: 'ice_lance', name: 'アイスランス', emoji: '❄️', type: 'offensive', target: 'single', element: 'ice', basePower: 1, scalingStat: 'magic', mpCost: 9, requiredLevel: 3, price: 700, allowedRoles: ['mage', 'all-rounder'], description: '氷の槍で敵を貫く基本術。火属性の敵に刺さる氷の単体攻撃。' },
            thunder_strike: { id: 'thunder_strike', name: 'サンダーストライク', emoji: '⚡', type: 'offensive', target: 'single', element: 'thunder', basePower: 1, scalingStat: 'magic', mpCost: 10, requiredLevel: 5, price: 900, allowedRoles: ['mage', 'all-rounder'], description: '雷を落とす基本術。機械系・水濡れの敵に強い雷属性の単体攻撃。' },
            frost_pierce: { id: 'frost_pierce', name: 'フロストピアス', emoji: '🧊', type: 'offensive', target: 'single', element: 'ice', basePower: 1.2, scalingStat: 'magic', mpCost: 13, requiredLevel: 18, allowedRoles: ['mage', 'all-rounder'], description: '氷塊を高速で貫通させる中位の氷単体術。氷弱点の重装を割る主力。' },
            voltspear: { id: 'voltspear', name: 'ヴォルトスピア', emoji: '🌩️', type: 'offensive', target: 'single', element: 'thunder', basePower: 1.2, scalingStat: 'magic', mpCost: 13, requiredLevel: 20, allowedRoles: ['mage', 'all-rounder'], description: '雷光の槍を撃ち込む中位の雷単体術。雷弱点の機械系を一気に削る。' },
            thunderstorm: { id: 'thunderstorm', name: 'サンダーストーム', emoji: '🌀', type: 'offensive', target: 'all', element: 'thunder', basePower: 0.9, scalingStat: 'magic', mpCost: 22, requiredLevel: 24, allowedRoles: ['mage', 'all-rounder'], description: '雷の嵐で敵全体を打つ範囲術。雑魚の群れを一掃する燃費型AoE。' },
            explosion: { id: 'explosion', name: 'エクスプロージョン', emoji: '💥', type: 'offensive', target: 'all', element: 'fire', basePower: 1, scalingStat: 'magic', mpCost: 26, requiredLevel: 28, price: 1500, allowedRoles: ['mage', 'all-rounder'], description: '大爆発で全体を焼く高威力AoE。火弱点が混じる群れに最大効率。' },
            dark_nova: { id: 'dark_nova', name: 'ダークノヴァ', emoji: '🕳️', type: 'offensive', target: 'all', element: 'dark', basePower: 1.05, scalingStat: 'magic', mpCost: 30, requiredLevel: 34, allowedRoles: ['mage'], description: '虚無の超新星で全体を飲み込む闇の最終AoE。dark弱点の集団を消し飛ばす。' },
            inferno_lance: { id: 'inferno_lance', name: 'インフェルノランス', emoji: '☄️', type: 'offensive', target: 'single', element: 'fire', basePower: 1.7, scalingStat: 'magic', mpCost: 20, requiredLevel: 30, allowedRoles: ['mage', 'all-rounder'], description: '灼熱の槍を撃ち込む火属性の極大単体術。火弱点の重装ボスを2発圏に追い込む。' },
            abyssal_ruin: { id: 'abyssal_ruin', name: 'アビサルルイン', emoji: '🌌', type: 'offensive', target: 'single', element: 'dark', basePower: 1.7, scalingStat: 'magic', mpCost: 21, requiredLevel: 35, allowedRoles: ['mage'], description: '深淵の崩壊で標的を内側から砕く闇の極大単体術。ヤミだけが扱える最終奥義。' },
            shield_bash: { id: 'shield_bash', name: 'シールドバッシュ', emoji: '🛡️', type: 'offensive', target: 'single', element: 'none', basePower: 1.6, scalingStat: 'attack', mpCost: 4, requiredLevel: 1, allowedRoles: ['tank', 'all-rounder'], description: '盾で敵を強打する。物理単体・低コストでターン頭から撃てるリクの基本技。物理防御の半分を貫通。' },
            taunt: { id: 'taunt', name: '挑発', emoji: '😤', type: 'support', target: 'self', element: 'none', basePower: 0, scalingStat: 'attack', mpCost: 3, requiredLevel: 1, allowedRoles: ['tank', 'all-rounder'], description: '敵の敵意を自分に集める。3ターンの間、敵の攻撃対象を自分へ引き付け、被ダメージをわずかに軽減する。後衛(アカリ/ヤミ)を守る盾役の生命線。', effect: 'taunt', duration: 3 },
            heavy_smash: { id: 'heavy_smash', name: 'ヘビースマッシュ', emoji: '🔨', type: 'offensive', target: 'single', element: 'none', basePower: 3.2, scalingStat: 'attack', mpCost: 14, requiredLevel: 12, allowedRoles: ['tank', 'all-rounder'], description: '全体重を乗せた渾身の一撃。物理単体最大火力。属性弱点に依存せず、耐性持ち・無属性の敵にも安定して大ダメージを通せる。' },
            whirl_strike: { id: 'whirl_strike', name: 'ワールストライク', emoji: '🌀', type: 'offensive', target: 'all', element: 'none', basePower: 1.9, scalingStat: 'attack', mpCost: 16, requiredLevel: 18, allowedRoles: ['tank', 'all-rounder'], description: '武器を旋回させ全方位を薙ぎ払う。全体物理。1発の威力は単体技より控えめで、2体目以降は威力が逓減するため、単体集中より総ダメージは伸びない雑魚処理向け。' },
            guard_break: { id: 'guard_break', name: 'ガードブレイク', emoji: '💢', type: 'offensive', target: 'single', element: 'none', basePower: 2.2, scalingStat: 'attack', mpCost: 12, requiredLevel: 15, allowedRoles: ['tank', 'all-rounder'], description: '敵の防具を打ち砕く。中威力の物理単体に加え、対象の防御力を3ターン低下させる。重装ボスを味方全員で削る前の地ならしに最適。' },
            iron_wall: { id: 'iron_wall', name: 'アイアンウォール', emoji: '🧱', type: 'support', target: 'self', element: 'none', basePower: 1.7, scalingStat: 'attack', mpCost: 10, requiredLevel: 8, allowedRoles: ['tank'], description: '全身を鋼の構えで固める。3ターンの間、自身の防御を大幅に引き上げる。挑発と重ねれば敵の大技を受け止める鉄壁となる、リク専用の自己防御技。', effect: 'phys_def_up', duration: 3, buffMul: 1.6 },
            war_cry: { id: 'war_cry', name: 'ウォークライ', emoji: '📣', type: 'support', target: 'allyAll', element: 'none', basePower: 1.4, scalingStat: 'attack', mpCost: 14, requiredLevel: 20, allowedRoles: ['tank', 'all-rounder'], description: '鬨の声で味方を鼓舞する。3ターンの間、パーティ全員の攻撃力を引き上げる。物理アタッカーを並べた編成でボスを一気に押し切るための号令。', effect: 'atk_up', duration: 3, buffMul: 1.4 },
            blade_dance: { id: 'blade_dance', name: 'ブレイドダンス', emoji: '⚔️', type: 'offensive', target: 'single', element: 'none', basePower: 2.8, scalingStat: 'attack', mpCost: 13, requiredLevel: 14, allowedRoles: ['all-rounder'], description: '連舞の斬撃を叩き込む。カイトの物理単体主力技。魔法も剣も扱う両刀ゆえ単発火力はタンク専用技に一歩譲るが、撃ち分けの自由度で勝る。' },
            cross_slash: { id: 'cross_slash', name: 'クロススラッシュ', emoji: '✖️', type: 'offensive', target: 'all', element: 'none', basePower: 1.7, scalingStat: 'attack', mpCost: 15, requiredLevel: 16, allowedRoles: ['all-rounder'], description: '十字に斬り払う全体物理。1発の威力は単体技より低く逓減もあるため、雑魚集団の掃討用。単体は剣技に、複数はこれにと撃ち分けるのが両刀の旨味。' },
            rending_edge: { id: 'rending_edge', name: 'レンディングエッジ', emoji: '🌗', type: 'offensive', target: 'single', element: 'none', basePower: 3.4, scalingStat: 'attack', mpCost: 18, requiredLevel: 24, allowedRoles: ['all-rounder'], description: '魔と剣を継いだ斬撃。カイト物理単体の最大火力で、直前に魔法を使ってから放つと威力が1.2倍に跳ね上がる。魔法→物理と系統を切り替える両刀ならではの撃ち分けボーナス技。' },
            piercing_arrow: { id: 'piercing_arrow', name: 'ピアスアロー', emoji: '🏹', type: 'offensive', target: 'single', element: 'none', basePower: 1.6, scalingStat: 'attack', mpCost: 6, requiredLevel: 6, allowedRoles: ['all-rounder', 'healer'], description: '鋭い矢で急所を貫く軽量物理。低コストで、回復役のアカリでも回復の手が空いたターンに撃てる。物理防御の半分を貫通し、無属性なので耐性に左右されない。' }
        });

        // キャラクターごとの習得魔法（characterId -> {magicId: magicData}）
        this.learnedMagicByCharacter = {};
    }
    
    // キャラクターIDを取得
    getCharacterId(character = window.player) {
        if (!character) return 'player';
        return character.characterId || character.name || 'player';
    }

    // 魔法を習得
    learnMagic(magicId, character) {
        console.log('[DEBUG] learnMagic called with:', { magicId, character });

        if (!character) {
            console.error('[ERROR] learnMagic called without character parameter!');
            console.trace();
            return false;
        }

        const magic = this.magicDatabase[magicId];
        if (!magic) {
            console.error('Unknown magic:', magicId);
            return false;
        }

        // 役割チェック
        const characterRole = character.role || 'all-rounder';
        if (!magic.allowedRoles.includes(characterRole)) {
            console.error(`${character.name}の役割（${characterRole}）では${magic.name}を習得できません`);
            return false;
        }

        const charId = this.getCharacterId(character);
        if (!this.learnedMagicByCharacter[charId]) {
            this.learnedMagicByCharacter[charId] = {};
        }

        console.log(`${character.name} learning magic: ${magicId}`);
        this.learnedMagicByCharacter[charId][magicId] = { ...magic };
        console.log('Learned magic:', this.learnedMagicByCharacter[charId]);
        return true;
    }

    // ===== v2 計算ヘルパー =====
    // バフ倍率を取得（character.buffs[stat] = {mul,turns}）。stat: physDef/magDef/atk/mag
    static buffMul(character, stat) {
        const b = character && character.buffs && character.buffs[stat];
        return (b && b.turns > 0 && b.mul) ? b.mul : 1;
    }

    // スキルの basePower（明示優先・旧powerは /30 でフォールブリッジ）
    static skillBasePower(magic) {
        if (magic.basePower != null) return magic.basePower;
        return magic.power ? magic.power / 30 : 1.0;
    }

    // ★スキルダメージ式（攻撃魔法/物理スキル共通）。返り値 {damage, weak, resisted}
    //   物理(scalingStat=attack): floor(攻撃×atkバフ×bp) - floor(物理防御×防御バフ/2)
    //   魔法(scalingStat=magic):  floor(魔力×bp × 属性 × (1-耐性)) - floor(魔法防御×防御バフ/3)
    computeSkillDamage(caster, target, magic) {
        const isPhys = (magic.scalingStat === 'attack');
        const bp = MagicSystem.skillBasePower(magic);
        const atkStat = isPhys ? (caster.attack || 0) * MagicSystem.buffMul(caster, 'atk')
                               : (caster.magic || 0) * MagicSystem.buffMul(caster, 'mag');
        let base = Math.floor(atkStat * bp);
        const element = magic.element || 'none';
        // 属性: 弱点一致1.5・耐性で減衰（物理none/弱点noneは倍率1.0）。弱点は複数(配列 or "ice,fire")対応。
        let weak = false;
        const wk = target.weakness;
        if (element !== 'none' && wk) {
            const wkList = Array.isArray(wk) ? wk : String(wk).split(',').map(x => x.trim());
            if (wkList.indexOf(element) !== -1) weak = true;
        }
        const elemMul = weak ? 1.5 : 1.0;
        const resistMap = target.elementalResistance || null;
        const resist = (resistMap && element !== 'none' && resistMap[element]) ? Math.max(0, Math.min(0.9, resistMap[element])) : 0;
        const variance = Math.floor(base * Math.random() * 0.12);
        // 防御: 物理は physDef/2、魔法は magDef/3（バフで防御側が硬くなる）
        let defRed;
        if (isPhys) {
            const pd = (target.defense || 0) * MagicSystem.buffMul(target, 'physDef');
            defRed = Math.floor(pd / 2);
        } else {
            const mdRaw = (target.magicDefense != null) ? target.magicDefense : Math.floor((target.defense || 0) * 0.5);
            const md = mdRaw * MagicSystem.buffMul(target, 'magDef');
            defRed = Math.floor(md / 3);
        }
        const damage = Math.max(1, Math.floor(base * elemMul * (1 - resist)) + variance - defRed);
        return { damage, weak, resisted: resist > 0 };
    }

    // ★回復量 = max(minHeal, floor(魔力 × basePower))
    //   minHeal: スキルごとに設定した下限値（低レベルでも意味ある回復量を保証）
    computeHealAmount(caster, magic) {
        const bp = MagicSystem.skillBasePower(magic);
        const min = magic.minHeal || 1;
        return Math.max(min, Math.floor((caster.magic || 0) * bp));
    }

    // ★補助スキルの効果適用（バフ/状態治療）。magic.effect で分岐。
    //   バフは character.buffs[stat] = {mul, turns} に積む。読み手は computeSkillDamage / battle-system。
    applySupportEffect(target, magic) {
        if (!target.buffs) target.buffs = {};
        const dur = magic.duration || 3;
        const setBuff = (stat, mul) => { target.buffs[stat] = { mul, turns: dur }; };
        switch (magic.effect) {
            case 'phys_def_up': setBuff('physDef', magic.buffMul || 1.5); return `${magic.name}！\n${target.name}の ぶつりぼうぎょが あがった！`;
            case 'mag_def_up': setBuff('magDef', magic.buffMul || 1.5); return `${magic.name}！\n${target.name}の まほうぼうぎょが あがった！`;
            case 'both_def_up': setBuff('physDef', magic.buffMul || 1.4); setBuff('magDef', magic.buffMul || 1.4); return `${magic.name}！\n${target.name}の ぼうぎょが あがった！`;
            case 'atk_up': setBuff('atk', magic.buffMul || 1.3); return `${magic.name}！\n${target.name}の こうげきが あがった！`;
            case 'speed_up': target.buffs.haste = { mul: 1, turns: dur }; target.magicSpeedBoost = true; return `${magic.name}！\n${target.name}は すばやさが あがった！`;
            case 'cure_status': target.statusAilments = {}; return `${magic.name}！\n${target.name}の じょうたいいじょうが かいふくした！`;
            case 'taunt': target.taunting = dur; return `${magic.name}！\n${target.name}は てきの こうげきを ひきつけた！`;
            // 旧スキル互換のエイリアス
            case 'defense_up': setBuff('physDef', magic.buffMul || 1.4); return `${magic.name}！\n${target.name}の ぼうぎょが あがった！`;
            case 'all_up': setBuff('atk', magic.buffMul || 1.3); setBuff('physDef', magic.buffMul || 1.3); setBuff('magDef', magic.buffMul || 1.3); return `${magic.name}！\n${target.name}の ぜんのうりょくが あがった！`;
            default: setBuff('physDef', 1.3); return `${magic.name}！\n${target.name}は みをかためた！`;
        }
    }

    // 習得済みスキル定義を取得（MPチェック/対象種別の事前判定用）
    getLearnedSkill(character, magicId) {
        const charId = this.getCharacterId(character);
        return (this.learnedMagicByCharacter[charId] || {})[magicId] || null;
    }

    // 魔法を使用（skipMpCost=true: 全体攻撃の2体目以降。MPは呼び出し側で1回だけ消費済み）
    useMagic(magicId, character, target, inBattle = false, skipMpCost = false) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        const magic = learnedMagic[magicId];

        console.log('[DEBUG] useMagic:', {
            magicId,
            charId,
            characterName: character.name,
            learnedMagicKeys: Object.keys(learnedMagic),
            allCharacterIds: Object.keys(this.learnedMagicByCharacter),
            magicFound: !!magic
        });

        if (!magic) {
            return { success: false, message: 'この魔法は習得していない！' };
        }

        // MPチェック＋消費（全体攻撃の2体目以降は skipMpCost で1回だけにする）
        if (!skipMpCost) {
            if (character.mp < magic.mpCost) {
                return { success: false, message: 'MPが足りない！' };
            }
            character.mp -= magic.mpCost;
        }

        let message = '';
        let damage = 0;

        // 魔法タイプ別処理
        switch (magic.type) {
            case 'offensive':
                // 攻撃魔法（★v2: 二系統式 scalingStat×basePower×属性×防御）
                if (!target || !inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const r = this.computeSkillDamage(character, target, magic);
                    damage = r.damage;
                    target.currentHp = Math.max(0, target.currentHp - damage);
                    const tag = r.weak ? '　こうかは ばつぐんだ！' : (r.resisted ? '　こうかは いまひとつ…' : '');
                    message = `${magic.name}！\n${target.name}に ${damage} のダメージ！${tag}`;
                }
                break;

            case 'healing':
                // 回復魔法（★v2: 回復量 = floor(魔力 × basePower)）
                const healTarget = (target && target !== character && typeof target.maxHp === 'number') ? target : character;
                // ★戦闘不能には通常の回復魔法は効かない（蘇生スキルが必要）
                if (healTarget.hp <= 0) {
                    return { success: false, message: 'せんとうふのうには かいふくまほうは きかない！（そせいスキルが ひつよう）' };
                }
                {
                    const heal = this.computeHealAmount(character, magic);
                    const applied = Math.min(heal, healTarget.maxHp - healTarget.hp);
                    healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + heal);
                    message = `${magic.name}！\n${healTarget.name || character.name}の HPが ${applied} 回復した！`;
                }
                break;

            case 'revive':
                // 蘇生魔法（戦闘不能の味方のみ復活。生存中は無効）
                const reviveTarget = (target && target !== character && typeof target.maxHp === 'number') ? target : character;
                if (reviveTarget.hp > 0) {
                    return { success: false, message: 'その なかまは せんとうふのうではない！' };
                }
                const reviveRatio = magic.reviveRatio || 0.5;
                reviveTarget.hp = Math.max(1, Math.floor(reviveTarget.maxHp * reviveRatio));
                message = `${magic.name}！\n${reviveTarget.name || character.name}が せんとうふのうから ふっかつした！`;
                break;

            case 'support':
                // 補助魔法（★v2: バフ/状態治療。対象は target（味方）or 自分）
                if (!inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const buffTarget = (target && typeof target.maxHp === 'number') ? target : character;
                    message = this.applySupportEffect(buffTarget, magic);
                }
                break;

            case 'kamui':
                // 神威魔法（★v2: scalingStat×basePower。属性/防御は computeSkillDamage で）
                if (!inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                // ★effect持ち(kamui_blessing等のバフ系神威)はダメージではなくバフを適用
                if (magic.effect) {
                    const buffTarget = (target && typeof target.maxHp === 'number') ? target : character;
                    message = this.applySupportEffect(buffTarget, magic);
                    break;
                }
                if (!target) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const r = this.computeSkillDamage(character, target, magic);
                    damage = r.damage;
                    target.currentHp = Math.max(0, target.currentHp - damage);
                    const tag = r.weak ? '　こうかは ばつぐんだ！' : (r.resisted ? '　こうかは いまひとつ…' : '');
                    message = `${magic.name}！\n神の力が襲いかかる！\n${target.name}に ${damage} のダメージ！${tag}`;
                }
                break;
        }

        // UIを更新
        if (window.updateUI) {
            window.updateUI();
        }

        return {
            success: true,
            message: message,
            damage: damage,
            magic: magic
        };
    }
    
    // 習得済み魔法リストを取得
    getLearnedMagic(character) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return Object.values(learnedMagic).sort((a, b) => {
            const typeOrder = ['offensive', 'healing', 'support', 'kamui'];
            return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        });
    }

    // 習得済み神威魔法リストを取得
    getLearnedKamuiMagic(character) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return Object.values(learnedMagic).filter(magic => magic.type === 'kamui');
    }

    // 魔法を習得しているかチェック
    hasLearned(magicId, character = window.player) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return !!learnedMagic[magicId];
    }
    
    // 魔法の購入
    buyMagic(magicId, character) {
        const magic = this.magicDatabase[magicId];
        if (!magic) {
            return { success: false, message: 'その魔法は存在しない' };
        }

        // 役割チェック
        const characterRole = character.role || 'all-rounder';
        if (!magic.allowedRoles.includes(characterRole)) {
            return {
                success: false,
                message: `${character.name}の役割では習得できない魔法です`
            };
        }

        // 既に習得済みかチェック
        if (this.hasLearned(magicId, character)) {
            return { success: false, message: 'すでに習得している魔法です' };
        }

        // レベル要件チェック
        if (magic.requiredLevel > character.level) {
            return {
                success: false,
                message: `レベル${magic.requiredLevel}以上で習得可能`
            };
        }

        // 所持金チェック
        if (character.gold < magic.price) {
            return { success: false, message: 'ゴールドが足りない！' };
        }

        character.gold -= magic.price;
        this.learnMagic(magicId, character);

        return {
            success: true,
            message: `${magic.name}を習得した！\n${magic.price}ゴールドを支払った。`
        };
    }

    // === セーブ用: charId→[magicId] ===
    toJSON() {
        const out = {};
        for (const charId in this.learnedMagicByCharacter) {
            out[charId] = Object.keys(this.learnedMagicByCharacter[charId]);
        }
        return out;
    }
    // === ロード用: DBから再構築（既習得は正当なのでrole制約を回避して直接格納） ===
    fromJSON(data) {
        this.learnedMagicByCharacter = {};
        if (!data) return;
        for (const charId in data) {
            this.learnedMagicByCharacter[charId] = {};
            for (const magicId of data[charId]) {
                const magic = this.magicDatabase[magicId];
                if (magic) this.learnedMagicByCharacter[charId][magicId] = { ...magic };
            }
        }
    }
}

// グローバルにエクスポート
window.MagicSystem = MagicSystem;
