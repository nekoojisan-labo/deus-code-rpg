// ==========================================
// Object Layer Map Data
// ==========================================
// Exits regenerated from the ORIGINAL source graph (correct to/direction/spawn) with
// geometry fitted to clean-bg openings. Source layout is consistent; Codec's earlier
// hand-authored exits had swapped directions (e.g. plaza north/west). Shop autoEnter
// doors keep source position + visible:false.

// 2026-06-10: 失われていた入口3つを復元 — subway左上シャッター→deep_tunnel(autoEnter)、
// 鳥居→shrine_inner(接触・「本殿へ」)、和風家屋の門→house_1(autoEnter)。
// bme→sss 到着スポーンを闇市ドア横(85,340)に修正。
window.MAP_OBJECTS = {
  "shinjuku_center_plaza": {
    "image": "assets/maps/shinjuku_center_plaza_clean_v1.png",
    "exits": [
      {
        "x": 350,
        "y": 0,
        "width": 102,
        "height": 100,
        "to": "shrine_south_gate",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 365
      },
      {
        "x": 328,
        "y": 400,
        "width": 144,
        "height": 50,
        "to": "shopping_street_north",
        "direction": "south",
        "spawnX": 400,
        "spawnY": 85
      },
      {
        "x": 750,
        "y": 176,
        "width": 50,
        "height": 146,
        "to": "tokyo_gov_approach",
        "direction": "east",
        "spawnX": 50,
        "spawnY": 220
      },
      {
        "x": 0,
        "y": 176,
        "width": 50,
        "height": 146,
        "to": "shinjuku_station_gate",
        "direction": "west",
        "spawnX": 715,
        "spawnY": 235
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 174,
        "y": 118,
        "footprint": {
          "w": 348,
          "h": 118
        }
      },
      {
        "kind": "solid_wall",
        "x": 626,
        "y": 118,
        "footprint": {
          "w": 348,
          "h": 118
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 84,
        "footprint": {
          "w": 150,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 184,
        "y": 450,
        "footprint": {
          "w": 284,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 616,
        "y": 450,
        "footprint": {
          "w": 284,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 82,
        "y": 174,
        "footprint": {
          "w": 164,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 82,
        "y": 450,
        "footprint": {
          "w": 164,
          "h": 126
        }
      },
      {
        "kind": "solid_wall",
        "x": 718,
        "y": 174,
        "footprint": {
          "w": 164,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 718,
        "y": 450,
        "footprint": {
          "w": 164,
          "h": 126
        }
      },
      {
        "kind": "street_planter",
        "x": 286,
        "y": 140,
        "w": 90,
        "h": 68,
        "footprint": {
          "w": 80,
          "h": 18
        }
      },
      {
        "kind": "street_planter",
        "x": 514,
        "y": 140,
        "w": 90,
        "h": 68,
        "footprint": {
          "w": 80,
          "h": 18
        },
        "flip": true
      },
      {
        "kind": "street_planter",
        "x": 286,
        "y": 344,
        "w": 92,
        "h": 70,
        "footprint": {
          "w": 82,
          "h": 18
        }
      },
      {
        "kind": "street_planter",
        "x": 514,
        "y": 344,
        "w": 92,
        "h": 70,
        "footprint": {
          "w": 82,
          "h": 18
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 176,
        "y": 204,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 624,
        "y": 204,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "city_bench",
        "x": 210,
        "y": 270,
        "w": 92,
        "h": 44,
        "footprint": {
          "w": 84,
          "h": 16
        }
      },
      {
        "kind": "city_bench",
        "x": 590,
        "y": 270,
        "w": 92,
        "h": 44,
        "footprint": {
          "w": 84,
          "h": 16
        },
        "flip": true
      }
    ]
  },
  "shopping_street_north": {
    "image": "assets/maps/shopping_street_north_clean_v1.png",
    "objects": [
      {
        "kind": "solid_wall",
        "x": 160,
        "y": 112,
        "footprint": {
          "w": 320,
          "h": 112
        }
      },
      {
        "kind": "solid_wall",
        "x": 640,
        "y": 112,
        "footprint": {
          "w": 320,
          "h": 112
        }
      },
      {
        "kind": "solid_wall",
        "x": 130,
        "y": 370,
        "footprint": {
          "w": 260,
          "h": 160
        }
      },
      {
        "kind": "solid_wall",
        "x": 670,
        "y": 370,
        "footprint": {
          "w": 260,
          "h": 160
        }
      },
      {
        "kind": "solid_wall",
        "x": 145,
        "y": 450,
        "footprint": {
          "w": 290,
          "h": 54
        }
      },
      {
        "kind": "solid_wall",
        "x": 655,
        "y": 450,
        "footprint": {
          "w": 290,
          "h": 54
        }
      },
      {
        "kind": "solid_wall",
        "x": 16,
        "y": 450,
        "footprint": {
          "w": 32,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 784,
        "y": 450,
        "footprint": {
          "w": 32,
          "h": 450
        }
      },
      {
        "kind": "street_planter",
        "x": 198,
        "y": 128,
        "w": 104,
        "h": 84,
        "footprint": {
          "w": 92,
          "h": 24
        }
      },
      {
        "kind": "street_planter",
        "x": 602,
        "y": 128,
        "w": 104,
        "h": 84,
        "footprint": {
          "w": 92,
          "h": 24
        },
        "flip": true
      },
      {
        "kind": "street_planter",
        "x": 210,
        "y": 348,
        "w": 98,
        "h": 78,
        "footprint": {
          "w": 88,
          "h": 22
        }
      },
      {
        "kind": "street_planter",
        "x": 590,
        "y": 348,
        "w": 98,
        "h": 78,
        "footprint": {
          "w": 88,
          "h": 22
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 328,
        "y": 170,
        "w": 30,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 14
        }
      },
      {
        "kind": "street_lamp",
        "x": 472,
        "y": 170,
        "w": 30,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 14
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 328,
        "y": 312,
        "w": 30,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 14
        }
      },
      {
        "kind": "street_lamp",
        "x": 472,
        "y": 312,
        "w": 30,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 14
        },
        "flip": true
      },
      {
        "kind": "vending_machine",
        "x": 725,
        "y": 246,
        "w": 42,
        "h": 72,
        "footprint": {
          "w": 32,
          "h": 16
        }
      },
      {
        "kind": "holo_sign",
        "x": 120,
        "y": 152,
        "w": 48,
        "h": 78,
        "footprint": {
          "w": 30,
          "h": 12
        },
        "solid": false
      },
      {
        "kind": "holo_sign",
        "x": 680,
        "y": 152,
        "w": 48,
        "h": 78,
        "footprint": {
          "w": 30,
          "h": 12
        },
        "solid": false,
        "flip": true
      },
      {
        "kind": "holo_sign",
        "x": 118,
        "y": 338,
        "w": 46,
        "h": 74,
        "footprint": {
          "w": 28,
          "h": 12
        },
        "solid": false
      },
      {
        "kind": "holo_sign",
        "x": 682,
        "y": 338,
        "w": 46,
        "h": 74,
        "footprint": {
          "w": 28,
          "h": 12
        },
        "solid": false,
        "flip": true
      }
    ],
    "exits": [
      {
        "x": 322,
        "y": 0,
        "width": 156,
        "height": 50,
        "to": "shinjuku_center_plaza",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 365
      },
      {
        "x": 291,
        "y": 400,
        "width": 218,
        "height": 50,
        "to": "shopping_street_south",
        "direction": "south",
        "spawnX": 400,
        "spawnY": 85
      },
      {
        "x": 99,
        "y": 147,
        "width": 40,
        "height": 37,
        "to": "shop_weapon",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 660,
        "y": 149,
        "width": 35,
        "height": 41,
        "to": "shop_magic",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 104,
        "y": 342,
        "width": 31,
        "height": 28,
        "to": "shop_armor",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 656,
        "y": 352,
        "width": 34,
        "height": 27,
        "to": "shop_item",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      }
    ]
  },
  "shinjuku_station_gate": {
    "image": "assets/maps/shinjuku_station_gate_clean_v1.png",
    "exits": [
      {
        "x": 680,
        "y": 211,
        "width": 120,
        "height": 122,
        "to": "shinjuku_center_plaza",
        "direction": "east",
        "spawnX": 85,
        "spawnY": 235
      },
      {
        "x": 577,
        "y": 330,
        "width": 103,
        "height": 120,
        "to": "subway_concourse_a",
        "direction": "south",
        "spawnX": 670,
        "spawnY": 130
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 126,
        "footprint": {
          "w": 800,
          "h": 126
        }
      },
      {
        "kind": "solid_wall",
        "x": 104,
        "y": 210,
        "footprint": {
          "w": 208,
          "h": 86
        }
      },
      {
        "kind": "solid_wall",
        "x": 696,
        "y": 210,
        "footprint": {
          "w": 208,
          "h": 86
        }
      },
      {
        "kind": "solid_wall",
        "x": 8,
        "y": 450,
        "footprint": {
          "w": 16,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 792,
        "y": 450,
        "footprint": {
          "w": 16,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 172,
        "y": 450,
        "footprint": {
          "w": 344,
          "h": 116
        }
      },
      {
        "kind": "solid_wall",
        "x": 510,
        "y": 450,
        "footprint": {
          "w": 130,
          "h": 116
        }
      },
      {
        "kind": "solid_wall",
        "x": 742,
        "y": 450,
        "footprint": {
          "w": 116,
          "h": 116
        }
      },
      {
        "kind": "solid_wall",
        "x": 274,
        "y": 360,
        "footprint": {
          "w": 134,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 456,
        "y": 360,
        "footprint": {
          "w": 104,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 690,
        "y": 280,
        "footprint": {
          "w": 128,
          "h": 44
        }
      },
      {
        "kind": "street_lamp",
        "x": 338,
        "y": 166,
        "w": 26,
        "h": 82,
        "footprint": {
          "w": 16,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 462,
        "y": 166,
        "w": 26,
        "h": 82,
        "footprint": {
          "w": 16,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "vending_machine",
        "x": 164,
        "y": 178,
        "w": 38,
        "h": 66,
        "footprint": {
          "w": 30,
          "h": 14
        }
      }
    ]
  },
  "subway_concourse_a": {
    "image": "assets/maps/subway_concourse_a_clean_v1.png",
    "exits": [
      {
        "x": 341,
        "y": 0,
        "width": 118,
        "height": 50,
        "to": "shinjuku_station_gate",
        "direction": "north",
        "spawnX": 550,
        "spawnY": 380
      },
      {
        "x": 172,
        "y": 76,
        "width": 56,
        "height": 42,
        "to": "deep_tunnel",
        "direction": "north",
        "spawnX": 715,
        "spawnY": 300,
        "autoEnter": true,
        "visible": false
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 170,
        "y": 118,
        "footprint": {
          "w": 340,
          "h": 118
        }
      },
      {
        "kind": "solid_wall",
        "x": 630,
        "y": 118,
        "footprint": {
          "w": 340,
          "h": 118
        }
      },
      {
        "kind": "solid_wall",
        "x": 38,
        "y": 450,
        "footprint": {
          "w": 76,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 762,
        "y": 450,
        "footprint": {
          "w": 76,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 450,
        "footprint": {
          "w": 800,
          "h": 70
        }
      },
      {
        "kind": "solid_wall",
        "x": 148,
        "y": 244,
        "footprint": {
          "w": 72,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 652,
        "y": 244,
        "footprint": {
          "w": 72,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 236,
        "y": 346,
        "footprint": {
          "w": 72,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 564,
        "y": 346,
        "footprint": {
          "w": 72,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 126,
        "y": 368,
        "footprint": {
          "w": 104,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 674,
        "y": 368,
        "footprint": {
          "w": 104,
          "h": 34
        }
      },
      {
        "kind": "street_lamp",
        "x": 262,
        "y": 174,
        "w": 26,
        "h": 82,
        "footprint": {
          "w": 16,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 538,
        "y": 174,
        "w": 26,
        "h": 82,
        "footprint": {
          "w": 16,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "vending_machine",
        "x": 96,
        "y": 360,
        "w": 36,
        "h": 62,
        "footprint": {
          "w": 28,
          "h": 14
        }
      }
    ]
  },
  "shopping_street_south": {
    "image": "assets/maps/shopping_street_south_clean_v1.png",
    "exits": [
      {
        "x": 321,
        "y": 0,
        "width": 168,
        "height": 50,
        "to": "shopping_street_north",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 365
      },
      {
        "x": 728,
        "y": 191,
        "width": 72,
        "height": 240,
        "to": "residential_street",
        "direction": "east",
        "spawnX": 85,
        "spawnY": 235
      },
      {
        "x": 24,
        "y": 296,
        "width": 48,
        "height": 96,
        "to": "black_market_entrance",
        "direction": "west",
        "spawnX": 700,
        "spawnY": 200,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 163,
        "y": 134,
        "width": 38,
        "height": 54,
        "to": "shop_inn",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 594,
        "y": 145,
        "width": 43,
        "height": 48,
        "to": "shop_guild",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      },
      {
        "x": 189,
        "y": 366,
        "width": 27,
        "height": 48,
        "to": "shop_bank",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 160,
        "y": 180,
        "footprint": {
          "w": 320,
          "h": 180
        }
      },
      {
        "kind": "solid_wall",
        "x": 620,
        "y": 190,
        "footprint": {
          "w": 260,
          "h": 190
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 450,
        "footprint": {
          "w": 230,
          "h": 112
        }
      },
      {
        "kind": "solid_wall",
        "x": 36,
        "y": 450,
        "footprint": {
          "w": 72,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 772,
        "y": 450,
        "footprint": {
          "w": 56,
          "h": 450
        }
      },
      {
        "kind": "street_planter",
        "x": 288,
        "y": 108,
        "w": 86,
        "h": 68,
        "footprint": {
          "w": 78,
          "h": 18
        }
      },
      {
        "kind": "street_planter",
        "x": 472,
        "y": 108,
        "w": 86,
        "h": 68,
        "footprint": {
          "w": 78,
          "h": 18
        },
        "flip": true
      },
      {
        "kind": "residential_planter",
        "x": 292,
        "y": 336,
        "w": 78,
        "h": 46,
        "footprint": {
          "w": 70,
          "h": 16
        }
      },
      {
        "kind": "residential_planter",
        "x": 508,
        "y": 336,
        "w": 78,
        "h": 46,
        "footprint": {
          "w": 70,
          "h": 16
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 300,
        "y": 180,
        "w": 28,
        "h": 82,
        "footprint": {
          "w": 18,
          "h": 14
        }
      },
      {
        "kind": "street_lamp",
        "x": 500,
        "y": 180,
        "w": 28,
        "h": 82,
        "footprint": {
          "w": 18,
          "h": 14
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 300,
        "y": 320,
        "w": 28,
        "h": 82,
        "footprint": {
          "w": 18,
          "h": 14
        }
      },
      {
        "kind": "street_lamp",
        "x": 500,
        "y": 320,
        "w": 28,
        "h": 82,
        "footprint": {
          "w": 18,
          "h": 14
        },
        "flip": true
      },
      {
        "kind": "inn_sign",
        "x": 112,
        "y": 164,
        "w": 44,
        "h": 76,
        "footprint": {
          "w": 26,
          "h": 12
        },
        "solid": false
      },
      {
        "kind": "guild_board",
        "x": 660,
        "y": 190,
        "w": 86,
        "h": 70,
        "footprint": {
          "w": 74,
          "h": 16
        }
      },
      {
        "kind": "bank_terminal",
        "x": 448,
        "y": 390,
        "w": 42,
        "h": 66,
        "footprint": {
          "w": 30,
          "h": 16
        }
      },
      {
        "kind": "black_market_gate",
        "x": 68,
        "y": 250,
        "w": 84,
        "h": 76,
        "footprint": {
          "w": 74,
          "h": 18
        },
        "solid": false
      },
      {
        "kind": "city_bench",
        "x": 397,
        "y": 238,
        "w": 94,
        "h": 46,
        "footprint": {
          "w": 86,
          "h": 18
        }
      },
      {
        "kind": "vending_machine",
        "x": 708,
        "y": 330,
        "w": 38,
        "h": 66,
        "footprint": {
          "w": 30,
          "h": 14
        }
      },
      {
        "kind": "holo_sign",
        "x": 720,
        "y": 208,
        "w": 44,
        "h": 72,
        "footprint": {
          "w": 28,
          "h": 12
        },
        "solid": false,
        "flip": true
      }
    ]
  },
  "residential_street": {
    "image": "assets/maps/residential_street_clean_v1.png",
    "exits": [
      {
        "x": 0,
        "y": 155,
        "width": 50,
        "height": 136,
        "to": "shopping_street_south",
        "direction": "west",
        "spawnX": 685,
        "spawnY": 290
      },
      {
        "x": 468,
        "y": 108,
        "width": 64,
        "height": 62,
        "to": "house_1",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 370,
        "autoEnter": true,
        "visible": false
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 154,
        "footprint": {
          "w": 800,
          "h": 154
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 450,
        "footprint": {
          "w": 800,
          "h": 158
        }
      },
      {
        "kind": "solid_wall",
        "x": 16,
        "y": 450,
        "footprint": {
          "w": 32,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 784,
        "y": 450,
        "footprint": {
          "w": 32,
          "h": 450
        }
      },
      {
        "kind": "residential_planter",
        "x": 220,
        "y": 170,
        "w": 74,
        "h": 44,
        "footprint": {
          "w": 66,
          "h": 16
        }
      },
      {
        "kind": "residential_planter",
        "x": 584,
        "y": 170,
        "w": 74,
        "h": 44,
        "footprint": {
          "w": 66,
          "h": 16
        },
        "flip": true
      },
      {
        "kind": "residential_planter",
        "x": 176,
        "y": 316,
        "w": 78,
        "h": 46,
        "footprint": {
          "w": 70,
          "h": 16
        }
      },
      {
        "kind": "residential_planter",
        "x": 610,
        "y": 316,
        "w": 78,
        "h": 46,
        "footprint": {
          "w": 70,
          "h": 16
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 110,
        "y": 186,
        "w": 26,
        "h": 78,
        "footprint": {
          "w": 16,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 690,
        "y": 186,
        "w": 26,
        "h": 78,
        "footprint": {
          "w": 16,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 110,
        "y": 304,
        "w": 26,
        "h": 78,
        "footprint": {
          "w": 16,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 690,
        "y": 304,
        "w": 26,
        "h": 78,
        "footprint": {
          "w": 16,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "city_bench",
        "x": 300,
        "y": 308,
        "w": 88,
        "h": 44,
        "footprint": {
          "w": 80,
          "h": 16
        }
      },
      {
        "kind": "city_bench",
        "x": 500,
        "y": 166,
        "w": 88,
        "h": 44,
        "footprint": {
          "w": 80,
          "h": 16
        },
        "flip": true
      },
      {
        "kind": "vending_machine",
        "x": 742,
        "y": 300,
        "w": 36,
        "h": 64,
        "footprint": {
          "w": 28,
          "h": 14
        }
      }
    ]
  },
  "black_market_entrance": {
    "image": "assets/maps/black_market_entrance_clean_v1.png",
    "exits": [
      {
        "x": 732,
        "y": 78,
        "width": 68,
        "height": 240,
        "to": "shopping_street_south",
        "direction": "east",
        "spawnX": 85,
        "spawnY": 340
      },
      {
        "x": 432,
        "y": 234,
        "width": 56,
        "height": 54,
        "to": "shop_black_market",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380,
        "autoEnter": true,
        "visible": false
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 68,
        "y": 450,
        "footprint": {
          "w": 136,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 184,
        "y": 148,
        "footprint": {
          "w": 262,
          "h": 148
        }
      },
      {
        "kind": "solid_wall",
        "x": 548,
        "y": 148,
        "footprint": {
          "w": 210,
          "h": 148
        }
      },
      {
        "kind": "solid_wall",
        "x": 774,
        "y": 450,
        "footprint": {
          "w": 52,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 174,
        "y": 450,
        "footprint": {
          "w": 348,
          "h": 172
        }
      },
      {
        "kind": "solid_wall",
        "x": 604,
        "y": 450,
        "footprint": {
          "w": 250,
          "h": 172
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 450,
        "footprint": {
          "w": 150,
          "h": 64
        }
      },
      {
        "kind": "black_market_gate",
        "x": 402,
        "y": 176,
        "w": 102,
        "h": 88,
        "footprint": {
          "w": 86,
          "h": 18
        },
        "solid": false
      },
      {
        "kind": "holo_sign",
        "x": 235,
        "y": 170,
        "w": 52,
        "h": 78,
        "footprint": {
          "w": 34,
          "h": 12
        },
        "solid": false
      },
      {
        "kind": "holo_sign",
        "x": 515,
        "y": 168,
        "w": 50,
        "h": 76,
        "footprint": {
          "w": 32,
          "h": 12
        },
        "solid": false,
        "flip": true
      },
      {
        "kind": "vending_machine",
        "x": 488,
        "y": 188,
        "w": 42,
        "h": 72,
        "footprint": {
          "w": 32,
          "h": 14
        }
      },
      {
        "kind": "vending_machine",
        "x": 538,
        "y": 188,
        "w": 42,
        "h": 72,
        "footprint": {
          "w": 32,
          "h": 14
        }
      },
      {
        "kind": "street_lamp",
        "x": 350,
        "y": 182,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 456,
        "y": 182,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 654,
        "y": 170,
        "w": 28,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 704,
        "y": 264,
        "w": 28,
        "h": 88,
        "footprint": {
          "w": 18,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 366,
        "y": 382,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 448,
        "y": 382,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        },
        "flip": true
      },
      {
        "kind": "street_planter",
        "x": 626,
        "y": 184,
        "w": 82,
        "h": 58,
        "footprint": {
          "w": 72,
          "h": 16
        }
      },
      {
        "kind": "street_planter",
        "x": 712,
        "y": 344,
        "w": 82,
        "h": 58,
        "footprint": {
          "w": 72,
          "h": 16
        },
        "flip": true
      },
      {
        "kind": "city_bench",
        "x": 286,
        "y": 284,
        "w": 92,
        "h": 44,
        "footprint": {
          "w": 84,
          "h": 16
        }
      },
      {
        "kind": "city_bench",
        "x": 526,
        "y": 284,
        "w": 92,
        "h": 44,
        "footprint": {
          "w": 84,
          "h": 16
        },
        "flip": true
      }
    ]
  },
  "shrine_south_gate": {
    "image": "assets/maps/shrine_south_gate_clean_v1.png",
    "exits": [
      {
        "x": 284,
        "y": 400,
        "width": 240,
        "height": 50,
        "to": "shinjuku_center_plaza",
        "direction": "south",
        "spawnX": 400,
        "spawnY": 130
      },
      {
        "x": 680,
        "y": 133,
        "width": 120,
        "height": 116,
        "to": "biodome_gate",
        "direction": "east",
        "spawnX": 85,
        "spawnY": 235
      },
      {
        "x": 356,
        "y": 108,
        "width": 88,
        "height": 48,
        "to": "shrine_inner",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 370,
        "label": "本殿へ"
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 82,
        "footprint": {
          "w": 800,
          "h": 96
        }
      },
      {
        "kind": "solid_wall",
        "x": 136,
        "y": 184,
        "footprint": {
          "w": 272,
          "h": 170
        }
      },
      {
        "kind": "solid_wall",
        "x": 646,
        "y": 132,
        "footprint": {
          "w": 308,
          "h": 116
        }
      },
      {
        "kind": "solid_wall",
        "x": 96,
        "y": 450,
        "footprint": {
          "w": 192,
          "h": 128
        }
      },
      {
        "kind": "solid_wall",
        "x": 704,
        "y": 450,
        "footprint": {
          "w": 192,
          "h": 128
        }
      },
      {
        "kind": "solid_wall",
        "x": 6,
        "y": 450,
        "footprint": {
          "w": 12,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 794,
        "y": 450,
        "footprint": {
          "w": 12,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 146,
        "footprint": {
          "w": 158,
          "h": 34
        }
      },
      {
        "kind": "solid_wall",
        "x": 252,
        "y": 204,
        "footprint": {
          "w": 126,
          "h": 38
        }
      },
      {
        "kind": "solid_wall",
        "x": 548,
        "y": 204,
        "footprint": {
          "w": 126,
          "h": 38
        }
      },
      {
        "kind": "solid_wall",
        "x": 250,
        "y": 352,
        "footprint": {
          "w": 164,
          "h": 38
        }
      },
      {
        "kind": "solid_wall",
        "x": 550,
        "y": 352,
        "footprint": {
          "w": 164,
          "h": 38
        }
      },
      {
        "kind": "solid_wall",
        "x": 720,
        "y": 292,
        "footprint": {
          "w": 132,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 80,
        "y": 252,
        "footprint": {
          "w": 112,
          "h": 52
        }
      }
    ]
  },
  "biodome_gate": {
    "image": "assets/maps/biodome_gate_clean_v1.png",
    "exits": [
      {
        "x": 0,
        "y": 131,
        "width": 120,
        "height": 164,
        "to": "shrine_south_gate",
        "direction": "west",
        "spawnX": 700,
        "spawnY": 195
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 238,
        "y": 132,
        "footprint": {
          "w": 270,
          "h": 132
        }
      },
      {
        "kind": "solid_wall",
        "x": 562,
        "y": 132,
        "footprint": {
          "w": 270,
          "h": 132
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 148,
        "footprint": {
          "w": 148,
          "h": 50
        }
      },
      {
        "kind": "solid_wall",
        "x": 18,
        "y": 130,
        "footprint": {
          "w": 36,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 18,
        "y": 450,
        "footprint": {
          "w": 36,
          "h": 154
        }
      },
      {
        "kind": "solid_wall",
        "x": 790,
        "y": 450,
        "footprint": {
          "w": 20,
          "h": 450
        }
      },
      {
        "kind": "solid_wall",
        "x": 214,
        "y": 450,
        "footprint": {
          "w": 274,
          "h": 128
        }
      },
      {
        "kind": "solid_wall",
        "x": 586,
        "y": 450,
        "footprint": {
          "w": 274,
          "h": 128
        }
      },
      {
        "kind": "solid_wall",
        "x": 232,
        "y": 218,
        "footprint": {
          "w": 232,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 568,
        "y": 218,
        "footprint": {
          "w": 232,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 250,
        "y": 332,
        "footprint": {
          "w": 220,
          "h": 42
        }
      },
      {
        "kind": "solid_wall",
        "x": 550,
        "y": 332,
        "footprint": {
          "w": 220,
          "h": 42
        }
      }
    ]
  },
  "tokyo_gov_approach": {
    "image": "assets/maps/tokyo_gov_approach_clean_v1.png",
    "exits": [
      {
        "x": 0,
        "y": 131,
        "width": 50,
        "height": 180,
        "to": "shinjuku_center_plaza",
        "direction": "west",
        "spawnX": 660,
        "spawnY": 240
      },
      {
        "x": 302,
        "y": 0,
        "width": 196,
        "height": 80,
        "to": "tokyo_gov_floor2",
        "direction": "north",
        "spawnX": 400,
        "spawnY": 380
      }
    ],
    "objects": [
      {
        "kind": "solid_wall",
        "x": 150,
        "y": 130,
        "footprint": {
          "w": 300,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 650,
        "y": 130,
        "footprint": {
          "w": 300,
          "h": 130
        }
      },
      {
        "kind": "solid_wall",
        "x": 302,
        "y": 142,
        "footprint": {
          "w": 116,
          "h": 72
        }
      },
      {
        "kind": "solid_wall",
        "x": 498,
        "y": 142,
        "footprint": {
          "w": 116,
          "h": 72
        }
      },
      {
        "kind": "solid_wall",
        "x": 400,
        "y": 64,
        "footprint": {
          "w": 160,
          "h": 46
        }
      },
      {
        "kind": "solid_wall",
        "x": 88,
        "y": 450,
        "footprint": {
          "w": 176,
          "h": 138
        }
      },
      {
        "kind": "solid_wall",
        "x": 712,
        "y": 450,
        "footprint": {
          "w": 176,
          "h": 138
        }
      },
      {
        "kind": "solid_wall",
        "x": 212,
        "y": 450,
        "footprint": {
          "w": 250,
          "h": 92
        }
      },
      {
        "kind": "solid_wall",
        "x": 588,
        "y": 450,
        "footprint": {
          "w": 250,
          "h": 92
        }
      },
      {
        "kind": "solid_wall",
        "x": 790,
        "y": 450,
        "footprint": {
          "w": 20,
          "h": 450
        }
      },
      {
        "kind": "street_planter",
        "x": 240,
        "y": 170,
        "w": 86,
        "h": 66,
        "footprint": {
          "w": 76,
          "h": 18
        }
      },
      {
        "kind": "street_planter",
        "x": 560,
        "y": 170,
        "w": 86,
        "h": 66,
        "footprint": {
          "w": 76,
          "h": 18
        },
        "flip": true
      },
      {
        "kind": "street_lamp",
        "x": 318,
        "y": 238,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        }
      },
      {
        "kind": "street_lamp",
        "x": 482,
        "y": 238,
        "w": 28,
        "h": 84,
        "footprint": {
          "w": 18,
          "h": 12
        },
        "flip": true
      }
    ]
  }
};
