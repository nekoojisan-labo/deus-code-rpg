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
// 2026-06-10: 壁footprintを刷新済みclean_v1背景の絵に合わせて全10マップ再作成
// （並列エージェント艦隊・レンダリング照合・verify_map PASS済。家具はw/h/flip/solidオーバーライド付き）。
// 2026-07-12: deep_tunnel / deep_tunnel_boss を object-layer 化。表示アート(clean_v1)と衝突を一致させるため
//   subway_concourse_a の objects を複製し、下中央アルコーブ(345..455)を回廊として開口（南出口へ接続）。
//   deep_tunnel の戻り口は絵に実在する左上シャッター(172,76)＝concourse側の扉と同位置に移設。
window.MAP_OBJECTS = {
 "shinjuku_center_plaza": {
  "image": "assets/maps/shinjuku_center_plaza_clean_v1.png",
  "exits": [
   {
    "x": 370,
    "y": 60,
    "width": 64,
    "height": 40,
    "to": "shrine_south_gate",
    "direction": "north",
    "spawnX": 404,
    "spawnY": 392,
    "requiredFlag": "chapter1_complete",
    "lockedMsg": "参道の奥は霧が深い…まだ進む時ではないようだ。",
    "spawnFace": "up"
   },
   {
    "x": 372,
    "y": 400,
    "width": 62,
    "height": 50,
    "to": "shopping_street_north",
    "direction": "south",
    "spawnX": 401,
    "spawnY": 58,
    "spawnFace": "down"
   },
   {
    "x": 750,
    "y": 215,
    "width": 50,
    "height": 28,
    "to": "tokyo_gov_approach",
    "direction": "east",
    "spawnX": 68,
    "spawnY": 194,
    "requiredFlag": "yamiJoined",
    "lockedMsg": "都庁の封鎖は固い。まず闇市でヤミを仲間にしてからでなければ近づけない。",
    "spawnFace": "right"
   },
   {
    "x": 0,
    "y": 208,
    "width": 50,
    "height": 60,
    "to": "shinjuku_station_gate",
    "direction": "west",
    "spawnX": 672,
    "spawnY": 243,
    "spawnFace": "left"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 89,
    "y": 110,
    "footprint": {
     "w": 178,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 48,
    "y": 208,
    "footprint": {
     "w": 96,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 106,
    "y": 184,
    "footprint": {
     "w": 26,
     "h": 56
    }
   },
   {
    "kind": "solid_wall",
    "x": 150,
    "y": 188,
    "footprint": {
     "w": 128,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 190,
    "y": 122,
    "footprint": {
     "w": 94,
     "h": 84
    }
   },
   {
    "kind": "solid_wall",
    "x": 305,
    "y": 130,
    "footprint": {
     "w": 84,
     "h": 130
    }
   },
   {
    "kind": "solid_wall",
    "x": 403,
    "y": 90,
    "footprint": {
     "w": 130,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 500,
    "y": 130,
    "footprint": {
     "w": 90,
     "h": 130
    }
   },
   {
    "kind": "solid_wall",
    "x": 596,
    "y": 135,
    "footprint": {
     "w": 36,
     "h": 135
    }
   },
   {
    "kind": "solid_wall",
    "x": 706,
    "y": 140,
    "footprint": {
     "w": 188,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 733,
    "y": 200,
    "footprint": {
     "w": 134,
     "h": 60
    }
   },
   {
    "kind": "solid_wall",
    "x": 773,
    "y": 218,
    "footprint": {
     "w": 54,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 622,
    "y": 188,
    "footprint": {
     "w": 72,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 773,
    "y": 330,
    "footprint": {
     "w": 54,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 698,
    "y": 340,
    "footprint": {
     "w": 100,
     "h": 82
    }
   },
   {
    "kind": "solid_wall",
    "x": 619,
    "y": 288,
    "footprint": {
     "w": 78,
     "h": 22
    }
   },
   {
    "kind": "solid_wall",
    "x": 730,
    "y": 450,
    "footprint": {
     "w": 140,
     "h": 165
    }
   },
   {
    "kind": "solid_wall",
    "x": 567,
    "y": 350,
    "footprint": {
     "w": 66,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 518,
    "y": 450,
    "footprint": {
     "w": 168,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 305,
    "y": 450,
    "footprint": {
     "w": 134,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 228,
    "y": 358,
    "footprint": {
     "w": 68,
     "h": 34
    }
   },
   {
    "kind": "solid_wall",
    "x": 75,
    "y": 450,
    "footprint": {
     "w": 150,
     "h": 182
    }
   },
   {
    "kind": "solid_wall",
    "x": 98,
    "y": 300,
    "footprint": {
     "w": 94,
     "h": 54
    }
   },
   {
    "kind": "solid_wall",
    "x": 179,
    "y": 288,
    "footprint": {
     "w": 72,
     "h": 22
    }
   },
   {
    "kind": "solid_wall",
    "x": 161,
    "y": 396,
    "footprint": {
     "w": 22,
     "h": 74
    }
   },
   {
    "kind": "solid_wall",
    "x": 218,
    "y": 450,
    "footprint": {
     "w": 48,
     "h": 78
    }
   },
   {
    "kind": "street_planter",
    "x": 286,
    "y": 160,
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
    "y": 160,
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
    "x": 320,
    "y": 320,
    "w": 92,
    "h": 70,
    "footprint": {
     "w": 82,
     "h": 18
    }
   },
   {
    "kind": "street_planter",
    "x": 493,
    "y": 328,
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
    "x": 330,
    "y": 150,
    "w": 28,
    "h": 84,
    "footprint": {
     "w": 18,
     "h": 12
    }
   },
   {
    "kind": "street_lamp",
    "x": 470,
    "y": 150,
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
    "x": 300,
    "y": 260,
    "w": 92,
    "h": 44,
    "footprint": {
     "w": 84,
     "h": 16
    }
   },
   {
    "kind": "city_bench",
    "x": 500,
    "y": 260,
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
    "x": 48,
    "y": 128,
    "footprint": {
     "w": 96,
     "h": 128
    }
   },
   {
    "kind": "solid_wall",
    "x": 87,
    "y": 146,
    "footprint": {
     "w": 22,
     "h": 46
    }
   },
   {
    "kind": "solid_wall",
    "x": 136,
    "y": 146,
    "footprint": {
     "w": 80,
     "h": 146
    }
   },
   {
    "kind": "solid_wall",
    "x": 200,
    "y": 152,
    "footprint": {
     "w": 50,
     "h": 152
    }
   },
   {
    "kind": "solid_wall",
    "x": 278,
    "y": 42,
    "footprint": {
     "w": 104,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 343,
    "y": 52,
    "footprint": {
     "w": 36,
     "h": 52
    }
   },
   {
    "kind": "solid_wall",
    "x": 457,
    "y": 52,
    "footprint": {
     "w": 36,
     "h": 52
    }
   },
   {
    "kind": "solid_wall",
    "x": 523,
    "y": 42,
    "footprint": {
     "w": 106,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 600,
    "y": 152,
    "footprint": {
     "w": 52,
     "h": 152
    }
   },
   {
    "kind": "solid_wall",
    "x": 664,
    "y": 146,
    "footprint": {
     "w": 80,
     "h": 146
    }
   },
   {
    "kind": "solid_wall",
    "x": 752,
    "y": 148,
    "footprint": {
     "w": 96,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 266,
    "y": 143,
    "footprint": {
     "w": 18,
     "h": 43
    }
   },
   {
    "kind": "solid_wall",
    "x": 532,
    "y": 143,
    "footprint": {
     "w": 18,
     "h": 43
    }
   },
   {
    "kind": "solid_wall",
    "x": 48,
    "y": 350,
    "footprint": {
     "w": 96,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 110,
    "y": 350,
    "footprint": {
     "w": 28,
     "h": 134
    }
   },
   {
    "kind": "solid_wall",
    "x": 152,
    "y": 350,
    "footprint": {
     "w": 56,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 201,
    "y": 278,
    "footprint": {
     "w": 42,
     "h": 76
    }
   },
   {
    "kind": "solid_wall",
    "x": 193,
    "y": 350,
    "footprint": {
     "w": 32,
     "h": 75
    }
   },
   {
    "kind": "solid_wall",
    "x": 265,
    "y": 325,
    "footprint": {
     "w": 18,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 534,
    "y": 325,
    "footprint": {
     "w": 18,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 638,
    "y": 352,
    "footprint": {
     "w": 36,
     "h": 150
    }
   },
   {
    "kind": "solid_wall",
    "x": 670,
    "y": 352,
    "footprint": {
     "w": 28,
     "h": 139
    }
   },
   {
    "kind": "solid_wall",
    "x": 742,
    "y": 352,
    "footprint": {
     "w": 116,
     "h": 150
    }
   },
   {
    "kind": "solid_wall",
    "x": 593,
    "y": 278,
    "footprint": {
     "w": 46,
     "h": 76
    }
   },
   {
    "kind": "solid_wall",
    "x": 605,
    "y": 350,
    "footprint": {
     "w": 34,
     "h": 75
    }
   },
   {
    "kind": "solid_wall",
    "x": 166,
    "y": 450,
    "footprint": {
     "w": 332,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 344,
    "y": 450,
    "footprint": {
     "w": 26,
     "h": 72
    }
   },
   {
    "kind": "solid_wall",
    "x": 458,
    "y": 450,
    "footprint": {
     "w": 26,
     "h": 72
    }
   },
   {
    "kind": "solid_wall",
    "x": 634,
    "y": 450,
    "footprint": {
     "w": 332,
     "h": 50
    }
   },
   {
    "kind": "street_planter",
    "x": 270,
    "y": 95,
    "w": 104,
    "h": 84,
    "footprint": {
     "w": 92,
     "h": 24
    }
   },
   {
    "kind": "street_planter",
    "x": 530,
    "y": 95,
    "w": 104,
    "h": 84,
    "footprint": {
     "w": 92,
     "h": 24
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
    "x": 778,
    "y": 390,
    "w": 42,
    "h": 72,
    "footprint": {
     "w": 32,
     "h": 16
    }
   },
   {
    "kind": "holo_sign",
    "x": 78,
    "y": 185,
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
    "x": 722,
    "y": 185,
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
    "x": 160,
    "y": 362,
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
    "x": 640,
    "y": 362,
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
    "x": 361,
    "y": 0,
    "width": 78,
    "height": 50,
    "to": "shinjuku_center_plaza",
    "direction": "north",
    "spawnX": 403,
    "spawnY": 392,
    "spawnFace": "up"
   },
   {
    "x": 357,
    "y": 400,
    "width": 88,
    "height": 50,
    "to": "shopping_street_south",
    "direction": "south",
    "spawnX": 397,
    "spawnY": 58,
    "spawnFace": "down"
   },
   {
    "x": 115,
    "y": 87,
    "width": 40,
    "height": 37,
    "to": "shop_weapon",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 387,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   },
   {
    "x": 633,
    "y": 101,
    "width": 34,
    "height": 41,
    "to": "shop_magic",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   },
   {
    "x": 98,
    "y": 331,
    "width": 31,
    "height": 28,
    "to": "shop_armor",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   },
   {
    "x": 665,
    "y": 332,
    "width": 34,
    "height": 27,
    "to": "shop_item",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   }
  ]
 },
 "shinjuku_station_gate": {
  "image": "assets/maps/shinjuku_station_gate_clean_v1.png",
  "exits": [
   {
    "x": 680,
    "y": 211,
    "width": 65,
    "height": 64,
    "to": "shinjuku_center_plaza",
    "direction": "east",
    "spawnX": 63,
    "spawnY": 238,
    "spawnFace": "right"
   },
   {
    "x": 652,
    "y": 352,
    "width": 75,
    "height": 46,
    "to": "subway_concourse_a",
    "direction": "south",
    "spawnX": 401,
    "spawnY": 58,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "down",
    "requiredFlag": "chapter1_started",
    "lockedMsg": "地下鉄の入口は固く閉ざされている。…まずは構内でアカリと言葉を交わそう"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 624.5,
    "y": 404,
    "footprint": {
     "w": 95,
     "h": 128
    }
   },
   {
    "kind": "solid_wall",
    "x": 400,
    "y": 82,
    "footprint": {
     "w": 800,
     "h": 82
    }
   },
   {
    "kind": "solid_wall",
    "x": 398,
    "y": 112,
    "footprint": {
     "w": 536,
     "h": 30
    }
   },
   {
    "kind": "solid_wall",
    "x": 113,
    "y": 142,
    "footprint": {
     "w": 38,
     "h": 60
    }
   },
   {
    "kind": "solid_wall",
    "x": 47,
    "y": 450,
    "footprint": {
     "w": 94,
     "h": 364
    }
   },
   {
    "kind": "solid_wall",
    "x": 119,
    "y": 406,
    "footprint": {
     "w": 78,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 169,
    "y": 408,
    "footprint": {
     "w": 42,
     "h": 70
    }
   },
   {
    "kind": "solid_wall",
    "x": 296,
    "y": 412,
    "footprint": {
     "w": 84,
     "h": 78
    }
   },
   {
    "kind": "solid_wall",
    "x": 342,
    "y": 450,
    "footprint": {
     "w": 20,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 438,
    "y": 404,
    "footprint": {
     "w": 20,
     "h": 66
    }
   },
   {
    "kind": "solid_wall",
    "x": 479,
    "y": 402,
    "footprint": {
     "w": 70,
     "h": 66
    }
   },
   {
    "kind": "solid_wall",
    "x": 543,
    "y": 404,
    "footprint": {
     "w": 74,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 581,
    "y": 416,
    "footprint": {
     "w": 24,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 714.5,
    "y": 332,
    "footprint": {
     "w": 85,
     "h": 56
    }
   },
   {
    "kind": "solid_wall",
    "x": 714.5,
    "y": 450,
    "footprint": {
     "w": 85,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 712,
    "y": 210,
    "footprint": {
     "w": 112,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 772,
    "y": 280,
    "footprint": {
     "w": 56,
     "h": 210
    }
   },
   {
    "kind": "solid_wall",
    "x": 772,
    "y": 450,
    "footprint": {
     "w": 56,
     "h": 170
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
    "spawnX": 698,
    "spawnY": 416,
    "spawnFace": "up"
   },
   {
    "x": 172,
    "y": 76,
    "width": 56,
    "height": 42,
    "to": "deep_tunnel",
    "direction": "north",
    "spawnX": 200,
    "spawnY": 130,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "requiredFlag": "arcDefeated",
    "lockedMsg": "深部への扉は固く閉ざされている… （アーク・プライムを討てば、この奥の深層トンネルへ続く道が開く）",
    "spawnFace": "down"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 28,
    "y": 90,
    "footprint": {
     "w": 56,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 78,
    "y": 108,
    "footprint": {
     "w": 44,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 175,
    "y": 118,
    "footprint": {
     "w": 150,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 148,
    "y": 130,
    "footprint": {
     "w": 24,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 239,
    "y": 130,
    "footprint": {
     "w": 22,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 122,
    "footprint": {
     "w": 90,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 489,
    "y": 122,
    "footprint": {
     "w": 58,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 542,
    "y": 140,
    "footprint": {
     "w": 48,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 603,
    "y": 120,
    "footprint": {
     "w": 74,
     "h": 120
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 142,
    "footprint": {
     "w": 24,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 693,
    "y": 112,
    "footprint": {
     "w": 106,
     "h": 112
    }
   },
   {
    "kind": "solid_wall",
    "x": 773,
    "y": 90,
    "footprint": {
     "w": 54,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 13,
    "y": 150,
    "footprint": {
     "w": 26,
     "h": 47
    }
   },
   {
    "kind": "solid_wall",
    "x": 25,
    "y": 260,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 80,
    "y": 240,
    "footprint": {
     "w": 60,
     "h": 77
    }
   },
   {
    "kind": "solid_wall",
    "x": 149,
    "y": 272,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 272,
    "footprint": {
     "w": 48,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 722,
    "y": 254,
    "footprint": {
     "w": 68,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 788,
    "y": 140,
    "footprint": {
     "w": 24,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 779,
    "y": 190,
    "footprint": {
     "w": 42,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 774,
    "y": 258,
    "footprint": {
     "w": 52,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 400,
    "y": 450,
    "footprint": {
     "w": 800,
     "h": 58
    }
   },
   {
    "kind": "solid_wall",
    "x": 50,
    "y": 392,
    "footprint": {
     "w": 100,
     "h": 104
    }
   },
   {
    "kind": "solid_wall",
    "x": 141,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 62
    }
   },
   {
    "kind": "solid_wall",
    "x": 210,
    "y": 392,
    "footprint": {
     "w": 54,
     "h": 100
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 392,
    "footprint": {
     "w": 22,
     "h": 37
    }
   },
   {
    "kind": "solid_wall",
    "x": 322,
    "y": 392,
    "footprint": {
     "w": 104,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 475,
    "y": 392,
    "footprint": {
     "w": 104,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 587,
    "y": 392,
    "footprint": {
     "w": 62,
     "h": 102
    }
   },
   {
    "kind": "solid_wall",
    "x": 659,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 66
    }
   },
   {
    "kind": "solid_wall",
    "x": 718,
    "y": 392,
    "footprint": {
     "w": 36,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 768,
    "y": 392,
    "footprint": {
     "w": 64,
     "h": 102
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
    "x": 398,
    "y": 390,
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
    "x": 352,
    "y": 0,
    "width": 90,
    "height": 50,
    "to": "shopping_street_north",
    "direction": "north",
    "spawnX": 401,
    "spawnY": 392,
    "spawnFace": "up"
   },
   {
    "x": 728,
    "y": 230,
    "width": 72,
    "height": 24,
    "to": "residential_street",
    "direction": "east",
    "spawnX": 58,
    "spawnY": 225,
    "spawnFace": "right"
   },
   {
    "x": 101,
    "y": 350,
    "width": 30,
    "height": 28,
    "to": "black_market_entrance",
    "direction": "west",
    "spawnX": 725,
    "spawnY": 225,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "left",
    "requiredFlag": "rikuJoined",
    "lockedMsg": "闇市は気が立っている。まず仲間を集めてからだ。",
    "spawnFace": "left"
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
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   },
   {
    "x": 592,
    "y": 150,
    "width": 32,
    "height": 48,
    "to": "shop_guild",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   },
   {
    "x": 380,
    "y": 388,
    "width": 38,
    "height": 36,
    "to": "shop_bank",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 48,
    "y": 176,
    "footprint": {
     "w": 96,
     "h": 176
    }
   },
   {
    "kind": "solid_wall",
    "x": 43,
    "y": 258,
    "footprint": {
     "w": 86,
     "h": 46
    }
   },
   {
    "kind": "solid_wall",
    "x": 55,
    "y": 316,
    "footprint": {
     "w": 110,
     "h": 60
    }
   },
   {
    "kind": "solid_wall",
    "x": 36,
    "y": 350,
    "footprint": {
     "w": 72,
     "h": 34
    }
   },
   {
    "kind": "solid_wall",
    "x": 63,
    "y": 450,
    "footprint": {
     "w": 126,
     "h": 100
    }
   },
   {
    "kind": "solid_wall",
    "x": 151,
    "y": 450,
    "footprint": {
     "w": 54,
     "h": 40
    }
   },
   {
    "kind": "solid_wall",
    "x": 187,
    "y": 150,
    "footprint": {
     "w": 180,
     "h": 150
    }
   },
   {
    "kind": "solid_wall",
    "x": 124,
    "y": 182,
    "footprint": {
     "w": 44,
     "h": 32
    }
   },
   {
    "kind": "solid_wall",
    "x": 232,
    "y": 165,
    "footprint": {
     "w": 68,
     "h": 15
    }
   },
   {
    "kind": "solid_wall",
    "x": 293,
    "y": 148,
    "footprint": {
     "w": 54,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 333,
    "y": 108,
    "footprint": {
     "w": 38,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 361,
    "y": 124,
    "footprint": {
     "w": 26,
     "h": 56
    }
   },
   {
    "kind": "solid_wall",
    "x": 434,
    "y": 124,
    "footprint": {
     "w": 24,
     "h": 56
    }
   },
   {
    "kind": "solid_wall",
    "x": 464,
    "y": 108,
    "footprint": {
     "w": 44,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 564,
    "y": 170,
    "footprint": {
     "w": 188,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 652,
    "y": 160,
    "footprint": {
     "w": 44,
     "h": 28
    }
   },
   {
    "kind": "solid_wall",
    "x": 514,
    "y": 182,
    "footprint": {
     "w": 16,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 622,
    "y": 182,
    "footprint": {
     "w": 16,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 750,
    "y": 124,
    "footprint": {
     "w": 100,
     "h": 124
    }
   },
   {
    "kind": "solid_wall",
    "x": 763,
    "y": 208,
    "footprint": {
     "w": 74,
     "h": 93
    }
   },
   {
    "kind": "solid_wall",
    "x": 716,
    "y": 206,
    "footprint": {
     "w": 28,
     "h": 38
    }
   },
   {
    "kind": "solid_wall",
    "x": 748,
    "y": 232,
    "footprint": {
     "w": 104,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 714,
    "y": 346,
    "footprint": {
     "w": 28,
     "h": 92
    }
   },
   {
    "kind": "solid_wall",
    "x": 781,
    "y": 268,
    "footprint": {
     "w": 38,
     "h": 15
    }
   },
   {
    "kind": "solid_wall",
    "x": 764,
    "y": 352,
    "footprint": {
     "w": 72,
     "h": 86
    }
   },
   {
    "kind": "solid_wall",
    "x": 715,
    "y": 450,
    "footprint": {
     "w": 170,
     "h": 98
    }
   },
   {
    "kind": "solid_wall",
    "x": 272,
    "y": 368,
    "footprint": {
     "w": 80,
     "h": 94
    }
   },
   {
    "kind": "solid_wall",
    "x": 222,
    "y": 386,
    "footprint": {
     "w": 28,
     "h": 38
    }
   },
   {
    "kind": "solid_wall",
    "x": 394,
    "y": 399,
    "footprint": {
     "w": 192,
     "h": 52
    }
   },
   {
    "kind": "solid_wall",
    "x": 478,
    "y": 298,
    "footprint": {
     "w": 24,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 526,
    "y": 378,
    "footprint": {
     "w": 54,
     "h": 70
    }
   },
   {
    "kind": "solid_wall",
    "x": 560,
    "y": 376,
    "footprint": {
     "w": 18,
     "h": 38
    }
   },
   {
    "kind": "street_planter",
    "x": 250,
    "y": 190,
    "w": 86,
    "h": 68,
    "footprint": {
     "w": 78,
     "h": 18
    }
   },
   {
    "kind": "street_planter",
    "x": 560,
    "y": 260,
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
    "x": 195,
    "y": 318,
    "w": 78,
    "h": 46,
    "footprint": {
     "w": 70,
     "h": 16
    }
   },
   {
    "kind": "residential_planter",
    "x": 530,
    "y": 308,
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
    "x": 485,
    "y": 205,
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
    "x": 340,
    "y": 290,
    "w": 28,
    "h": 82,
    "footprint": {
     "w": 18,
     "h": 14
    }
   },
   {
    "kind": "street_lamp",
    "x": 600,
    "y": 300,
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
    "x": 545,
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
    "x": 250,
    "y": 408,
    "w": 42,
    "h": 66,
    "footprint": {
     "w": 30,
     "h": 16
    }
   },
   {
    "kind": "black_market_gate",
    "x": 117,
    "y": 374,
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
    "x": 640,
    "y": 215,
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
    "y": 188,
    "width": 50,
    "height": 75,
    "to": "shopping_street_south",
    "direction": "west",
    "spawnX": 689,
    "spawnY": 243,
    "spawnFace": "left"
   },
   {
    "x": 415,
    "y": 149,
    "width": 26,
    "height": 30,
    "to": "house_1",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 385,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 400,
    "y": 118,
    "footprint": {
     "w": 800,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 11,
    "y": 188,
    "footprint": {
     "w": 22,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 70,
    "y": 188,
    "footprint": {
     "w": 24,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 101,
    "y": 150,
    "footprint": {
     "w": 38,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 175,
    "y": 165,
    "footprint": {
     "w": 110,
     "h": 65
    }
   },
   {
    "kind": "solid_wall",
    "x": 241,
    "y": 174,
    "footprint": {
     "w": 22,
     "h": 74
    }
   },
   {
    "kind": "solid_wall",
    "x": 326,
    "y": 171,
    "footprint": {
     "w": 148,
     "h": 71
    }
   },
   {
    "kind": "solid_wall",
    "x": 431,
    "y": 186,
    "footprint": {
     "w": 62,
     "h": 86
    }
   },
   {
    "kind": "solid_wall",
    "x": 480,
    "y": 175,
    "footprint": {
     "w": 36,
     "h": 75
    }
   },
   {
    "kind": "solid_wall",
    "x": 518,
    "y": 170,
    "footprint": {
     "w": 40,
     "h": 70
    }
   },
   {
    "kind": "solid_wall",
    "x": 587,
    "y": 177,
    "footprint": {
     "w": 98,
     "h": 77
    }
   },
   {
    "kind": "solid_wall",
    "x": 663,
    "y": 187,
    "footprint": {
     "w": 54,
     "h": 87
    }
   },
   {
    "kind": "solid_wall",
    "x": 725,
    "y": 176,
    "footprint": {
     "w": 70,
     "h": 76
    }
   },
   {
    "kind": "solid_wall",
    "x": 780,
    "y": 185,
    "footprint": {
     "w": 40,
     "h": 85
    }
   },
   {
    "kind": "solid_wall",
    "x": 9,
    "y": 450,
    "footprint": {
     "w": 18,
     "h": 188
    }
   },
   {
    "kind": "solid_wall",
    "x": 39,
    "y": 450,
    "footprint": {
     "w": 42,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 83,
    "y": 450,
    "footprint": {
     "w": 50,
     "h": 188
    }
   },
   {
    "kind": "solid_wall",
    "x": 170,
    "y": 450,
    "footprint": {
     "w": 124,
     "h": 190
    }
   },
   {
    "kind": "solid_wall",
    "x": 264,
    "y": 450,
    "footprint": {
     "w": 65,
     "h": 167
    }
   },
   {
    "kind": "solid_wall",
    "x": 349,
    "y": 450,
    "footprint": {
     "w": 103,
     "h": 172
    }
   },
   {
    "kind": "solid_wall",
    "x": 411,
    "y": 450,
    "footprint": {
     "w": 22,
     "h": 187
    }
   },
   {
    "kind": "solid_wall",
    "x": 433,
    "y": 450,
    "footprint": {
     "w": 21,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 477,
    "y": 450,
    "footprint": {
     "w": 69,
     "h": 166
    }
   },
   {
    "kind": "solid_wall",
    "x": 531,
    "y": 450,
    "footprint": {
     "w": 38,
     "h": 158
    }
   },
   {
    "kind": "solid_wall",
    "x": 584,
    "y": 450,
    "footprint": {
     "w": 68,
     "h": 163
    }
   },
   {
    "kind": "solid_wall",
    "x": 633,
    "y": 450,
    "footprint": {
     "w": 30,
     "h": 152
    }
   },
   {
    "kind": "solid_wall",
    "x": 674,
    "y": 450,
    "footprint": {
     "w": 52,
     "h": 115
    }
   },
   {
    "kind": "solid_wall",
    "x": 750,
    "y": 450,
    "footprint": {
     "w": 100,
     "h": 167
    }
   },
   {
    "kind": "residential_planter",
    "x": 235,
    "y": 190,
    "w": 74,
    "h": 44,
    "footprint": {
     "w": 66,
     "h": 16
    }
   },
   {
    "kind": "residential_planter",
    "x": 565,
    "y": 193,
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
    "x": 270,
    "y": 279,
    "w": 78,
    "h": 46,
    "footprint": {
     "w": 70,
     "h": 16
    }
   },
   {
    "kind": "residential_planter",
    "x": 468,
    "y": 280,
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
    "x": 385,
    "y": 277,
    "w": 26,
    "h": 78,
    "footprint": {
     "w": 16,
     "h": 12
    }
   },
   {
    "kind": "street_lamp",
    "x": 640,
    "y": 277,
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
    "x": 350,
    "y": 196,
    "w": 88,
    "h": 44,
    "footprint": {
     "w": 80,
     "h": 16
    }
   },
   {
    "kind": "city_bench",
    "x": 640,
    "y": 196,
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
    "y": 281,
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
    "y": 196,
    "width": 68,
    "height": 58,
    "to": "shopping_street_south",
    "direction": "east",
    "spawnX": 137,
    "spawnY": 390,
    "spawnFace": "right"
   },
   {
    "x": 374,
    "y": 152,
    "width": 50,
    "height": 40,
    "to": "shop_black_market",
    "direction": "north",
    "spawnX": 400,
    "spawnY": 380,
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnFace": "up"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 37,
    "y": 285,
    "footprint": {
     "w": 74,
     "h": 285
    }
   },
   {
    "kind": "solid_wall",
    "x": 87,
    "y": 265,
    "footprint": {
     "w": 26,
     "h": 265
    }
   },
   {
    "kind": "solid_wall",
    "x": 114,
    "y": 264,
    "footprint": {
     "w": 28,
     "h": 112
    }
   },
   {
    "kind": "solid_wall",
    "x": 126,
    "y": 55,
    "footprint": {
     "w": 52,
     "h": 55
    }
   },
   {
    "kind": "solid_wall",
    "x": 189,
    "y": 120,
    "footprint": {
     "w": 74,
     "h": 120
    }
   },
   {
    "kind": "solid_wall",
    "x": 196,
    "y": 182,
    "footprint": {
     "w": 52,
     "h": 182
    }
   },
   {
    "kind": "solid_wall",
    "x": 278,
    "y": 186,
    "footprint": {
     "w": 112,
     "h": 186
    }
   },
   {
    "kind": "solid_wall",
    "x": 352,
    "y": 182,
    "footprint": {
     "w": 36,
     "h": 182
    }
   },
   {
    "kind": "solid_wall",
    "x": 418,
    "y": 190,
    "footprint": {
     "w": 96,
     "h": 190
    }
   },
   {
    "kind": "solid_wall",
    "x": 503,
    "y": 190,
    "footprint": {
     "w": 74,
     "h": 190
    }
   },
   {
    "kind": "solid_wall",
    "x": 561,
    "y": 194,
    "footprint": {
     "w": 54,
     "h": 54
    }
   },
   {
    "kind": "solid_wall",
    "x": 578,
    "y": 142,
    "footprint": {
     "w": 76,
     "h": 142
    }
   },
   {
    "kind": "solid_wall",
    "x": 634,
    "y": 135,
    "footprint": {
     "w": 36,
     "h": 135
    }
   },
   {
    "kind": "solid_wall",
    "x": 606,
    "y": 190,
    "footprint": {
     "w": 16,
     "h": 52
    }
   },
   {
    "kind": "solid_wall",
    "x": 750,
    "y": 138,
    "footprint": {
     "w": 100,
     "h": 138
    }
   },
   {
    "kind": "solid_wall",
    "x": 760,
    "y": 196,
    "footprint": {
     "w": 80,
     "h": 61
    }
   },
   {
    "kind": "solid_wall",
    "x": 701,
    "y": 196,
    "footprint": {
     "w": 18,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 694,
    "y": 322,
    "footprint": {
     "w": 44,
     "h": 84
    }
   },
   {
    "kind": "solid_wall",
    "x": 696,
    "y": 450,
    "footprint": {
     "w": 32,
     "h": 128
    }
   },
   {
    "kind": "solid_wall",
    "x": 757,
    "y": 450,
    "footprint": {
     "w": 86,
     "h": 197
    }
   },
   {
    "kind": "solid_wall",
    "x": 165,
    "y": 450,
    "footprint": {
     "w": 330,
     "h": 165
    }
   },
   {
    "kind": "solid_wall",
    "x": 389,
    "y": 450,
    "footprint": {
     "w": 118,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 473,
    "y": 450,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 551,
    "y": 450,
    "footprint": {
     "w": 106,
     "h": 174
    }
   },
   {
    "kind": "black_market_gate",
    "x": 400,
    "y": 186,
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
    "x": 196,
    "y": 168,
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
    "x": 560,
    "y": 146,
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
    "x": 476,
    "y": 190,
    "w": 42,
    "h": 72,
    "footprint": {
     "w": 32,
     "h": 14
    }
   },
   {
    "kind": "vending_machine",
    "x": 516,
    "y": 190,
    "w": 42,
    "h": 72,
    "footprint": {
     "w": 32,
     "h": 14
    }
   },
   {
    "kind": "street_lamp",
    "x": 330,
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
    "x": 444,
    "y": 208,
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
    "x": 250,
    "y": 250,
    "w": 28,
    "h": 84,
    "footprint": {
     "w": 18,
     "h": 12
    }
   },
   {
    "kind": "street_lamp",
    "x": 585,
    "y": 232,
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
    "x": 658,
    "y": 248,
    "w": 28,
    "h": 88,
    "footprint": {
     "w": 18,
     "h": 12
    }
   },
   {
    "kind": "street_planter",
    "x": 100,
    "y": 282,
    "w": 82,
    "h": 58,
    "footprint": {
     "w": 72,
     "h": 16
    }
   },
   {
    "kind": "street_planter",
    "x": 185,
    "y": 296,
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
    "x": 550,
    "y": 272,
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
    "spawnX": 403,
    "spawnY": 108,
    "spawnFace": "down"
   },
   {
    "x": 685,
    "y": 195,
    "width": 75,
    "height": 53,
    "to": "biodome_gate",
    "direction": "east",
    "spawnX": 60,
    "spawnY": 258,
    "requiredFlag": "metPriest",
    "lockedMsg": "神主の導きを得てから向かうべき場所だ。",
    "spawnFace": "right"
   },
   {
    "x": 356,
    "y": 108,
    "width": 88,
    "height": 48,
    "to": "shrine_inner",
    "direction": "north",
    "spawnX": 401,
    "spawnY": 403,
    "label": "本殿へ",
    "spawnFace": "up"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 98,
    "y": 165,
    "footprint": {
     "w": 196,
     "h": 165
    }
   },
   {
    "kind": "solid_wall",
    "x": 270,
    "y": 170,
    "footprint": {
     "w": 148,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 352,
    "y": 127,
    "footprint": {
     "w": 16,
     "h": 127
    }
   },
   {
    "kind": "solid_wall",
    "x": 390,
    "y": 60,
    "footprint": {
     "w": 92,
     "h": 60
    }
   },
   {
    "kind": "solid_wall",
    "x": 428,
    "y": 127,
    "footprint": {
     "w": 16,
     "h": 127
    }
   },
   {
    "kind": "solid_wall",
    "x": 498,
    "y": 170,
    "footprint": {
     "w": 124,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 609,
    "y": 195,
    "footprint": {
     "w": 98,
     "h": 195
    }
   },
   {
    "kind": "solid_wall",
    "x": 674,
    "y": 188,
    "footprint": {
     "w": 32,
     "h": 188
    }
   },
   {
    "kind": "solid_wall",
    "x": 745,
    "y": 132,
    "footprint": {
     "w": 110,
     "h": 132
    }
   },
   {
    "kind": "solid_wall",
    "x": 193,
    "y": 195,
    "footprint": {
     "w": 38,
     "h": 30
    }
   },
   {
    "kind": "solid_wall",
    "x": 89,
    "y": 218,
    "footprint": {
     "w": 178,
     "h": 53
    }
   },
   {
    "kind": "solid_wall",
    "x": 98,
    "y": 242,
    "footprint": {
     "w": 196,
     "h": 24
    }
   },
   {
    "kind": "solid_wall",
    "x": 108,
    "y": 260,
    "footprint": {
     "w": 216,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 100,
    "y": 450,
    "footprint": {
     "w": 200,
     "h": 192
    }
   },
   {
    "kind": "solid_wall",
    "x": 232,
    "y": 345,
    "footprint": {
     "w": 76,
     "h": 32
    }
   },
   {
    "kind": "solid_wall",
    "x": 244,
    "y": 396,
    "footprint": {
     "w": 192,
     "h": 51
    }
   },
   {
    "kind": "solid_wall",
    "x": 329,
    "y": 345,
    "footprint": {
     "w": 24,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 450,
    "y": 345,
    "footprint": {
     "w": 24,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 535,
    "y": 396,
    "footprint": {
     "w": 194,
     "h": 51
    }
   },
   {
    "kind": "solid_wall",
    "x": 587,
    "y": 345,
    "footprint": {
     "w": 96,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 630,
    "y": 246,
    "footprint": {
     "w": 64,
     "h": 36
    }
   },
   {
    "kind": "solid_wall",
    "x": 649,
    "y": 300,
    "footprint": {
     "w": 102,
     "h": 28
    }
   },
   {
    "kind": "solid_wall",
    "x": 725,
    "y": 282,
    "footprint": {
     "w": 60,
     "h": 34
    }
   },
   {
    "kind": "solid_wall",
    "x": 775,
    "y": 300,
    "footprint": {
     "w": 50,
     "h": 60
    }
   },
   {
    "kind": "solid_wall",
    "x": 700,
    "y": 450,
    "footprint": {
     "w": 200,
     "h": 155
    }
   },
   {
    "kind": "solid_wall",
    "x": 778.5,
    "y": 240,
    "footprint": {
     "w": 43,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 723.5,
    "y": 195,
    "footprint": {
     "w": 67,
     "h": 63
    }
   },
   {
    "kind": "solid_wall",
    "x": 674,
    "y": 230,
    "footprint": {
     "w": 22,
     "h": 42
    }
   }
  ]
 },
 "biodome_gate": {
  "image": "assets/maps/biodome_gate_clean_v1.png",
  "exits": [
   {
    "x": 0,
    "y": 234,
    "width": 52,
    "height": 48,
    "to": "shrine_south_gate",
    "direction": "west",
    "spawnX": 661,
    "spawnY": 255,
    "spawnFace": "left"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 24,
    "y": 258,
    "footprint": {
     "w": 48,
     "h": 258
    }
   },
   {
    "kind": "solid_wall",
    "x": 107,
    "y": 226,
    "footprint": {
     "w": 126,
     "h": 226
    }
   },
   {
    "kind": "solid_wall",
    "x": 185,
    "y": 146,
    "footprint": {
     "w": 34,
     "h": 146
    }
   },
   {
    "kind": "solid_wall",
    "x": 214,
    "y": 170,
    "footprint": {
     "w": 32,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 290,
    "y": 172,
    "footprint": {
     "w": 124,
     "h": 172
    }
   },
   {
    "kind": "solid_wall",
    "x": 364,
    "y": 168,
    "footprint": {
     "w": 32,
     "h": 168
    }
   },
   {
    "kind": "solid_wall",
    "x": 385,
    "y": 148,
    "footprint": {
     "w": 26,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 448,
    "y": 124,
    "footprint": {
     "w": 104,
     "h": 124
    }
   },
   {
    "kind": "solid_wall",
    "x": 507,
    "y": 148,
    "footprint": {
     "w": 22,
     "h": 148
    }
   },
   {
    "kind": "solid_wall",
    "x": 526,
    "y": 166,
    "footprint": {
     "w": 28,
     "h": 166
    }
   },
   {
    "kind": "solid_wall",
    "x": 610,
    "y": 167,
    "footprint": {
     "w": 148,
     "h": 167
    }
   },
   {
    "kind": "solid_wall",
    "x": 712,
    "y": 158,
    "footprint": {
     "w": 64,
     "h": 158
    }
   },
   {
    "kind": "solid_wall",
    "x": 770,
    "y": 336,
    "footprint": {
     "w": 60,
     "h": 336
    }
   },
   {
    "kind": "solid_wall",
    "x": 99,
    "y": 300,
    "footprint": {
     "w": 146,
     "h": 17
    }
   },
   {
    "kind": "solid_wall",
    "x": 69,
    "y": 450,
    "footprint": {
     "w": 138,
     "h": 168
    }
   },
   {
    "kind": "solid_wall",
    "x": 169,
    "y": 412,
    "footprint": {
     "w": 66,
     "h": 116
    }
   },
   {
    "kind": "solid_wall",
    "x": 266,
    "y": 412,
    "footprint": {
     "w": 132,
     "h": 126
    }
   },
   {
    "kind": "solid_wall",
    "x": 342,
    "y": 412,
    "footprint": {
     "w": 32,
     "h": 94
    }
   },
   {
    "kind": "solid_wall",
    "x": 252,
    "y": 290,
    "footprint": {
     "w": 75,
     "h": 24
    }
   },
   {
    "kind": "solid_wall",
    "x": 245,
    "y": 450,
    "footprint": {
     "w": 230,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 363,
    "y": 440,
    "footprint": {
     "w": 22,
     "h": 64
    }
   },
   {
    "kind": "solid_wall",
    "x": 519,
    "y": 440,
    "footprint": {
     "w": 22,
     "h": 64
    }
   },
   {
    "kind": "solid_wall",
    "x": 593,
    "y": 414,
    "footprint": {
     "w": 146,
     "h": 130
    }
   },
   {
    "kind": "solid_wall",
    "x": 594,
    "y": 286,
    "footprint": {
     "w": 112,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 639,
    "y": 450,
    "footprint": {
     "w": 182,
     "h": 40
    }
   },
   {
    "kind": "solid_wall",
    "x": 696,
    "y": 415,
    "footprint": {
     "w": 72,
     "h": 65
    }
   },
   {
    "kind": "solid_wall",
    "x": 736,
    "y": 414,
    "footprint": {
     "w": 24,
     "h": 136
    }
   },
   {
    "kind": "solid_wall",
    "x": 762,
    "y": 450,
    "footprint": {
     "w": 76,
     "h": 120
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
    "spawnX": 737,
    "spawnY": 229,
    "spawnFace": "left"
   },
   {
    "x": 328,
    "y": 43,
    "width": 196,
    "height": 80,
    "to": "tokyo_gov_floor2",
    "direction": "north",
    "spawnX": 401,
    "spawnY": 403,
    "spawnFace": "up",
    "requiredFlag": "archonDefeated",
    "lockedMsg": "アルコン・デウスを倒さなければ、この先へは進めない..."
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 58,
    "y": 158,
    "footprint": {
     "w": 116,
     "h": 158
    }
   },
   {
    "kind": "solid_wall",
    "x": 225,
    "y": 155,
    "footprint": {
     "w": 144,
     "h": 155
    }
   },
   {
    "kind": "solid_wall",
    "x": 331,
    "y": 140,
    "footprint": {
     "w": 78,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 470,
    "y": 136,
    "footprint": {
     "w": 52,
     "h": 136
    }
   },
   {
    "kind": "solid_wall",
    "x": 497,
    "y": 170,
    "footprint": {
     "w": 58,
     "h": 170
    }
   },
   {
    "kind": "solid_wall",
    "x": 610,
    "y": 158,
    "footprint": {
     "w": 164,
     "h": 158
    }
   },
   {
    "kind": "solid_wall",
    "x": 745,
    "y": 168,
    "footprint": {
     "w": 110,
     "h": 168
    }
   },
   {
    "kind": "solid_wall",
    "x": 749,
    "y": 240,
    "footprint": {
     "w": 102,
     "h": 72
    }
   },
   {
    "kind": "solid_wall",
    "x": 755,
    "y": 340,
    "footprint": {
     "w": 90,
     "h": 100
    }
   },
   {
    "kind": "solid_wall",
    "x": 753,
    "y": 384,
    "footprint": {
     "w": 94,
     "h": 46
    }
   },
   {
    "kind": "solid_wall",
    "x": 664,
    "y": 370,
    "footprint": {
     "w": 48,
     "h": 38
    }
   },
   {
    "kind": "solid_wall",
    "x": 697,
    "y": 385,
    "footprint": {
     "w": 22,
     "h": 89
    }
   },
   {
    "kind": "solid_wall",
    "x": 621,
    "y": 380,
    "footprint": {
     "w": 42,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 567,
    "y": 362,
    "footprint": {
     "w": 66,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 513,
    "y": 402,
    "footprint": {
     "w": 46,
     "h": 127
    }
   },
   {
    "kind": "solid_wall",
    "x": 480,
    "y": 356,
    "footprint": {
     "w": 26,
     "h": 34
    }
   },
   {
    "kind": "solid_wall",
    "x": 306,
    "y": 400,
    "footprint": {
     "w": 48,
     "h": 125
    }
   },
   {
    "kind": "solid_wall",
    "x": 328,
    "y": 352,
    "footprint": {
     "w": 20,
     "h": 37
    }
   },
   {
    "kind": "solid_wall",
    "x": 260,
    "y": 362,
    "footprint": {
     "w": 52,
     "h": 52
    }
   },
   {
    "kind": "solid_wall",
    "x": 205,
    "y": 380,
    "footprint": {
     "w": 66,
     "h": 70
    }
   },
   {
    "kind": "solid_wall",
    "x": 155,
    "y": 368,
    "footprint": {
     "w": 40,
     "h": 36
    }
   },
   {
    "kind": "solid_wall",
    "x": 122,
    "y": 385,
    "footprint": {
     "w": 29,
     "h": 80
    }
   },
   {
    "kind": "solid_wall",
    "x": 109,
    "y": 330,
    "footprint": {
     "w": 26,
     "h": 75
    }
   },
   {
    "kind": "solid_wall",
    "x": 49,
    "y": 348,
    "footprint": {
     "w": 98,
     "h": 114
    }
   },
   {
    "kind": "street_planter",
    "x": 240,
    "y": 220,
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
    "y": 220,
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
  ],
  "npcs": [
   {
    "id": "archon_deus_boss",
    "name": "アルコン・デウス",
    "x": 418,
    "y": 155,
    "emoji": "👑",
    "hostile": false,
    "boss": true,
    "bossKey": "archon_deus",
    "dialogue": "この先はお前たちのような人間には渡さない。秩序の名のもとに、消えろ。",
    "defeatedDialogue": "…信じられない…人間ごときが…偽神たる私を…",
    "hidden": false,
    "hideWhenFlag": "archonDefeated"
   }
  ]
 },
 "deep_tunnel": {
  "image": "assets/maps/subway_concourse_a_clean_v1.png",
  "exits": [
   {
    "x": 172,
    "y": 76,
    "width": 56,
    "height": 42,
    "to": "subway_concourse_a",
    "direction": "north",
    "autoEnter": true,
    "visible": false,
    "requireFacing": "up",
    "spawnX": 179,
    "spawnY": 128,
    "spawnFace": "down"
   },
   {
    "x": 305,
    "y": 405,
    "width": 140,
    "height": 25,
    "to": "deep_tunnel_2",
    "direction": "south",
    "spawnX": 400,
    "spawnY": 75,
    "spawnFace": "down",
    "requiredFlag": "leviathanDefeated",
    "lockedMsg": "最奥へ続く縦坑は、まだ固く閉ざされている。…まずはリヴァイアサン・コアを討て"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 28,
    "y": 90,
    "footprint": {
     "w": 56,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 78,
    "y": 108,
    "footprint": {
     "w": 44,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 175,
    "y": 118,
    "footprint": {
     "w": 150,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 148,
    "y": 130,
    "footprint": {
     "w": 24,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 239,
    "y": 130,
    "footprint": {
     "w": 22,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 122,
    "footprint": {
     "w": 90,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 489,
    "y": 122,
    "footprint": {
     "w": 58,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 542,
    "y": 140,
    "footprint": {
     "w": 48,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 603,
    "y": 120,
    "footprint": {
     "w": 74,
     "h": 120
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 142,
    "footprint": {
     "w": 24,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 693,
    "y": 112,
    "footprint": {
     "w": 106,
     "h": 112
    }
   },
   {
    "kind": "solid_wall",
    "x": 773,
    "y": 90,
    "footprint": {
     "w": 54,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 13,
    "y": 150,
    "footprint": {
     "w": 26,
     "h": 47
    }
   },
   {
    "kind": "solid_wall",
    "x": 25,
    "y": 260,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 80,
    "y": 240,
    "footprint": {
     "w": 60,
     "h": 77
    }
   },
   {
    "kind": "solid_wall",
    "x": 149,
    "y": 272,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 272,
    "footprint": {
     "w": 48,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 722,
    "y": 254,
    "footprint": {
     "w": 68,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 788,
    "y": 140,
    "footprint": {
     "w": 24,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 779,
    "y": 190,
    "footprint": {
     "w": 42,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 774,
    "y": 258,
    "footprint": {
     "w": 52,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 173,
    "y": 450,
    "footprint": {
     "w": 346,
     "h": 58
    }
   },
   {
    "kind": "solid_wall",
    "x": 628,
    "y": 450,
    "footprint": {
     "w": 345,
     "h": 58
    }
   },
   {
    "kind": "solid_wall",
    "x": 400,
    "y": 450,
    "footprint": {
     "w": 110,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 50,
    "y": 392,
    "footprint": {
     "w": 100,
     "h": 104
    }
   },
   {
    "kind": "solid_wall",
    "x": 141,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 62
    }
   },
   {
    "kind": "solid_wall",
    "x": 210,
    "y": 392,
    "footprint": {
     "w": 54,
     "h": 100
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 392,
    "footprint": {
     "w": 22,
     "h": 37
    }
   },
   {
    "kind": "solid_wall",
    "x": 308,
    "y": 392,
    "footprint": {
     "w": 75,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 491,
    "y": 392,
    "footprint": {
     "w": 72,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 587,
    "y": 392,
    "footprint": {
     "w": 62,
     "h": 102
    }
   },
   {
    "kind": "solid_wall",
    "x": 659,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 66
    }
   },
   {
    "kind": "solid_wall",
    "x": 718,
    "y": 392,
    "footprint": {
     "w": 36,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 768,
    "y": 392,
    "footprint": {
     "w": 64,
     "h": 102
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
    "kind": "black_market_gate",
    "x": 400,
    "y": 150
   }
  ],
  "npcs": [
   {
    "id": "leviathan_core_boss",
    "name": "リヴァイアサン・コア",
    "x": 418,
    "y": 250,
    "emoji": "🐉",
    "hostile": false,
    "boss": true,
    "bossKey": "leviathan",
    "dialogue": "…貴様らに、神力の重さが分かるか。吸い上げられた八百万の命が、今ここに凝縮されている。",
    "defeatedDialogue": "…解放される…神々の力よ、カイトに…",
    "hidden": false,
    "hideWhenFlag": "leviathanDefeated"
   }
  ]
 },
 "deep_tunnel_boss": {
  "image": "assets/maps/subway_concourse_a_clean_v1.png",
  "exits": [
   {
    "x": 350,
    "y": 410,
    "width": 100,
    "height": 20,
    "to": "deep_tunnel_4",
    "direction": "south",
    "spawnX": 401,
    "spawnY": 403,
    "spawnFace": "up"
   }
  ],
  "objects": [
   {
    "kind": "solid_wall",
    "x": 28,
    "y": 90,
    "footprint": {
     "w": 56,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 78,
    "y": 108,
    "footprint": {
     "w": 44,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 175,
    "y": 118,
    "footprint": {
     "w": 150,
     "h": 118
    }
   },
   {
    "kind": "solid_wall",
    "x": 148,
    "y": 130,
    "footprint": {
     "w": 24,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 239,
    "y": 130,
    "footprint": {
     "w": 22,
     "h": 18
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 122,
    "footprint": {
     "w": 90,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 489,
    "y": 122,
    "footprint": {
     "w": 58,
     "h": 122
    }
   },
   {
    "kind": "solid_wall",
    "x": 542,
    "y": 140,
    "footprint": {
     "w": 48,
     "h": 140
    }
   },
   {
    "kind": "solid_wall",
    "x": 603,
    "y": 120,
    "footprint": {
     "w": 74,
     "h": 120
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 142,
    "footprint": {
     "w": 24,
     "h": 26
    }
   },
   {
    "kind": "solid_wall",
    "x": 693,
    "y": 112,
    "footprint": {
     "w": 106,
     "h": 112
    }
   },
   {
    "kind": "solid_wall",
    "x": 773,
    "y": 90,
    "footprint": {
     "w": 54,
     "h": 90
    }
   },
   {
    "kind": "solid_wall",
    "x": 13,
    "y": 150,
    "footprint": {
     "w": 26,
     "h": 47
    }
   },
   {
    "kind": "solid_wall",
    "x": 25,
    "y": 260,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 80,
    "y": 240,
    "footprint": {
     "w": 60,
     "h": 77
    }
   },
   {
    "kind": "solid_wall",
    "x": 149,
    "y": 272,
    "footprint": {
     "w": 50,
     "h": 110
    }
   },
   {
    "kind": "solid_wall",
    "x": 650,
    "y": 272,
    "footprint": {
     "w": 48,
     "h": 108
    }
   },
   {
    "kind": "solid_wall",
    "x": 722,
    "y": 254,
    "footprint": {
     "w": 68,
     "h": 88
    }
   },
   {
    "kind": "solid_wall",
    "x": 788,
    "y": 140,
    "footprint": {
     "w": 24,
     "h": 42
    }
   },
   {
    "kind": "solid_wall",
    "x": 779,
    "y": 190,
    "footprint": {
     "w": 42,
     "h": 50
    }
   },
   {
    "kind": "solid_wall",
    "x": 774,
    "y": 258,
    "footprint": {
     "w": 52,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 173,
    "y": 450,
    "footprint": {
     "w": 346,
     "h": 58
    }
   },
   {
    "kind": "solid_wall",
    "x": 628,
    "y": 450,
    "footprint": {
     "w": 345,
     "h": 58
    }
   },
   {
    "kind": "solid_wall",
    "x": 400,
    "y": 450,
    "footprint": {
     "w": 110,
     "h": 20
    }
   },
   {
    "kind": "solid_wall",
    "x": 50,
    "y": 392,
    "footprint": {
     "w": 100,
     "h": 104
    }
   },
   {
    "kind": "solid_wall",
    "x": 141,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 62
    }
   },
   {
    "kind": "solid_wall",
    "x": 210,
    "y": 392,
    "footprint": {
     "w": 54,
     "h": 100
    }
   },
   {
    "kind": "solid_wall",
    "x": 295,
    "y": 392,
    "footprint": {
     "w": 22,
     "h": 37
    }
   },
   {
    "kind": "solid_wall",
    "x": 308,
    "y": 392,
    "footprint": {
     "w": 75,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 491,
    "y": 392,
    "footprint": {
     "w": 72,
     "h": 16
    }
   },
   {
    "kind": "solid_wall",
    "x": 587,
    "y": 392,
    "footprint": {
     "w": 62,
     "h": 102
    }
   },
   {
    "kind": "solid_wall",
    "x": 659,
    "y": 392,
    "footprint": {
     "w": 86,
     "h": 66
    }
   },
   {
    "kind": "solid_wall",
    "x": 718,
    "y": 392,
    "footprint": {
     "w": 36,
     "h": 68
    }
   },
   {
    "kind": "solid_wall",
    "x": 768,
    "y": 392,
    "footprint": {
     "w": 64,
     "h": 102
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
   }
  ]
 }
};
