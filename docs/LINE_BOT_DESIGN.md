# LINE Bot 機能設計メモ

## 概要

シフト管理アプリのLINE Bot機能拡張設計。キャストがLINEから出勤確認、欠勤連絡、リクエスト出勤などを行えるようにする。

---

## 1. 当日シフト確認通知（自動プッシュ）

### タイミング
- 当日 **13:00** に自動送信

### フロー
```
【13:00 自動通知】
本日〇〇時〜〇〇時の出勤ですが、大丈夫でしょうか？
来店予定もありましたら時間と人数を教えてください
[出勤OK] [当日欠勤] [その他]
      ↓
   出勤OKの場合
      ↓
【続けて質問】
来店予定はありますか？
[ある] [なし]
      ↓
   「ある」の場合
      ↓
来店予定を入力してください
例: 18時1名 19時2名
（複数ある場合はスペースで区切る）
```

### 各ボタンの動作

| ボタン | 動作 |
|--------|------|
| 出勤OK | 確認メッセージのみ（DB更新なし）→ 来店予定入力へ |
| 当日欠勤 | DBに保存 + Discord通知 + 注意メッセージ送信 |
| その他 | 「要件を教えてください」→ 管理者が手動対応 |

### 当日欠勤時のメッセージ
```
当日欠勤として処理しました。

⚠️ 当日欠勤扱いを解除するには：
・病欠の場合：休んだ日から2日以内の病院の領収書を提出してください
```

---

## 2. リクエスト出勤（予約出勤）

### 用途
- シフトがない日にお客様が来店する場合の出勤申請
- お客様来店時のみ利用可能

### フロー
```
リクエスト出勤（リッチメニュー）
      ↓
何日に出勤しますか？
（日付入力 or カレンダー選択）
      ↓
来店予定を入力してください
例: 18時1名 19時2名
      ↓
確認 → シフト追加 + 来店予定登録
      ↓
✅ 12/5のシフトを登録しました
来店予定: 18時1名 19時2名
```

### 承認フロー
- **即反映**（管理者承認不要）

### データ保存先
- **`shifts`テーブル**: INSERT（`source = 'line_request'`）
- **`attendance`テーブル**: INSERT（`status = 'リクエスト出勤'`）

---

## 3. 事前欠勤

### 期限
- **前日23:59まで**（それ以降は当日欠勤扱い）

### フロー
```
事前欠勤（リッチメニュー）
      ↓
キャンセルしたいシフトを選んでください
[12/5 18:00〜23:00]
[12/8 19:00〜24:00]
[12/10 18:00〜23:00]
      ↓
12/5のシフトをキャンセルしますか？
[はい] [いいえ]
      ↓
✅ 12/5のシフトをキャンセルしました
      ↓
Discord通知
```

### データ保存先
- **`shifts`テーブル**: 該当レコードを削除
- **`attendance`テーブル**: 「事前欠勤」として記録（履歴を残す）

---

## 4. リッチメニュー構成

| ボタン | 機能 |
|--------|------|
| リクエスト出勤 | 日付+来店予定を入力してシフト追加 |
| 事前欠勤 | シフト一覧から選んでキャンセル |
| ヘルプ | 使い方表示 |
| その他お問い合わせ | テキスト入力 → Discord通知 → 手動対応 |

※ シフト確認はWebアプリで行うためリッチメニューには含めない

---

## 5. 来店予定入力

### 入力方式
- **一括テキスト入力**（案D採用）

### フォーマット
```
来店予定を入力してください
例: 18時1名 19時2名

（複数ある場合はスペースで区切る）
```

### パース例
- `18時1名` → { time: '18:00', count: 1 }
- `19時2名 20時3名` → 2件登録

---

## 6. Discord連携

### 仕組み
- Discord Webhookを使用
- チャンネルごとにWebhook作成可能

### 通知タイミング
- 当日欠勤時
- 事前欠勤時
- その他お問い合わせ時

### 通知内容例
```
【当日欠勤】
キャスト: 〇〇
日付: 12/5
シフト: 18:00〜23:00
```

```
【お問い合わせ】
キャスト: 〇〇
内容: xxxxxxxxx
```

---

## 7. データフロー設計

### テーブルの役割分担

| テーブル | 用途 | 書き込み元 |
|----------|------|------------|
| `shifts` | シフト予定（いつ誰が出勤予定か） | Web管理画面、LINE Bot（リクエスト出勤） |
| `attendance` | 勤怠記録（ステータス管理） | LINE Bot（全操作）、POS（通常出勤） |

### LINE Bot のデータ操作

```
【リクエスト出勤】
shifts テーブルに INSERT
  - source = 'line_request'
attendance テーブルに INSERT
  - status: リクエスト出勤（code = 'request_shift'）
（同時に visitor_reservations に INSERT）

【事前欠勤】
shifts テーブルから DELETE（該当日のシフト）
attendance テーブルに INSERT
  - status: 事前欠勤（code = 'advance_absence'）

【当日欠勤】
attendance テーブルに INSERT
  - status: 当欠（code = 'same_day_absence'）
（shiftsはそのまま）
```

※ 全てのLINE Bot操作がattendanceに記録される（一貫性）
※ 来なかった場合は管理者が手動で「無断欠勤」等に変更

### POS 勤怠一括登録機能（新機能）

```
POS 勤怠登録画面
      ↓
「一括登録」ボタン押下
      ↓
当日の shifts テーブルから出勤予定者を取得
      ↓
⚠️ 既に attendance にレコードがある人はスキップ
  （事前欠勤・当日欠勤が上書きされないように）
      ↓
レコードがない人だけ attendance に INSERT
  - status: 出勤（code = 'present'）
      ↓
個別に遅刻・早退などを後から修正可能
```

### 上書き防止のロジック

```typescript
// POS一括登録の実装イメージ
const todayShifts = await getShifts(storeId, today)
const existingAttendance = await getAttendance(storeId, today)

const existingCastIds = new Set(existingAttendance.map(a => a.cast_id))

// 既にattendanceがある人を除外
const toInsert = todayShifts.filter(s => !existingCastIds.has(s.cast_id))

await insertAttendance(toInsert.map(s => ({
  cast_id: s.cast_id,
  store_id: storeId,
  date: today,
  status: '出勤'  // code = 'present'
})))
```

### shifts テーブル変更

```sql
ALTER TABLE shifts
ADD COLUMN source VARCHAR(20) DEFAULT 'manual';
-- 'manual' | 'line_request'
```

---

## 8. テーブル設計（詳細）

※ POS連携確認後に作成

### 勤怠ステータス（attendance_statuses）にcode追加

LINE BotとPOSで共通のステータスコードを使うため、`attendance_statuses`テーブルに`code`カラムを追加。

```sql
ALTER TABLE attendance_statuses
ADD COLUMN code TEXT;
```

### デフォルトステータス（8種類）

| code | デフォルト表示名 | 色 | 用途 |
|------|-----------------|-----|------|
| `present` | 出勤 | #22c55e（緑） | 通常出勤 |
| `same_day_absence` | 当欠 | #ef4444（赤） | 当日欠勤（LINE Bot連携） |
| `advance_absence` | 事前欠勤 | #f97316（オレンジ） | 事前欠勤（LINE Bot連携） |
| `no_call_no_show` | 無欠 | #dc2626（濃い赤） | 無断欠勤 |
| `late` | 遅刻 | #eab308（黄） | 遅刻 |
| `early_leave` | 早退 | #a855f7（紫） | 早退 |
| `excused` | 公欠 | #3b82f6（青） | 公欠（病欠証明ありなど） |
| `request_shift` | リクエスト出勤 | #06b6d4（シアン） | リクエスト出勤 |

### 新店舗作成時のトリガー

```sql
CREATE OR REPLACE FUNCTION create_default_attendance_statuses()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO attendance_statuses (store_id, status_name, code, color) VALUES
    (NEW.id, '出勤', 'present', '#22c55e'),
    (NEW.id, '当欠', 'same_day_absence', '#ef4444'),
    (NEW.id, '事前欠勤', 'advance_absence', '#f97316'),
    (NEW.id, '無欠', 'no_call_no_show', '#dc2626'),
    (NEW.id, '遅刻', 'late', '#eab308'),
    (NEW.id, '早退', 'early_leave', '#a855f7'),
    (NEW.id, '公欠', 'excused', '#3b82f6'),
    (NEW.id, 'リクエスト出勤', 'request_shift', '#06b6d4');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_store_insert
AFTER INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION create_default_attendance_statuses();
```

### LINE Botでの使い方

```typescript
// 当日欠勤を登録する例
const { data: status } = await supabase
  .from('attendance_statuses')
  .select('status_name')
  .eq('store_id', storeId)
  .eq('code', 'same_day_absence')  // codeで検索
  .single()

await supabase.from('attendance').insert({
  cast_name: castName,
  store_id: storeId,
  date: today,
  status: status.status_name  // 表示名で保存（既存のPOSと互換）
})
```

### 来店予定テーブル
```sql
CREATE TABLE visitor_reservations (
  id SERIAL PRIMARY KEY,
  cast_id INTEGER REFERENCES casts(id),
  store_id INTEGER REFERENCES stores(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  source VARCHAR(20), -- 'line' | 'manual' | 'request_shift'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Discord Webhook URL追加
```sql
ALTER TABLE store_line_configs
ADD COLUMN discord_webhook_url TEXT;
```

---

## 9. 確定事項まとめ

| 項目 | 決定内容 |
|------|----------|
| 通知時間 | 当日13:00 |
| 出勤OK | 確認メッセージのみ（DB更新なし） |
| 当日欠勤 | `attendance`に記録 + Discord通知 |
| 当日欠勤保存先 | `attendance`テーブルのみ（shiftsはそのまま） |
| 事前欠勤期限 | 前日23:59まで |
| 事前欠勤 | `shifts`削除 + `attendance`に記録 + Discord通知 |
| 事前欠勤保存先 | `shifts`削除 + `attendance`に履歴として記録 |
| リクエスト出勤 | 即反映（承認不要）+ 来店予定必須 |
| リクエスト出勤保存先 | `shifts` INSERT + `attendance` INSERT（リクエスト出勤） |
| 来店予定入力 | 一括テキスト入力方式 |
| Discord | Webhook URL設定で任意のチャンネルへ |
| POS勤怠一括登録 | shiftsから取得 → **attendanceに既存レコードがある人はスキップ** → 残りを登録 |

---

## 10. 役割分担

### LINEでやること
- 当日13:00シフト確認通知 → 出勤OK/欠勤/その他 → 来店予定入力
- リクエスト出勤（予約出勤）
- 事前欠勤
- ヘルプ
- その他お問い合わせ

### Webアプリでやること
- シフト確認
- シフト管理（管理者）
- ユーザー管理（管理者）
- 来店予定確認（現場用）

### POSでやること
- 勤怠一括登録（当日shiftsから取得→既存attendanceスキップ→残りを登録）
- 個別勤怠修正（遅刻・早退など）
- 勤怠ステータス管理

---

## 11. 実装TODO

### DB変更（POS連携確認後）
- [x] attendance_statusesにcodeカラム追加
- [x] 既存店舗のステータスにcode設定（マイグレーション）
- [x] 新店舗作成時のトリガー設定
- [x] 来店予定テーブル作成
- [x] store_line_configsにdiscord_webhook_url追加
- [x] shiftsテーブルにsourceカラム追加
- [ ] castsテーブルにline_input_contextカラム追加

### LINE Bot実装
- [x] 当日シフト確認通知（Cron Job / Vercel Cron）
- [x] 来店予定テキストパース処理
- [x] Discord Webhook連携
- [ ] リッチメニュー作成（LINE Developers Console）
- [x] Webhookハンドラー拡張（リクエスト出勤、事前欠勤）

### POS機能追加
- [ ] 勤怠一括登録ボタン実装（当日のshiftsから取得→既存attendanceスキップ→残りを登録）

---

## 12. 追加マイグレーションSQL

### castsテーブルにline_input_contextカラム追加

マルチステップ会話フロー（リクエスト出勤、来店予定入力など）のための状態管理用カラム。

```sql
-- castsテーブルにline_input_contextカラムを追加
ALTER TABLE casts
ADD COLUMN line_input_context JSONB;

-- コメント追加
COMMENT ON COLUMN casts.line_input_context IS 'LINE Bot会話コンテキスト（マルチステップフロー用）';
```

### line_input_contextの構造

```json
{
  "action": "request_shift_visitor",  // アクション種別
  "date": "2025-12-05",               // 日付（リクエスト出勤用）
  "shiftTime": "18:00-23:00",         // シフト時間（リクエスト出勤用）
  "shiftId": 123,                     // シフトID（来店予定入力用）
  "expiresAt": "2025-12-01T13:30:00Z" // 有効期限（30分）
}
```

### Vercel Cron設定

`vercel.json`に13:00 JST（04:00 UTC）の通知設定を追加済み。

```json
{
  "crons": [
    {
      "path": "/api/cron/shift-reminder",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### 環境変数

```bash
# === 必須 ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Cron認証 ===
CRON_SECRET=<任意のシークレット>  # Vercel Cronエンドポイント認証用

# === Supabase Auth連携（RLS用） ===
SUPABASE_AUTH_SECRET=<共通パスワード>  # 内部認証用の共通パスワード
```

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | Supabase Dashboard → Settings → API |
| `CRON_SECRET` | Cronエンドポイント認証用シークレット | 任意の文字列を生成 |
| `SUPABASE_AUTH_SECRET` | RLS用内部認証パスワード | 任意の文字列を生成 |

※ LINE関連の設定（Channel Secret、Access Token）は `store_line_configs` テーブルで管理

---

## 13. リッチメニュー設定

### LINE Developers Console での設定手順

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. 対象のチャネルを選択
3. 「リッチメニュー」タブを開く
4. 「作成」をクリック

### 推奨レイアウト

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │キャスト  │  │リクエスト│          │
│  │ 登録    │  │  出勤   │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ 事前   │  │  お問い  │          │
│  │ 欠勤   │  │  合わせ │          │
│  └─────────┘  └─────────┘          │
│                                     │
└─────────────────────────────────────┘
```

### 各ボタンの設定

| ボタン | タイプ | アクション |
|--------|--------|-----------|
| キャスト登録 | テキスト | `キャスト登録` |
| リクエスト出勤 | テキスト | `リクエスト出勤` |
| 事前欠勤 | テキスト | `事前欠勤` |
| お問い合わせ | テキスト | `お問い合わせ` |

### オプションボタン（追加可能）

| ボタン | タイプ | アクション |
|--------|--------|-----------|
| シフト確認 | テキスト | `シフト確認` |
| ヘルプ | テキスト | `ヘルプ` |
| Webアプリ | URI | `https://your-app-url.vercel.app/liff?storeId={storeId}` |

### 画像サイズ

- **推奨サイズ**: 2500 x 1686 px または 2500 x 843 px
- **ファイル形式**: PNG または JPEG
- **最大ファイルサイズ**: 1MB

### 複数店舗対応

店舗ごとに異なるLINE公式アカウントを使用する場合：
- 各店舗のLINE Developers Consoleで個別にリッチメニューを設定
- `store_line_configs` テーブルで店舗ごとのチャネル情報を管理

---

*最終更新: 2025-11-30*
