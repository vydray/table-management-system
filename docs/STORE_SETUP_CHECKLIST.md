# 店舗追加セットアップチェックリスト

新しい店舗を追加する際に必要な設定一覧。

---

## 1. データベース設定

### 1.1 storesテーブルに店舗追加

```sql
INSERT INTO stores (store_name, store_code)
VALUES ('新店舗名', 'NEW_STORE');
```

追加後、`store_id` を確認しておく（以降の設定で使用）。

### 1.2 store_line_configsテーブル

→ **vi-admin の LINE設定ページで設定可能**（後述のMessaging API設定後）

### 1.3 RLS設定（新テーブル作成時のみ）

新しいテーブルを作成した場合は、RLSポリシーを追加：

```sql
ALTER TABLE [新テーブル名] ENABLE ROW LEVEL SECURITY;

-- store_id カラムがあるテーブルの場合
CREATE POLICY "[テーブル名]_all_own_store" ON [新テーブル名]
FOR ALL USING (
  store_id = (auth.jwt() -> 'app_metadata' ->> 'store_id')::integer
);
```

※ 既存テーブルのRLSポリシーは `RLS_APPLY.sql` で一括管理されています。

---

## 2. LINE Developers Console設定

LINE Developers Console: https://developers.line.biz/

### 2.1 Messaging API チャンネル（LINE Bot用）

1. **プロバイダー** → 対象プロバイダーを選択（なければ新規作成）
2. **新規チャンネル作成** → 「Messaging API」を選択
3. 必要情報を入力してチャンネル作成

#### 取得する情報

| 項目 | 取得場所 | 設定先 |
|------|---------|--------|
| Channel ID | チャネル基本設定 → チャネルID | vi-admin LINE設定 |
| Channel Secret | チャネル基本設定 → チャネルシークレット | vi-admin LINE設定 |
| Channel Access Token | Messaging API設定 → チャネルアクセストークン（発行ボタン） | vi-admin LINE設定 |

#### Webhook設定

「Messaging API設定」タブで：

| 項目 | 設定値 |
|------|--------|
| Webhook URL | `https://shift-management-vydray.vercel.app/api/line/webhook/{store_id}` |
| Webhookの利用 | **オン** |
| 応答メッセージ | **オフ** |
| あいさつメッセージ | 任意 |

### 2.2 LINE ログイン チャンネル（LIFF/Webアプリログイン用）

1. **新規チャンネル作成** → 「LINE ログイン」を選択
2. 必要情報を入力してチャンネル作成

#### LIFF アプリ作成

「LIFF」タブで「追加」をクリック：

| 項目 | 設定値 |
|------|--------|
| LIFFアプリ名 | 任意（例: シフト管理アプリ） |
| サイズ | Full |
| エンドポイントURL | `https://shift-management-vydray.vercel.app/liff/login` |
| Scope | profile, openid |

#### 取得する情報

| 項目 | 取得場所 | 設定先 |
|------|---------|--------|
| LIFF ID | LIFFタブ → 作成したLIFFアプリのLIFF ID | Vercel環境変数 |

---

## 3. LINE Official Account Manager設定

LINE Official Account Manager: https://manager.line.biz/

### 3.1 リッチメニュー作成

1. 対象アカウントを選択
2. 「リッチメニュー」→「作成」
3. テンプレート: **3分割**を選択
4. 各ボタンのアクション設定：

| ボタン | タイプ | テキスト |
|--------|--------|----------|
| 左 | テキスト | `シフト提出` |
| 中央 | テキスト | `事前欠席` |
| 右 | テキスト | `シフト確認` |

5. 画像をアップロード（各ボタンのラベル画像）
6. 表示期間を設定して保存

---

## 4. Vercel環境変数設定

Vercel Dashboard → shift-management-app → Settings → Environment Variables

### 新店舗用に追加する環境変数

```bash
# LIFF ID（店舗ごとに追加）
NEXT_PUBLIC_LIFF_ID_STORE_{N}=xxxx-xxxxxxxx   # LINE ログインのLIFFタブで取得
```

例: store_id=3 の場合
```bash
NEXT_PUBLIC_LIFF_ID_STORE_3=1234567890-xxxxxxxx
```

### 既存の共通環境変数（初回のみ設定済み）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CRON_SECRET=shift-notification-secret-2024-vydray
```

---

## 5. vi-admin LINE設定ページ

vi-admin: https://vi-admin-vydray.vercel.app/line-settings

1. 「新規設定」ボタンをクリック
2. 店舗を選択
3. 以下を入力：

| 項目 | 値 |
|------|-----|
| Channel ID | Messaging APIチャンネルのチャネルID |
| Channel Secret | Messaging APIチャンネルのチャネルシークレット |
| Channel Access Token | Messaging APIチャンネルで発行したトークン |
| Discord Webhook URL | （オプション）通知用DiscordのWebhook URL |

4. 「設定を追加」をクリック

---

## 6. コード修正（必要な場合のみ）

### 6.1 LIFF ID の店舗判定ロジック

`src/pages/liff/login.tsx` で新店舗のLIFF IDを追加：

```typescript
const liffId1 = process.env.NEXT_PUBLIC_LIFF_ID_STORE_1
const liffId2 = process.env.NEXT_PUBLIC_LIFF_ID_STORE_2
const liffId3 = process.env.NEXT_PUBLIC_LIFF_ID_STORE_3  // 追加

// 店舗判定ロジックにも追加
if (context && context.liffId === liffId3) {
  storeId = 3
}
```

**注意**: コード修正後は再デプロイが必要。

---

## 7. 動作確認チェックリスト

### LINE Bot

- [ ] リッチメニューが表示される
- [ ] 「シフト提出」でシフト入力フローが開始
- [ ] 「事前欠席」で欠席登録フローが開始
- [ ] 「シフト確認」で今週のシフトが表示
- [ ] 未登録ユーザーに登録案内が送られる

### Webアプリ

- [ ] LINEアプリ内でWebページが開く
- [ ] 自動的にログインされる
- [ ] シフト提出ができる
- [ ] シフト確認ができる

### 通知（設定している場合）

- [ ] Discordに欠席通知が届く
- [ ] 毎日13:00にリマインダーが送信される

---

## クイックリファレンス

### 設定に必要なURLまとめ

| 用途 | URL |
|------|-----|
| LINE Developers Console | https://developers.line.biz/ |
| LINE Official Account Manager | https://manager.line.biz/ |
| vi-admin LINE設定 | https://vi-admin-vydray.vercel.app/line-settings |
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |

### 店舗ごとに設定が必要なもの

1. **データベース**: storesテーブルに店舗追加
2. **LINE Developers**: Messaging APIチャンネル作成
3. **LINE Developers**: LINE ログインチャンネル + LIFF作成
4. **LINE Official Account Manager**: リッチメニュー作成
5. **Vercel環境変数**: LIFF ID追加
6. **vi-admin**: LINE設定ページで設定
7. **コード**: LIFF判定ロジック追加（デプロイ）

---

## 更新履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-30 | 初版作成 |
