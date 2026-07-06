// ==========================================
// 装備システム (Equipment System)
// ==========================================

class EquipmentSystem {
    constructor() {
        // 装備データベース
        this.equipmentDatabase = {
            // 武器
            wooden_sword: {
                id: 'wooden_sword',
                name: '木刀',
                emoji: '🗡️',
                type: 'weapon',
                slot: 'weapon',
                attack: 5,
                defense: 0,
                description: '初心者用の木製の刀',
                price: 100,
                sellPrice: 50,
                requiredLevel: 1
            },
            iron_sword: {
                id: 'iron_sword',
                name: '鉄の剣',
                emoji: '⚔️',
                type: 'weapon',
                slot: 'weapon',
                attack: 12,
                defense: 0,
                description: '鍛冶屋が作った頑丈な剣',
                price: 300,
                sellPrice: 150,
                requiredLevel: 3
            },
            plasma_blade: {
                id: 'plasma_blade',
                name: 'プラズマブレード',
                emoji: '⚡',
                type: 'weapon',
                slot: 'weapon',
                attack: 20,
                defense: 0,
                mp: 5,
                description: 'エネルギーで斬る未来の剣',
                price: 800,
                sellPrice: 400,
                requiredLevel: 5
            },
            kamui_katana: {
                id: 'kamui_katana',
                name: '神威の刀',
                emoji: '🔱',
                type: 'weapon',
                slot: 'weapon',
                attack: 35,
                defense: 0,
                mp: 10,
                description: '神の力が宿る伝説の刀',
                price: 0,
                sellPrice: 1000,
                requiredLevel: 10
            },
            cyber_gun: {
                id: 'cyber_gun',
                name: 'サイバーガン',
                emoji: '🔫',
                type: 'weapon',
                slot: 'weapon',
                attack: 18,
                defense: 0,
                description: '高威力のエネルギー銃',
                price: 600,
                sellPrice: 300,
                requiredLevel: 4
            },
            
            // 防具 - 頭
            cloth_hat: {
                id: 'cloth_hat',
                name: '布の帽子',
                emoji: '🧢',
                type: 'armor',
                slot: 'head',
                attack: 0,
                defense: 2,
                description: '簡素な布製の帽子',
                price: 80,
                sellPrice: 40,
                requiredLevel: 1
            },
            iron_helmet: {
                id: 'iron_helmet',
                name: '鉄の兜',
                emoji: '⛑️',
                type: 'armor',
                slot: 'head',
                attack: 0,
                defense: 5,
                description: '頭を守る鉄製の兜',
                price: 250,
                sellPrice: 125,
                requiredLevel: 3
            },
            cyber_helmet: {
                id: 'cyber_helmet',
                name: 'サイバーヘルメット',
                emoji: '🪖',
                type: 'armor',
                slot: 'head',
                attack: 0,
                defense: 10,
                hp: 10,
                description: 'ハイテク装甲のヘルメット',
                price: 600,
                sellPrice: 300,
                requiredLevel: 6
            },
            
            // 防具 - 体
            cloth_armor: {
                id: 'cloth_armor',
                name: '布の服',
                emoji: '👕',
                type: 'armor',
                slot: 'body',
                attack: 0,
                defense: 3,
                description: '普通の布製の服',
                price: 120,
                sellPrice: 60,
                requiredLevel: 1
            },
            leather_armor: {
                id: 'leather_armor',
                name: '革の鎧',
                emoji: '🦺',
                type: 'armor',
                slot: 'body',
                attack: 0,
                defense: 8,
                description: '柔軟性のある革製の鎧',
                price: 350,
                sellPrice: 175,
                requiredLevel: 3
            },
            chain_mail: {
                id: 'chain_mail',
                name: '鎖帷子',
                emoji: '🛡️',
                type: 'armor',
                slot: 'body',
                attack: 0,
                defense: 15,
                hp: 20,
                description: '鎖で編まれた重厚な鎧',
                price: 800,
                sellPrice: 400,
                requiredLevel: 5
            },
            cyber_suit: {
                id: 'cyber_suit',
                name: 'サイバースーツ',
                emoji: '🦾',
                type: 'armor',
                slot: 'body',
                attack: 2,
                defense: 20,
                hp: 30,
                mp: 15,
                description: 'ナノテク装甲のボディスーツ',
                price: 1500,
                sellPrice: 750,
                requiredLevel: 8
            },
            
            // 防具 - 手
            cloth_gloves: {
                id: 'cloth_gloves',
                name: '布の手袋',
                emoji: '🧤',
                type: 'armor',
                slot: 'hands',
                attack: 1,
                defense: 1,
                description: '基本的な布製の手袋',
                price: 60,
                sellPrice: 30,
                requiredLevel: 1
            },
            iron_gauntlets: {
                id: 'iron_gauntlets',
                name: '鉄の篭手',
                emoji: '🥊',
                type: 'armor',
                slot: 'hands',
                attack: 3,
                defense: 4,
                description: '手を守る鉄製の篭手',
                price: 200,
                sellPrice: 100,
                requiredLevel: 3
            },
            power_gloves: {
                id: 'power_gloves',
                name: 'パワーグローブ',
                emoji: '🦾',
                type: 'armor',
                slot: 'hands',
                attack: 5,
                defense: 7,
                description: 'パワーを増幅する手袋',
                price: 500,
                sellPrice: 250,
                requiredLevel: 5
            },
            
            // アクセサリー
            health_ring: {
                id: 'health_ring',
                name: 'ヘルスリング',
                emoji: '💍',
                type: 'accessory',
                slot: 'accessory',
                attack: 0,
                defense: 0,
                hp: 30,
                description: '最大HPを増やす指輪',
                price: 400,
                sellPrice: 200,
                requiredLevel: 2
            },
            power_ring: {
                id: 'power_ring',
                name: 'パワーリング',
                emoji: '💍',
                type: 'accessory',
                slot: 'accessory',
                attack: 5,
                defense: 0,
                description: '攻撃力を上げる指輪',
                price: 400,
                sellPrice: 200,
                requiredLevel: 2
            },
            defense_ring: {
                id: 'defense_ring',
                name: 'ディフェンスリング',
                emoji: '💍',
                type: 'accessory',
                slot: 'accessory',
                attack: 0,
                defense: 5,
                description: '防御力を上げる指輪',
                price: 400,
                sellPrice: 200,
                requiredLevel: 2
            },
            mana_amulet: {
                id: 'mana_amulet',
                name: 'マナのアミュレット',
                emoji: '📿',
                type: 'accessory',
                slot: 'accessory',
                attack: 0,
                defense: 0,
                mp: 20,
                description: '最大MPを増やすお守り',
                price: 500,
                sellPrice: 250,
                requiredLevel: 3
            },
            kamui_talisman: {
                id: 'kamui_talisman',
                name: '神威のタリスマン',
                emoji: '🎴',
                type: 'accessory',
                slot: 'accessory',
                attack: 3,
                defense: 3,
                hp: 20,
                mp: 10,
                description: '神の加護を受けるお守り',
                price: 4800,
                sellPrice: 600,
                requiredLevel: 7
            },
            // ===== 術士系(メイジ/ヒーラー)向け装備：魔力(magic)/MPを伸ばす＝戦士系との差別化 =====
            mage_staff: {
                id: 'mage_staff', name: '魔導の杖', emoji: '🪄', type: 'weapon', slot: 'weapon',
                attack: 4, magic: 14, mp: 8, description: '魔力を増幅する杖（術士専用）', price: 350, sellPrice: 175, requiredLevel: 1
            },
            arch_staff: {
                id: 'arch_staff', name: '大魔導の杖', emoji: '🔱', type: 'weapon', slot: 'weapon',
                attack: 8, magic: 28, mp: 18, description: '高位術士の杖（術士専用）', price: 1400, sellPrice: 700, requiredLevel: 8
            },
            healer_rod: {
                id: 'healer_rod', name: '癒しのロッド', emoji: '⚕️', type: 'weapon', slot: 'weapon',
                attack: 3, magic: 12, mp: 12, description: '治癒の力を高めるロッド（ヒーラー向け）', price: 400, sellPrice: 200, requiredLevel: 1
            },
            mystic_robe: {
                id: 'mystic_robe', name: '神秘のローブ', emoji: '👘', type: 'body', slot: 'body',
                defense: 6, magic: 10, mp: 20, description: '魔力を宿す軽装（術士向け）', price: 600, sellPrice: 300, requiredLevel: 3
            },
            sage_circlet: {
                id: 'sage_circlet', name: '賢者のサークレット', emoji: '🧿', type: 'head', slot: 'head',
                defense: 3, magic: 8, mp: 12, description: '知性を高める頭飾り（術士向け）', price: 500, sellPrice: 250, requiredLevel: 3
            }
        };

        // ★v2 装備ラスター(物理系/術士系・Lv50まで滑らかな階段・magicDefense対応)。allowedRoles明示済。
        Object.assign(this.equipmentDatabase, {
            steel_saber: { id: 'steel_saber', name: '鋼のサーベル', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 13, defense: 0, magic: 0, magicDefense: 0, hp: 0, mp: 0, speed: 2, price: 420, sellPrice: 210, requiredLevel: 3, description: '鋼のサーベル（tier2）' },
            officer_blade: { id: 'officer_blade', name: 'オフィサーブレード', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 22, defense: 2, magic: 0, magicDefense: 0, hp: 0, mp: 0, speed: 3, price: 900, sellPrice: 450, requiredLevel: 5, description: 'オフィサーブレード（tier3）' },
            riot_breaker: { id: 'riot_breaker', name: 'ライオットブレイカー', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 34, defense: 3, magic: 0, magicDefense: 0, hp: 0, mp: 0, speed: 3, price: 1700, sellPrice: 850, requiredLevel: 8, description: 'ライオットブレイカー（tier4）' },
            pulse_greatsword: { id: 'pulse_greatsword', name: 'パルス大剣', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 50, defense: 4, magic: 0, magicDefense: 0, hp: 10, mp: 0, speed: 2, price: 3000, sellPrice: 1500, requiredLevel: 11, description: 'パルス大剣（tier5）' },
            railgun_lance: { id: 'railgun_lance', name: 'レールガンランス', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 70, defense: 5, magic: 0, magicDefense: 0, hp: 0, mp: 0, speed: 4, price: 6500, sellPrice: 2600, requiredLevel: 13, description: 'レールガンランス（tier6）' },
            titan_cleaver: { id: 'titan_cleaver', name: 'タイタンクリーバー', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 95, defense: 8, magic: 0, magicDefense: 0, hp: 20, mp: 0, speed: 2, price: 11000, sellPrice: 4400, requiredLevel: 20, description: 'タイタンクリーバー（tier7）' },
            ragnarok_edge: { id: 'ragnarok_edge', name: 'ラグナロクエッジ', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 125, defense: 10, magic: 0, magicDefense: 0, hp: 20, mp: 0, speed: 5, price: 19000, sellPrice: 7500, requiredLevel: 30, description: 'ラグナロクエッジ（tier8）' },
            deus_executioner: { id: 'deus_executioner', name: 'デウス・エクスキューショナー', emoji: '⚔️', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'tank'], attack: 165, defense: 12, magic: 0, magicDefense: 10, hp: 40, mp: 0, speed: 6, price: 32000, sellPrice: 13000, requiredLevel: 40, description: 'デウス・エクスキューショナー（tier9）' },
            scale_vest: { id: 'scale_vest', name: 'スケイルベスト', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 11, magic: 0, magicDefense: 4, hp: 25, mp: 0, speed: 0, price: 450, sellPrice: 225, requiredLevel: 3, description: 'スケイルベスト（tier2）' },
            riot_plate: { id: 'riot_plate', name: 'ライオットプレート', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 19, magic: 0, magicDefense: 6, hp: 45, mp: 0, speed: 0, price: 950, sellPrice: 475, requiredLevel: 5, description: 'ライオットプレート（tier3）' },
            guardian_carapace: { id: 'guardian_carapace', name: 'ガーディアンカラペス', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 30, magic: 0, magicDefense: 9, hp: 70, mp: 0, speed: -1, price: 1800, sellPrice: 900, requiredLevel: 8, description: 'ガーディアンカラペス（tier4）' },
            titan_armor: { id: 'titan_armor', name: 'タイタンアーマー', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 44, magic: 0, magicDefense: 13, hp: 100, mp: 0, speed: -1, price: 4000, sellPrice: 1600, requiredLevel: 11, description: 'タイタンアーマー（tier5）' },
            aegis_frame: { id: 'aegis_frame', name: 'イージスフレーム', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 62, magic: 0, magicDefense: 18, hp: 140, mp: 0, speed: -1, price: 7000, sellPrice: 2800, requiredLevel: 13, description: 'イージスフレーム（tier6）' },
            fortress_mail: { id: 'fortress_mail', name: 'フォートレスメイル', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 84, magic: 0, magicDefense: 24, hp: 190, mp: 0, speed: -2, price: 11500, sellPrice: 4750, requiredLevel: 20, description: 'フォートレスメイル（tier7）' },
            colossus_plate: { id: 'colossus_plate', name: 'コロッサスプレート', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 110, magic: 0, magicDefense: 30, hp: 250, mp: 0, speed: -2, price: 20000, sellPrice: 8000, requiredLevel: 30, description: 'コロッサスプレート（tier8）' },
            deus_bulwark: { id: 'deus_bulwark', name: 'デウス・バルワーク', emoji: '🥼', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'tank'], attack: 5, defense: 145, magic: 0, magicDefense: 40, hp: 320, mp: 0, speed: -1, price: 0, sellPrice: 14000, requiredLevel: 40, description: 'デウス・バルワーク（tier9）' },
            scale_coif: { id: 'scale_coif', name: 'スケイルコイフ', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 8, magic: 0, magicDefense: 3, hp: 15, mp: 0, speed: 0, price: 300, sellPrice: 150, requiredLevel: 3, description: 'スケイルコイフ（tier2）' },
            riot_visor: { id: 'riot_visor', name: 'ライオットバイザー', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 14, magic: 0, magicDefense: 5, hp: 25, mp: 0, speed: 0, price: 650, sellPrice: 325, requiredLevel: 5, description: 'ライオットバイザー（tier3）' },
            guardian_helm: { id: 'guardian_helm', name: 'ガーディアンヘルム', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 22, magic: 0, magicDefense: 7, hp: 40, mp: 0, speed: 0, price: 1250, sellPrice: 625, requiredLevel: 8, description: 'ガーディアンヘルム（tier4）' },
            titan_helm: { id: 'titan_helm', name: 'タイタンヘルム', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 32, magic: 0, magicDefense: 10, hp: 60, mp: 0, speed: 0, price: 2800, sellPrice: 1100, requiredLevel: 11, description: 'タイタンヘルム（tier5）' },
            aegis_helm: { id: 'aegis_helm', name: 'イージスヘルム', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 44, magic: 0, magicDefense: 14, hp: 85, mp: 0, speed: 0, price: 4900, sellPrice: 1950, requiredLevel: 13, description: 'イージスヘルム（tier6）' },
            fortress_helm: { id: 'fortress_helm', name: 'フォートレスヘルム', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 58, magic: 0, magicDefense: 18, hp: 115, mp: 0, speed: 0, price: 8200, sellPrice: 3400, requiredLevel: 20, description: 'フォートレスヘルム（tier7）' },
            deus_crown: { id: 'deus_crown', name: 'デウス・クラウン', emoji: '⛑️', type: 'head', slot: 'head', allowedRoles: ['all-rounder', 'tank'], attack: 0, defense: 78, magic: 0, magicDefense: 24, hp: 160, mp: 0, speed: 1, price: 0, sellPrice: 6250, requiredLevel: 30, description: 'デウス・クラウン（tier8）' },
            scale_gauntlets: { id: 'scale_gauntlets', name: 'スケイルガントレット', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 4, defense: 6, magic: 0, magicDefense: 2, hp: 0, mp: 0, speed: 1, price: 280, sellPrice: 140, requiredLevel: 3, description: 'スケイルガントレット（tier2）' },
            riot_grips: { id: 'riot_grips', name: 'ライオットグリップ', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 7, defense: 11, magic: 0, magicDefense: 3, hp: 0, mp: 0, speed: 1, price: 620, sellPrice: 310, requiredLevel: 5, description: 'ライオットグリップ（tier3）' },
            guardian_gauntlets: { id: 'guardian_gauntlets', name: 'ガーディアンガントレット', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 11, defense: 18, magic: 0, magicDefense: 5, hp: 10, mp: 0, speed: 1, price: 1200, sellPrice: 600, requiredLevel: 8, description: 'ガーディアンガントレット（tier4）' },
            titan_fists: { id: 'titan_fists', name: 'タイタンフィスト', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 17, defense: 27, magic: 0, magicDefense: 7, hp: 15, mp: 0, speed: 1, price: 2600, sellPrice: 1050, requiredLevel: 11, description: 'タイタンフィスト（tier5）' },
            aegis_gauntlets: { id: 'aegis_gauntlets', name: 'イージスガントレット', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 24, defense: 38, magic: 0, magicDefense: 10, hp: 25, mp: 0, speed: 2, price: 4600, sellPrice: 1850, requiredLevel: 13, description: 'イージスガントレット（tier6）' },
            fortress_gauntlets: { id: 'fortress_gauntlets', name: 'フォートレスガントレット', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 33, defense: 52, magic: 0, magicDefense: 14, hp: 40, mp: 0, speed: 2, price: 7800, sellPrice: 3250, requiredLevel: 20, description: 'フォートレスガントレット（tier7）' },
            deus_gauntlets: { id: 'deus_gauntlets', name: 'デウス・ガントレット', emoji: '🧤', type: 'hands', slot: 'hands', allowedRoles: ['all-rounder', 'tank'], attack: 45, defense: 70, magic: 0, magicDefense: 18, hp: 60, mp: 0, speed: 3, price: 0, sellPrice: 5900, requiredLevel: 30, description: 'デウス・ガントレット（tier8）' },
            berserker_band: { id: 'berserker_band', name: 'バーサーカーバンド', emoji: '💍', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'tank'], attack: 14, defense: 2, magic: 0, magicDefense: 0, hp: 0, mp: 0, speed: 3, price: 1700, sellPrice: 800, requiredLevel: 8, description: 'バーサーカーバンド（tier4）' },
            iron_will_pendant: { id: 'iron_will_pendant', name: 'アイアンウィルペンダント', emoji: '💍', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'tank'], attack: 2, defense: 14, magic: 0, magicDefense: 8, hp: 60, mp: 0, speed: 0, price: 1900, sellPrice: 800, requiredLevel: 8, description: 'アイアンウィルペンダント（tier4）' },
            warlord_emblem: { id: 'warlord_emblem', name: 'ウォーロードエンブレム', emoji: '💍', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'tank'], attack: 28, defense: 6, magic: 0, magicDefense: 4, hp: 40, mp: 0, speed: 5, price: 5300, sellPrice: 2200, requiredLevel: 13, description: 'ウォーロードエンブレム（tier6）' },
            bastion_core: { id: 'bastion_core', name: 'バスティオンコア', emoji: '💍', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'tank'], attack: 6, defense: 30, magic: 0, magicDefense: 16, hp: 120, mp: 0, speed: 0, price: 5300, sellPrice: 2200, requiredLevel: 13, description: 'バスティオンコア（tier6）' },
            deus_sigil: { id: 'deus_sigil', name: 'デウス・シジル', emoji: '💍', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'tank'], attack: 40, defense: 40, magic: 0, magicDefense: 22, hp: 150, mp: 0, speed: 6, price: 0, sellPrice: 11000, requiredLevel: 40, description: 'デウス・シジル（tier9）' },
            apprentice_staff: { id: 'apprentice_staff', name: '見習いの杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 3, defense: 0, magic: 7, magicDefense: 0, hp: 0, mp: 5, speed: 1, price: 300, sellPrice: 150, requiredLevel: 1, description: '見習いの杖（tier1）' },
            acolyte_rod: { id: 'acolyte_rod', name: '信徒のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 2, defense: 0, magic: 5, magicDefense: 2, hp: 0, mp: 11, speed: 0, price: 300, sellPrice: 150, requiredLevel: 1, description: '信徒のロッド（tier1）' },
            woven_robe: { id: 'woven_robe', name: '織りのローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 3, magic: 3, magicDefense: 3, hp: 0, mp: 10, speed: 0, price: 260, sellPrice: 130, requiredLevel: 1, description: '織りのローブ（tier1）' },
            glass_charm: { id: 'glass_charm', name: '硝子のチャーム', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 2, magicDefense: 2, hp: 0, mp: 8, speed: 1, price: 220, sellPrice: 110, requiredLevel: 1, description: '硝子のチャーム（tier1）' },
            oak_staff: { id: 'oak_staff', name: '樫の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 4, defense: 0, magic: 12, magicDefense: 0, hp: 0, mp: 8, speed: 1, price: 650, sellPrice: 325, requiredLevel: 3, description: '樫の杖（tier2）' },
            prayer_rod: { id: 'prayer_rod', name: '祈りのロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 3, defense: 0, magic: 8, magicDefense: 3, hp: 0, mp: 16, speed: 0, price: 650, sellPrice: 325, requiredLevel: 3, description: '祈りのロッド（tier2）' },
            silk_robe: { id: 'silk_robe', name: '絹のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 4, magic: 4, magicDefense: 5, hp: 0, mp: 16, speed: 0, price: 560, sellPrice: 280, requiredLevel: 3, description: '絹のローブ（tier2）' },
            crystal_charm: { id: 'crystal_charm', name: '水晶のチャーム', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 3, magicDefense: 3, hp: 0, mp: 12, speed: 1, price: 480, sellPrice: 240, requiredLevel: 3, description: '水晶のチャーム（tier2）' },
            rune_staff: { id: 'rune_staff', name: 'ルーンの杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 6, defense: 0, magic: 17, magicDefense: 0, hp: 0, mp: 11, speed: 1, price: 1300, sellPrice: 650, requiredLevel: 5, description: 'ルーンの杖（tier3）' },
            saint_rod: { id: 'saint_rod', name: '聖者のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 4, defense: 0, magic: 11, magicDefense: 4, hp: 0, mp: 22, speed: 0, price: 1300, sellPrice: 650, requiredLevel: 5, description: '聖者のロッド（tier3）' },
            arcane_robe: { id: 'arcane_robe', name: '秘術のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 6, magic: 6, magicDefense: 7, hp: 0, mp: 24, speed: 0, price: 1100, sellPrice: 550, requiredLevel: 5, description: '秘術のローブ（tier3）' },
            sage_charm: { id: 'sage_charm', name: '賢者のチャーム', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 4, magicDefense: 5, hp: 0, mp: 18, speed: 2, price: 950, sellPrice: 475, requiredLevel: 5, description: '賢者のチャーム（tier3）' },
            sorcerer_staff: { id: 'sorcerer_staff', name: '魔術師の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 8, defense: 0, magic: 25, magicDefense: 0, hp: 0, mp: 16, speed: 1, price: 2400, sellPrice: 1200, requiredLevel: 8, description: '魔術師の杖（tier4）' },
            cleric_rod: { id: 'cleric_rod', name: '司祭のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 5, defense: 0, magic: 16, magicDefense: 6, hp: 0, mp: 32, speed: 0, price: 2400, sellPrice: 1200, requiredLevel: 8, description: '司祭のロッド（tier4）' },
            mystic_veil_robe: { id: 'mystic_veil_robe', name: '幻惑のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 8, magic: 9, magicDefense: 10, hp: 0, mp: 34, speed: 0, price: 2000, sellPrice: 1000, requiredLevel: 8, description: '幻惑のローブ（tier4）' },
            astral_orb: { id: 'astral_orb', name: '星辰のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 6, magicDefense: 7, hp: 0, mp: 26, speed: 2, price: 1700, sellPrice: 850, requiredLevel: 8, description: '星辰のオーブ（tier4）' },
            archmage_staff: { id: 'archmage_staff', name: '大魔術師の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 11, defense: 0, magic: 35, magicDefense: 0, hp: 0, mp: 24, speed: 2, price: 4200, sellPrice: 2100, requiredLevel: 11, description: '大魔術師の杖（tier5）' },
            bishop_rod: { id: 'bishop_rod', name: '司教のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 7, defense: 0, magic: 22, magicDefense: 8, hp: 0, mp: 44, speed: 0, price: 4200, sellPrice: 2100, requiredLevel: 11, description: '司教のロッド（tier5）' },
            phantom_robe: { id: 'phantom_robe', name: '幽幻のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 11, magic: 13, magicDefense: 14, hp: 0, mp: 48, speed: 0, price: 3500, sellPrice: 1750, requiredLevel: 11, description: '幽幻のローブ（tier5）' },
            nebula_orb: { id: 'nebula_orb', name: '星雲のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 9, magicDefense: 10, hp: 0, mp: 36, speed: 3, price: 3000, sellPrice: 1500, requiredLevel: 11, description: '星雲のオーブ（tier5）' },
            warlock_staff: { id: 'warlock_staff', name: '破魔の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 15, defense: 0, magic: 49, magicDefense: 0, hp: 0, mp: 34, speed: 2, price: 8500, sellPrice: 3500, requiredLevel: 13, description: '破魔の杖（tier6）' },
            cardinal_rod: { id: 'cardinal_rod', name: '枢機のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 10, defense: 0, magic: 31, magicDefense: 11, hp: 0, mp: 60, speed: 0, price: 8500, sellPrice: 3500, requiredLevel: 13, description: '枢機のロッド（tier6）' },
            void_robe: { id: 'void_robe', name: '虚空のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 15, magic: 18, magicDefense: 19, hp: 0, mp: 66, speed: 0, price: 7000, sellPrice: 2900, requiredLevel: 13, description: '虚空のローブ（tier6）' },
            eclipse_orb: { id: 'eclipse_orb', name: '蝕のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 13, magicDefense: 14, hp: 0, mp: 50, speed: 3, price: 6000, sellPrice: 2500, requiredLevel: 13, description: '蝕のオーブ（tier6）' },
            sage_lord_staff: { id: 'sage_lord_staff', name: '賢王の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 20, defense: 0, magic: 68, magicDefense: 0, hp: 0, mp: 48, speed: 2, price: 13500, sellPrice: 5750, requiredLevel: 20, description: '賢王の杖（tier7）' },
            seraph_rod: { id: 'seraph_rod', name: '熾天使のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 13, defense: 0, magic: 44, magicDefense: 15, hp: 0, mp: 82, speed: 0, price: 13500, sellPrice: 5750, requiredLevel: 20, description: '熾天使のロッド（tier7）' },
            celestial_robe: { id: 'celestial_robe', name: '天界のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 20, magic: 25, magicDefense: 26, hp: 0, mp: 90, speed: 0, price: 11500, sellPrice: 4750, requiredLevel: 20, description: '天界のローブ（tier7）' },
            galaxy_orb: { id: 'galaxy_orb', name: '銀河のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 18, magicDefense: 19, hp: 0, mp: 68, speed: 4, price: 9800, sellPrice: 4100, requiredLevel: 20, description: '銀河のオーブ（tier7）' },
            deus_staff: { id: 'deus_staff', name: '神理の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 26, defense: 0, magic: 92, magicDefense: 0, hp: 0, mp: 66, speed: 3, price: 0, sellPrice: 9000, requiredLevel: 30, description: '神理の杖（tier8）' },
            divine_rod: { id: 'divine_rod', name: '神癒のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 17, defense: 0, magic: 60, magicDefense: 20, hp: 0, mp: 112, speed: 0, price: 0, sellPrice: 9000, requiredLevel: 30, description: '神癒のロッド（tier8）' },
            empyrean_robe: { id: 'empyrean_robe', name: '天威のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 26, magic: 34, magicDefense: 35, hp: 0, mp: 120, speed: 0, price: 0, sellPrice: 7500, requiredLevel: 30, description: '天威のローブ（tier8）' },
            cosmos_orb: { id: 'cosmos_orb', name: '宇宙のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 24, magicDefense: 26, hp: 0, mp: 92, speed: 4, price: 0, sellPrice: 6500, requiredLevel: 30, description: '宇宙のオーブ（tier8）' },
            kamui_staff: { id: 'kamui_staff', name: '神威の杖', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'mage'], attack: 35, defense: 0, magic: 126, magicDefense: 0, hp: 0, mp: 90, speed: 3, price: 0, sellPrice: 15000, requiredLevel: 40, description: '神威の杖（tier9）' },
            kamui_rod: { id: 'kamui_rod', name: '神威のロッド', emoji: '🪄', type: 'weapon', slot: 'weapon', allowedRoles: ['all-rounder', 'healer'], attack: 23, defense: 0, magic: 82, magicDefense: 27, hp: 0, mp: 150, speed: 0, price: 0, sellPrice: 15000, requiredLevel: 40, description: '神威のロッド（tier9）' },
            kamui_robe: { id: 'kamui_robe', name: '神威のローブ', emoji: '🧥', type: 'body', slot: 'body', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 34, magic: 46, magicDefense: 48, hp: 0, mp: 160, speed: 0, price: 0, sellPrice: 12500, requiredLevel: 40, description: '神威のローブ（tier9）' },
            kamui_orb: { id: 'kamui_orb', name: '神威のオーブ', emoji: '🔮', type: 'accessory', slot: 'accessory', allowedRoles: ['all-rounder', 'healer', 'mage'], attack: 0, defense: 0, magic: 33, magicDefense: 36, hp: 0, mp: 124, speed: 5, price: 0, sellPrice: 10500, requiredLevel: 40, description: '神威のオーブ（tier9）' }
        });

        // 各装備に allowedRoles（装備できるクラス）を付与。戦士系=all-rounder/tank、術士系=mage/healer、共通=装飾品。
        this._applyEquipmentRoles();

        // キャラクター別の装備スロット（charId -> {weapon,head,...}）
        this.equippedByCharacter = {};
        // 所持している装備（インベントリ）※全キャラ共有
        this.inventory = {};
    }

    // 各装備に allowedRoles を付与（明示テーブル＋既定ヒューリスティック）。
    // 戦士系=['all-rounder','tank'] / 術士系=['mage','healer'] / 軽装・装飾品=全クラス。
    _applyEquipmentRoles() {
        const ALL = ['all-rounder', 'tank', 'healer', 'mage'];
        const WARRIOR = ['all-rounder', 'tank'];
        const CASTER = ['all-rounder', 'healer', 'mage'];
        const table = {
            // 物理武器=戦士系
            wooden_sword: WARRIOR, iron_sword: WARRIOR, cyber_gun: WARRIOR, plasma_blade: WARRIOR, kamui_katana: WARRIOR,
            // 術士武器=術士系
            mage_staff: ['all-rounder', 'mage'], arch_staff: ['all-rounder', 'mage'], healer_rod: ['all-rounder', 'healer'],
            // 重装=戦士系 / 軽装(cloth)=全員 / 術士ローブ=術士系
            iron_helmet: WARRIOR, chain_mail: WARRIOR, cyber_suit: WARRIOR, iron_gauntlets: WARRIOR, power_gloves: WARRIOR,
            cyber_helmet: WARRIOR, leather_armor: ['all-rounder', 'tank', 'healer'],
            cloth_hat: ALL, cloth_armor: ALL, cloth_gloves: ALL,
            mystic_robe: CASTER, sage_circlet: CASTER,
            // 装飾品=全員（攻撃指輪のみ戦士寄り、魔力護符は術士寄りだが全員可）
            health_ring: ALL, defense_ring: ALL, kamui_talisman: ALL, mana_amulet: ALL, power_ring: WARRIOR
        };
        Object.keys(this.equipmentDatabase).forEach(id => {
            const e = this.equipmentDatabase[id];
            if (e.allowedRoles) return;
            if (table[id]) { e.allowedRoles = table[id]; return; }
            // 既定: magic>0なら術士系、装飾品は全員、それ以外は戦士系
            if ((e.magic || 0) > 0) e.allowedRoles = CASTER;
            else if (e.slot === 'accessory') e.allowedRoles = ALL;
            else e.allowedRoles = WARRIOR;
        });
    }

    // キャラID（パーティ別装備のキー）
    _charId(character) {
        return (character && (character.characterId || character.name)) || 'player';
    }

    // 指定キャラの装備スロット（無ければ生成）
    getEquipped(character) {
        const id = this._charId(character);
        if (!this.equippedByCharacter[id]) {
            this.equippedByCharacter[id] = { weapon: null, head: null, body: null, hands: null, accessory: null };
        }
        return this.equippedByCharacter[id];
    }
    
    // 装備を追加
    addEquipment(equipmentId, quantity = 1) {
        const equipment = this.equipmentDatabase[equipmentId];
        if (!equipment) {
            console.error('Unknown equipment:', equipmentId);
            return false;
        }
        
        console.log(`Adding equipment: ${equipmentId} x${quantity}`);
        console.log('Current inventory before add:', this.inventory);
        
        if (!this.inventory[equipmentId]) {
            this.inventory[equipmentId] = {
                ...equipment,
                quantity: 0
            };
        }
        
        this.inventory[equipmentId].quantity += quantity;
        console.log(`Added ${quantity}x ${equipment.name}`);
        console.log('Current inventory after add:', this.inventory);
        console.log('Total equipment count:', Object.keys(this.inventory).length);
        return true;
    }
    
    // 装備する
    equipItem(equipmentId, player) {
        const equipment = this.equipmentDatabase[equipmentId];
        if (!equipment) {
            console.error('Equipment not found:', equipmentId);
            return { success: false, message: '装備が見つからない' };
        }

        // インベントリにあるかチェック
        if (!this.inventory[equipmentId] || this.inventory[equipmentId].quantity <= 0) {
            console.error('Equipment not in inventory:', equipmentId, this.inventory);
            return { success: false, message: 'この装備を持っていない' };
        }

        // ★クラス(role)制限: 戦士系/ヒーラー/メイジで装備できる物が違う（パーティの個性）
        const role = (player && player.role) || 'all-rounder';
        if (equipment.allowedRoles && !equipment.allowedRoles.includes(role)) {
            return { success: false, message: `${player && player.name || 'このキャラ'}には ${equipment.name}は そうびできない（クラスが あわない）` };
        }

        const slot = equipment.slot;
        const equipped = this.getEquipped(player);
        const oldEquipmentId = equipped[slot];
        
        console.log(`Equipping ${equipment.name} to slot ${slot}`);
        
        // 古い装備を外してインベントリに戻す
        if (oldEquipmentId) {
            console.log(`Unequipping old equipment from slot ${slot}:`, oldEquipmentId);
            const oldEquipment = this.equipmentDatabase[oldEquipmentId];
            if (oldEquipment) {
                this.addEquipment(oldEquipmentId, 1);
            }
        }
        
        // 新しい装備を装備
        equipped[slot] = equipmentId;
        
        // インベントリから削除
        this.inventory[equipmentId].quantity--;
        if (this.inventory[equipmentId].quantity <= 0) {
            delete this.inventory[equipmentId];
        }
        
        // ステータスを再計算
        this.recalculatePlayerStats(player);
        
        return { 
            success: true, 
            message: `${equipment.name}を装備した！`,
            equipment: equipment
        };
    }
    
    // 装備を外す
    unequipItem(slot, player, returnToInventory = true) {
        const equipped = this.getEquipped(player);
        const equipmentId = equipped[slot];
        if (!equipmentId) {
            return { success: false, message: '何も装備していない' };
        }

        const equipment = this.equipmentDatabase[equipmentId];

        console.log(`Unequipping ${equipment.name} from slot ${slot}`);

        // 装備を外す
        equipped[slot] = null;
        
        // インベントリに戻す
        if (returnToInventory) {
            this.addEquipment(equipmentId, 1);
        }
        
        // ステータスを再計算
        this.recalculatePlayerStats(player);
        
        return { 
            success: true, 
            message: `${equipment.name}を外した`,
            equipment: equipment
        };
    }
    
    // 装備のステータスを適用/解除
    applyEquipmentStats(equipment, player, apply = true) {
        const multiplier = apply ? 1 : -1;
        
        console.log(`Applying equipment stats: ${equipment.name}, apply=${apply}`);
        console.log('Equipment bonuses:', {
            attack: equipment.attack,
            defense: equipment.defense,
            hp: equipment.hp,
            mp: equipment.mp
        });
        console.log('Player stats before:', {
            attack: player.attack,
            defense: player.defense,
            maxHp: player.maxHp,
            maxMp: player.maxMp
        });
        
        if (equipment.attack) {
            player.attack = (player.attack || 0) + (equipment.attack * multiplier);
        }
        if (equipment.defense) {
            player.defense = (player.defense || 0) + (equipment.defense * multiplier);
        }
        if (equipment.hp) {
            player.maxHp = (player.maxHp || 100) + (equipment.hp * multiplier);
            if (apply) {
                player.hp = Math.min(player.hp, player.maxHp);
            }
        }
        if (equipment.mp) {
            player.maxMp = (player.maxMp || 50) + (equipment.mp * multiplier);
            if (apply) {
                player.mp = Math.min(player.mp, player.maxMp);
            }
        }
        
        console.log('Player stats after:', {
            attack: player.attack,
            defense: player.defense,
            maxHp: player.maxHp,
            maxMp: player.maxMp
        });
    }
    
    // 装備中のアイテムを取得（キャラ別）
    getEquippedItems(character) {
        const slots = this.getEquipped(character);
        const equipped = {};
        for (const slot in slots) {
            const equipmentId = slots[slot];
            equipped[slot] = equipmentId ? this.equipmentDatabase[equipmentId] : null;
        }
        return equipped;
    }
    
    // 装備インベントリを取得
    getEquipmentInventory() {
        console.log('getEquipmentInventory called');
        console.log('Raw inventory:', this.inventory);
        const inventoryArray = Object.values(this.inventory);
        console.log('Inventory array length:', inventoryArray.length);
        console.log('Inventory array:', inventoryArray);
        
        const sorted = inventoryArray.sort((a, b) => {
            // スロット順にソート
            const slotOrder = ['weapon', 'head', 'body', 'hands', 'accessory'];
            return slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot);
        });
        
        console.log('Sorted inventory:', sorted);
        return sorted;
    }
    
    // 装備を持っているかチェック
    hasEquipment(equipmentId) {
        return (this.inventory[equipmentId]?.quantity || 0) > 0;
    }
    
    // 装備の購入
    buyEquipment(equipmentId, player) {
        const equipment = this.equipmentDatabase[equipmentId];
        if (!equipment) {
            return { success: false, message: 'その装備は存在しない' };
        }
        
        if (player.gold < equipment.price) {
            return { success: false, message: 'ゴールドが足りない！' };
        }
        
        player.gold -= equipment.price;
        this.addEquipment(equipmentId, 1);
        
        return { 
            success: true, 
            message: `${equipment.name}を購入した！\n${equipment.price}ゴールドを支払った。`
        };
    }
    
    // 装備の売却
    sellEquipment(equipmentId, player) {
        const equipment = this.equipmentDatabase[equipmentId];
        if (!equipment) {
            return { success: false, message: 'その装備は存在しない' };
        }
        
        if (!this.hasEquipment(equipmentId)) {
            return { success: false, message: '装備を持っていない！' };
        }
        
        this.inventory[equipmentId].quantity--;
        if (this.inventory[equipmentId].quantity <= 0) {
            delete this.inventory[equipmentId];
        }
        
        player.gold += equipment.sellPrice;
        
        return { 
            success: true, 
            message: `${equipment.name}を売却した！\n${equipment.sellPrice}ゴールドを手に入れた。`
        };
    }
    
    // 総ステータスを計算（キャラ別）
    getTotalStats(character) {
        const stats = {
            attack: 0,
            defense: 0,
            hp: 0,
            mp: 0,
            magic: 0,
            magicDefense: 0,   // ★v2: 魔法防御（術士装備で供給）
            speed: 0
        };

        const slots = this.getEquipped(character);
        for (const slot in slots) {
            const equipmentId = slots[slot];
            if (equipmentId) {
                const equipment = this.equipmentDatabase[equipmentId];
                stats.attack += equipment.attack || 0;
                stats.defense += equipment.defense || 0;
                stats.hp += equipment.hp || 0;
                stats.mp += equipment.mp || 0;
                stats.magic += equipment.magic || 0;   // 術士装備の魔力
                stats.magicDefense += equipment.magicDefense || 0;   // ★v2: 魔法防御
                stats.speed += equipment.speed || 0;
            }
        }

        return stats;
    }
    
    // プレイヤーのステータスを再計算
    recalculatePlayerStats(player) {
        // 基本ステータスを保存（初回のみ）
        if (player.baseAttack === undefined) {
            player.baseAttack = player.attack || 10;
        }
        if (player.baseDefense === undefined) {
            player.baseDefense = player.defense || 5;
        }
        if (player.baseMaxHp === undefined) {
            player.baseMaxHp = 100;
        }
        if (player.baseMaxMp === undefined) {
            player.baseMaxMp = 50;
        }
        if (player.baseMagic === undefined) {
            player.baseMagic = player.magic || 0;
        }
        if (player.baseSpeed === undefined) {
            player.baseSpeed = player.speed || 5;
        }
        // ★v2: 魔法防御の基礎値＝物理防御基礎の半分から常に導出（独立成長statが無いため baseDefense に追従）。
        //   旧セーブ/新規どちらも baseDefense から決定論導出＝非破壊。
        player.baseMagicDefense = Math.floor((player.baseDefense || 5) * 0.5);

        // 装備ボーナスを計算（このキャラの装備）
        const equipStats = this.getTotalStats(player);

        // 現在のHPとMPの割合を保存（maxHp/maxMp=0時のNaN伝播を防止）
        const hpRatio = player.maxHp ? player.hp / player.maxHp : 1;
        const mpRatio = player.maxMp ? player.mp / player.maxMp : 1;

        // ステータスを再計算
        player.attack = player.baseAttack + equipStats.attack;
        player.defense = player.baseDefense + equipStats.defense;
        player.maxHp = player.baseMaxHp + equipStats.hp;
        player.maxMp = player.baseMaxMp + equipStats.mp;
        player.magic = player.baseMagic + equipStats.magic;   // 術士装備で魔力が伸びる
        player.magicDefense = player.baseMagicDefense + equipStats.magicDefense;   // ★v2: 魔法防御
        player.speed = player.baseSpeed + equipStats.speed;

        // HPとMPを調整（割合を維持）
        player.hp = Math.min(Math.floor(player.maxHp * hpRatio), player.maxHp);
        player.mp = Math.min(Math.floor(player.maxMp * mpRatio), player.maxMp);

        console.log('Stats recalculated:', {
            base: { attack: player.baseAttack, defense: player.baseDefense },
            equipment: equipStats,
            total: { attack: player.attack, defense: player.defense, maxHp: player.maxHp, maxMp: player.maxMp }
        });
    }

    // === セーブ用: キャラ別装備スロット(id)と在庫(id→数量) ===
    toJSON() {
        const inv = {};
        for (const id in this.inventory) inv[id] = this.inventory[id].quantity;
        const eq = {};
        for (const cid in this.equippedByCharacter) eq[cid] = { ...this.equippedByCharacter[cid] };
        return { equippedByCharacter: eq, inventory: inv };
    }
    // === ロード用: DB参照で再構築。装備は在庫を消費せず直接セット ===
    fromJSON(data, player) {
        this.equippedByCharacter = {};
        this.inventory = {};
        if (data) {
            if (data.inventory) {
                for (const id in data.inventory) {
                    if (this.equipmentDatabase[id] && data.inventory[id] > 0) this.addEquipment(id, data.inventory[id]);
                }
            }
            if (data.equippedByCharacter) {
                for (const cid in data.equippedByCharacter) {
                    const src = data.equippedByCharacter[cid];
                    const dst = { weapon: null, head: null, body: null, hands: null, accessory: null };
                    for (const slot in dst) { const id = src[slot]; if (id && this.equipmentDatabase[id]) dst[slot] = id; }
                    this.equippedByCharacter[cid] = dst;
                }
            } else if (data.equipped && player) {
                // 旧形式（単一装備）→ player の装備として割り当て
                const dst = this.getEquipped(player);
                for (const slot in dst) { const id = data.equipped[slot]; if (id && this.equipmentDatabase[id]) dst[slot] = id; }
            }
        }
        if (player) this.recalculatePlayerStats(player);
    }

    // ロード後、パーティ全員のステータスを装備込みで再計算
    recalcAll(members) {
        (members || []).forEach(m => { if (m) this.recalculatePlayerStats(m); });
    }
}

// グローバルにエクスポート
window.EquipmentSystem = EquipmentSystem;
