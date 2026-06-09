// ==========================================
// Object Layer Catalog
// ==========================================
// Coordinates and sizes are authored in the base 800x450 map space.
// Each object is anchored at its foot-center (x, y). The footprint is the
// collision band at the object's feet, also centered on (x, y).

window.OBJECT_CATALOG = {
    solid_wall: {
        name: '非表示コリジョン',
        sprite: null,
        w: 0,
        h: 0,
        footprint: { w: 40, h: 24 },
        solid: true,
        visible: false,
        tags: ['collision']
    },

    shop_door: {
        name: '店舗入口',
        sprite: null,
        w: 42,
        h: 54,
        footprint: { w: 42, h: 18 },
        solid: false,
        visible: false,
        tags: ['town', 'shop']
    },

    street_planter: {
        name: '街路植栽',
        sprite: 'assets/objects/street_planter.png',
        w: 88,
        h: 72,
        footprint: { w: 76, h: 22 },
        solid: true,
        tags: ['town', 'city']
    },

    vending_machine: {
        name: '自販機',
        sprite: 'assets/objects/vending_machine.png',
        w: 44,
        h: 74,
        footprint: { w: 34, h: 16 },
        solid: true,
        tags: ['town', 'city']
    },

    holo_sign: {
        name: 'ホログラム看板',
        sprite: 'assets/objects/holo_sign.png',
        w: 58,
        h: 86,
        footprint: { w: 42, h: 16 },
        solid: true,
        tags: ['town', 'city', 'shop']
    },

    street_lamp: {
        name: '街灯',
        sprite: 'assets/objects/street_lamp.png',
        w: 32,
        h: 96,
        footprint: { w: 20, h: 14 },
        solid: true,
        tags: ['town', 'city']
    },

    shop_counter: {
        name: 'ショップカウンター',
        sprite: 'assets/objects/shop_counter.png',
        w: 180,
        h: 74,
        footprint: { w: 170, h: 28 },
        solid: true,
        tags: ['shop']
    },

    shelf_wall: {
        name: '商品棚',
        sprite: 'assets/objects/shelf_wall.png',
        w: 132,
        h: 118,
        footprint: { w: 120, h: 26 },
        solid: true,
        tags: ['shop']
    },

    inn_sign: {
        name: '宿屋サイン',
        sprite: 'assets/objects/inn_sign.png',
        w: 48,
        h: 82,
        footprint: { w: 30, h: 14 },
        solid: false,
        tags: ['town', 'shop']
    },

    guild_board: {
        name: 'ギルド掲示板',
        sprite: 'assets/objects/guild_board.png',
        w: 96,
        h: 78,
        footprint: { w: 86, h: 18 },
        solid: true,
        tags: ['town', 'shop']
    },

    bank_terminal: {
        name: '銀行端末',
        sprite: 'assets/objects/bank_terminal.png',
        w: 52,
        h: 78,
        footprint: { w: 36, h: 18 },
        solid: true,
        tags: ['town', 'shop']
    },

    black_market_gate: {
        name: '闇市ゲート',
        sprite: 'assets/objects/black_market_gate.png',
        w: 112,
        h: 96,
        footprint: { w: 100, h: 20 },
        solid: true,
        tags: ['town', 'black-market']
    },

    city_bench: {
        name: '街路ベンチ',
        sprite: 'assets/objects/city_bench.png',
        w: 96,
        h: 48,
        footprint: { w: 88, h: 18 },
        solid: true,
        tags: ['town', 'city']
    },

    residential_planter: {
        name: '住宅街植栽',
        sprite: 'assets/objects/residential_planter.png',
        w: 92,
        h: 54,
        footprint: { w: 82, h: 18 },
        solid: true,
        tags: ['town', 'residential']
    }
};
