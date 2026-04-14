# ブロックレイアウト定義書（正解データ）

1. ヘッダーセクション（固定）
1行目: 発動方式 [LOGIC_TYPE (AND/OR ▼)]

2行目: 自動発動 [AUTO_CAST (checkbox □)]

3行目: ボタン入力 [HAS_BUTTON (checkbox □)]

4行目（条件付き）: [BUTTON_TYPE (A/B/X/Y... ▼)]

※3行目のチェックがONの時のみ表示

2. 条件セクション（動的に追加/削除）
条件セット（i番目）は、以下の「メイン行」と、必要に応じた「数値入力行」で構成されます。

メイン行 (CONDITION_ROW_i):

[PREFIX_LABEL_i (「かつ」or「または」)] ※ i > 0 の時のみ表示

[COND_SUBJECT_i (対象 ▼)] が

[COND_OWNER_i (所有 ▼)] の

[COND_PLACE_i (場所 ▼)] において

[COND_STATE_i (状態 ▼)] 時

[VERDICT_i (判定 ▼)]

[DEL_BUTTON_i (－ボタン)]

数値入力行 (CONDITION_VAL_ROW_i / 条件付き):

場所 が範囲指定（RANGE）なら: 半径 [COND_RADIUS_i (数値入力)] m以内/外

場所 が時間指定（TIME）なら: [COND_TIME_i (数値入力)] 秒以内/後

3. フッターセクション（固定）
追加行: [ADD_BUTTON (⊕)] 追加

実行スロット: 実行 [EXECUTE (Statement Input)]

レイアウトのポイント（Cursorへの補足）
接続詞の連動: 1行目の LOGIC_TYPE が AND なら2件目以降のラベルは かつ、OR なら または に自動で書き換えること。

インデックス管理: 行を削除した際、残った行の i（インデックス）を詰め直して、保存データに矛盾が出ないようにすること。

1枚目の削除: 1枚目の DEL_BUTTON_0 を押した場合もその行を削除し、条件が0個の状態を許容すること。