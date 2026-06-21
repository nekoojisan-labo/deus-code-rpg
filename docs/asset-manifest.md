# デウス・コード拡張 — アセット生成マニフェスト

> 方針: **画像は Codex で生成**。私(Claude)は (1)この仕様書を作る (2)ゲーム側の配線(image path/encounterTable/マップ定義) (3)敵分布の設定 を担当。
> Codex 生成 → assets/ に配置 → 私が enemyImageMap / map.image / objects に紐付け。

## 既存の規約（生成時に揃える）
- **敵スプライト**: `assets/enemies/enemy_<id>.png`（+ .webp）。透過背景・単体・中央・既存の精細なデジタルペイント調（例: enemy_ark_prime.png / enemy_abyss_ruler.png）。ゲームは getOptimizedImagePath で .webp を優先ロード。配線: `battle-system.js` の `enemyImageMap`(L158)。
- **マップ背景**: `assets/maps/<map>.png`（+ .webp / _clean_v1 変種あり）。トップダウン2.5D・歩行領域が読み取れる構図。配線: マップ定義の `image:`。
- **障害物オブジェクト**: `assets/objects/<name>.png`（+ .webp）。透過背景・単体（例: city_bench, residential_planter, street_lamp, bank_terminal）。配線: マップの objects[] に sprite として。
- **敵分布(画像でなくデータ)**: `battle-system.js` encounterTables(L445/502) ＋ `map-system.js` getEncounterZone(L4228)。ステージ別に table/tier/levelRange を設定。

## 必要アセット一覧（フェーズ順）

### Phase 2（前半・加入。既存マップ流用＝背景/障害物は不要、敵スプライトのみ）
| アセット | パス | 用途 | 状態 |
|---|---|---|---|
| 堕神スプライト | `assets/enemies/enemy_fallen_life_god.png` | リク加入の堕神戦ボス | **Codex生成待ち**（今はemoji🌿暫定） |

#### 堕神 生成プロンプト（Codex用）
```
A corrupted nature deity boss for a cyberpunk JRPG, single character centered on transparent background, detailed painterly digital art matching a dark sci-fi tone.
Subject: a once-divine god of life and plants, now imprisoned and fallen ("堕神"). A vast tree/plant-like humanoid deity, bioluminescent green-teal foliage frozen mid-bloom, bound and pierced by cold metallic/icy restraints and cables of an AI system. Vines turned into lances and whips. A sorrowful, half-human divine face barely visible within the frozen canopy. The aura of countless trapped lives. Palette: deep teal/green bioluminescence against cold ice-blue and dark steel. Mythic scale, suffering and beauty. No text, no background scenery, just the creature.
Output: assets/enemies/enemy_fallen_life_god.png (+ webp), matching the size/style of existing enemy_*.png sprites.
```

### Phase 3（後半・道のり延長。新ステージ＝背景＋障害物＋敵が要る）※ステージ確定後に追記
- 都庁前/管理区（新エリア）: 背景1点・障害物数点・偽神アルコン・デウス スプライト（archon_deus流用 or 新規）。
- 既存未使用ボスのスプライト整備: archon_deus / leviathan_core（敵DBにあるが画像未確認→要確認/生成）。

### Phase 4（裏ダンジョン）※確定後に追記
- 深層トンネル系は既存背景流用可。リヴァイアサン(leviathan_core)・真デウス(新規)のスプライト。

## 敵分布の方針（私がコードで設定）
- 既存: city→tier1 / subway→2 / shrine→2 / garden→3 / market→3 / gov→4 / dungeon→5。
- 新ステージは getEncounterZone に分岐追加＋encounterTables にテーブル追加。
- ★バランス実測(battle-balance-sim.js): 中盤以降(神社→深層)が自明。地下鉄は既に最難関。→ エリア別に補正（makeScaledEnemy 差し込み・地下鉄据え置き）。新ステージ追加時に合わせて調整。

## Codex 連携の運用（要ユーザー確認）
- 生成方法: ユーザーがCodexで生成 / codex-rescueエージェントへ委譲 / 私がspecファイルを渡す、のどれか。
- 生成物は `assets/enemies|maps|objects/` に配置 → 私が path 紐付け＋?v=バンプ＋デプロイ。
