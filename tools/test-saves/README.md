# テスト用セーブデータ（進行段階別・3種）

実ゲームコード（joinMember / levelUpCharacter / serializeGameState）で生成した正規セーブ。
最初からプレイしなくても各進行段階からテストを始められる。

| ファイル | 章 | 場所 | Lv / 人数 | 次の目標 |
|---|---|---|---|---|
| `save1_ch2_start_Lv8.json` | 第2章 仲間と試練 | 新宿 中央広場 | Lv8・2人（カイト+アカリ） | 植物園でリクを仲間に |
| `save2_ch3_start_Lv14.json` | 第3章 決戦 | 新宿 中央広場 | Lv14・4人 | 都庁へ乗り込む |
| `save3_final_Lv30.json` | 終章 深淵の審判 | 地下コンコースA（深層の扉の目の前） | Lv30・4人 | 深層トンネルへ踏み込む |

## 読み込み方

タイトル画面 → **つづきから / ロード** → **ファイルから読み込み** → 保存先スロットを選択 → この JSON を選ぶ。

- ローカル: このフォルダのファイルをそのまま選択
- 本番サイトでテストする場合: GitHub の raw URL からダウンロードして選択
  `https://raw.githubusercontent.com/nekoojisan-labo/deus-code-rpg/main/tools/test-saves/save1_ch2_start_Lv8.json` （2・3 も同様）

## 備考

- 封筒形式 version 2 / specVersion 3（2026-07-12 生成）。セーブ仕様を変えたら要再生成
- 所持金・アイテムは各段階の推奨装備が買える程度に持たせてある（装備は加入時ロードアウトのまま）
- 生成手順: ブラウザで新規開始 → debug API で章フラグ・加入・レベルを実コード経路で構築 → `writeSaveSlot(n)` → localStorage の封筒を書き出し
