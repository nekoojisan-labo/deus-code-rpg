// ==========================================
// Object Layer Map Data
// ==========================================
// Pilot conversion: shopping_street_north.
// The current background image is still a baked map, so this first pass uses
// solid-only objects to move collision ownership from walkableRects/buildings
// into map.objects[].footprint without changing the visible art.

window.MAP_OBJECTS = {
    shopping_street_north: {
        image: 'assets/maps/shopping_street_north_clean_v1.png',
        objects: [
            { kind: 'solid_wall', x: 160, y: 112, footprint: { w: 320, h: 112 } },
            { kind: 'solid_wall', x: 640, y: 112, footprint: { w: 320, h: 112 } },
            { kind: 'solid_wall', x: 130, y: 370, footprint: { w: 260, h: 160 } },
            { kind: 'solid_wall', x: 670, y: 370, footprint: { w: 260, h: 160 } },
            { kind: 'solid_wall', x: 145, y: 450, footprint: { w: 290, h: 54 } },
            { kind: 'solid_wall', x: 655, y: 450, footprint: { w: 290, h: 54 } },
            { kind: 'solid_wall', x: 16, y: 450, footprint: { w: 32, h: 450 } },
            { kind: 'solid_wall', x: 784, y: 450, footprint: { w: 32, h: 450 } },

            { kind: 'street_planter', x: 198, y: 128, w: 104, h: 84, footprint: { w: 92, h: 24 } },
            { kind: 'street_planter', x: 602, y: 128, w: 104, h: 84, footprint: { w: 92, h: 24 }, flip: true },
            { kind: 'street_planter', x: 210, y: 348, w: 98, h: 78, footprint: { w: 88, h: 22 } },
            { kind: 'street_planter', x: 590, y: 348, w: 98, h: 78, footprint: { w: 88, h: 22 }, flip: true },

            { kind: 'street_lamp', x: 328, y: 170, w: 30, h: 88, footprint: { w: 18, h: 14 } },
            { kind: 'street_lamp', x: 472, y: 170, w: 30, h: 88, footprint: { w: 18, h: 14 }, flip: true },
            { kind: 'street_lamp', x: 328, y: 312, w: 30, h: 88, footprint: { w: 18, h: 14 } },
            { kind: 'street_lamp', x: 472, y: 312, w: 30, h: 88, footprint: { w: 18, h: 14 }, flip: true },

            { kind: 'vending_machine', x: 725, y: 246, w: 42, h: 72, footprint: { w: 32, h: 16 } },
            { kind: 'holo_sign', x: 120, y: 152, w: 48, h: 78, footprint: { w: 30, h: 12 }, solid: false },
            { kind: 'holo_sign', x: 680, y: 152, w: 48, h: 78, footprint: { w: 30, h: 12 }, solid: false, flip: true },
            { kind: 'holo_sign', x: 118, y: 338, w: 46, h: 74, footprint: { w: 28, h: 12 }, solid: false },
            { kind: 'holo_sign', x: 682, y: 338, w: 46, h: 74, footprint: { w: 28, h: 12 }, solid: false, flip: true }
        ]
    },

    shopping_street_south: {
        image: 'assets/maps/shopping_street_south_clean_v1.png',
        exits: [
            { x: 375, y: 15,  width: 52, height: 52, to: 'shopping_street_north', direction: 'north', spawnX: 400, spawnY: 365 },
            { x: 735, y: 214, width: 46, height: 92, to: 'residential_street', direction: 'east', spawnX: 85, spawnY: 235 },
            { x: 1,   y: 190, width: 60, height: 92, to: 'black_market_entrance', direction: 'west', spawnX: 700, spawnY: 200, visible: false, autoEnter: true },
            { x: 156, y: 125, width: 62, height: 58, to: 'shop_inn', direction: 'north', spawnX: 400, spawnY: 380, visible: false, autoEnter: true },
            { x: 579, y: 128, width: 76, height: 62, to: 'shop_guild', direction: 'north', spawnX: 400, spawnY: 380, visible: false, autoEnter: true },
            { x: 365, y: 350, width: 70, height: 62, to: 'shop_bank', direction: 'north', spawnX: 400, spawnY: 380, visible: false, autoEnter: true }
        ],
        objects: [
            { kind: 'solid_wall', x: 160, y: 180, footprint: { w: 320, h: 180 } },
            { kind: 'solid_wall', x: 620, y: 190, footprint: { w: 260, h: 190 } },
            { kind: 'solid_wall', x: 400, y: 450, footprint: { w: 230, h: 112 } },
            { kind: 'solid_wall', x: 36,  y: 450, footprint: { w: 72,  h: 450 } },
            { kind: 'solid_wall', x: 772, y: 450, footprint: { w: 56,  h: 450 } },

            { kind: 'street_planter', x: 288, y: 108, w: 86, h: 68, footprint: { w: 78, h: 18 } },
            { kind: 'street_planter', x: 472, y: 108, w: 86, h: 68, footprint: { w: 78, h: 18 }, flip: true },
            { kind: 'residential_planter', x: 292, y: 336, w: 78, h: 46, footprint: { w: 70, h: 16 } },
            { kind: 'residential_planter', x: 508, y: 336, w: 78, h: 46, footprint: { w: 70, h: 16 }, flip: true },

            { kind: 'street_lamp', x: 300, y: 180, w: 28, h: 82, footprint: { w: 18, h: 14 } },
            { kind: 'street_lamp', x: 500, y: 180, w: 28, h: 82, footprint: { w: 18, h: 14 }, flip: true },
            { kind: 'street_lamp', x: 300, y: 320, w: 28, h: 82, footprint: { w: 18, h: 14 } },
            { kind: 'street_lamp', x: 500, y: 320, w: 28, h: 82, footprint: { w: 18, h: 14 }, flip: true },

            { kind: 'inn_sign', x: 112, y: 164, w: 44, h: 76, footprint: { w: 26, h: 12 }, solid: false },
            { kind: 'guild_board', x: 660, y: 190, w: 86, h: 70, footprint: { w: 74, h: 16 } },
            { kind: 'bank_terminal', x: 448, y: 390, w: 42, h: 66, footprint: { w: 30, h: 16 } },
            { kind: 'black_market_gate', x: 68, y: 250, w: 84, h: 76, footprint: { w: 74, h: 18 }, solid: false },
            { kind: 'city_bench', x: 397, y: 238, w: 94, h: 46, footprint: { w: 86, h: 18 } },
            { kind: 'vending_machine', x: 708, y: 330, w: 38, h: 66, footprint: { w: 30, h: 14 } },
            { kind: 'holo_sign', x: 720, y: 208, w: 44, h: 72, footprint: { w: 28, h: 12 }, solid: false, flip: true }
        ]
    },

    residential_street: {
        image: 'assets/maps/residential_street_clean_v1.png',
        exits: [
            { x: 1, y: 188, width: 46, height: 70, to: 'shopping_street_south', direction: 'west', spawnX: 720, spawnY: 250 }
        ],
        objects: [
            { kind: 'solid_wall', x: 400, y: 154, footprint: { w: 800, h: 154 } },
            { kind: 'solid_wall', x: 400, y: 450, footprint: { w: 800, h: 158 } },
            { kind: 'solid_wall', x: 16,  y: 450, footprint: { w: 32,  h: 450 } },
            { kind: 'solid_wall', x: 784, y: 450, footprint: { w: 32,  h: 450 } },

            { kind: 'residential_planter', x: 220, y: 170, w: 74, h: 44, footprint: { w: 66, h: 16 } },
            { kind: 'residential_planter', x: 584, y: 170, w: 74, h: 44, footprint: { w: 66, h: 16 }, flip: true },
            { kind: 'residential_planter', x: 176, y: 316, w: 78, h: 46, footprint: { w: 70, h: 16 } },
            { kind: 'residential_planter', x: 610, y: 316, w: 78, h: 46, footprint: { w: 70, h: 16 }, flip: true },

            { kind: 'street_lamp', x: 110, y: 186, w: 26, h: 78, footprint: { w: 16, h: 12 } },
            { kind: 'street_lamp', x: 690, y: 186, w: 26, h: 78, footprint: { w: 16, h: 12 }, flip: true },
            { kind: 'street_lamp', x: 110, y: 304, w: 26, h: 78, footprint: { w: 16, h: 12 } },
            { kind: 'street_lamp', x: 690, y: 304, w: 26, h: 78, footprint: { w: 16, h: 12 }, flip: true },

            { kind: 'city_bench', x: 300, y: 308, w: 88, h: 44, footprint: { w: 80, h: 16 } },
            { kind: 'city_bench', x: 500, y: 166, w: 88, h: 44, footprint: { w: 80, h: 16 }, flip: true },
            { kind: 'vending_machine', x: 742, y: 300, w: 36, h: 64, footprint: { w: 28, h: 14 } }
        ]
    }
};
