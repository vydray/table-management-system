# Vercelデプロイメント チェックリスト

## 現在の状態

最新のコミット: `feb7443` - ESLintエラー修正完了
- APKとVercel両対応のログイン実装済み
- 環境変数設定済み（ユーザー確認済み）

## ログインが失敗する場合の診断手順

### 1. ブラウザのDevToolsでエラーを確認

1. Vercelデプロイ先のURLにアクセス
2. `F12`キーを押してDevToolsを開く
3. `Console`タブを選択
4. ログインを試行
5. 赤色のエラーメッセージを確認

#### 予想されるエラーと対処法

**エラー: `Failed to fetch` または `NetworkError`**
- 原因: `/api/auth/login` エンドポイントにアクセスできない
- 対処: Vercelのデプロイメントログを確認

**エラー: `401 Unauthorized`**
- 原因: パスワードまたはユーザー名が間違っている、またはデータベース接続エラー
- 対処: Supabaseダッシュボードで該当ユーザーの存在を確認

**エラー: `500 Internal Server Error`**
- 原因: サーバー側のエラー（環境変数未設定、データベース接続失敗など）
- 対処: Vercelのデプロイメントログ（Runtime Logs）を確認

### 2. Vercelの環境変数を確認

Vercelダッシュボードで以下の環境変数が設定されているか確認:

```
NEXT_PUBLIC_SUPABASE_URL=https://ivgkberavxekkqgoavmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**: 環境変数を変更した場合、再デプロイが必要です。

### 3. Vercelのデプロイメントログを確認

1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. `Deployments`タブをクリック
4. 最新のデプロイメントをクリック
5. `Runtime Logs`を確認してエラーメッセージを探す

### 4. 再デプロイを試す

環境変数を変更した場合や、キャッシュが原因の可能性がある場合:

1. Vercelダッシュボード → プロジェクト → `Deployments`
2. 最新のデプロイメントの右側の`...`メニューをクリック
3. `Redeploy`を選択
4. `Use existing Build Cache`のチェックを**外す**
5. `Redeploy`をクリック

## APKビルド手順（参考）

APK版をビルドする場合:

```bash
# 環境変数を設定してビルド
set CAPACITOR_BUILD=true && npm run build

# Androidプロジェクトに同期
npx cap sync android

# Android Studioで開く
npx cap open android
```

Android Studioで:
1. `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. ビルド完了後、`locate`リンクをクリックしてAPKファイルを取得

## 認証の仕組み

### Vercel版（Webアプリ）
- `pages/login.tsx` → `/api/auth/login` APIルートを呼び出し
- APIルートがSupabaseでユーザー認証
- サーバー側でパスワード検証（bcrypt）

### APK版（Androidアプリ）
- `pages/login.tsx` → Capacitor検出により直接Supabase接続
- クライアント側でパスワード検証（bcrypt）
- API routes不使用（静的エクスポートのため）

## トラブルシューティング

### 問題: ログインフォームは表示されるがログインできない

**確認事項:**
1. ブラウザのConsoleにエラーが表示されているか
2. NetworkタブでAPI呼び出しが成功しているか（Status: 200, 401, 500など）
3. Vercelの環境変数が正しく設定されているか

### 問題: ログイン後にリダイレクトされない

**確認事項:**
1. localStorage に値が保存されているか（DevTools → Application → Local Storage）
2. Next.jsのルーターが正しく動作しているか

### 問題: APKで白い画面が表示される

**対処済み:** `MainActivity.java`でWebView初期化遅延を実装済み
- アプリを再起動することで解決するはずです
- それでも解決しない場合は画面分割を使用してみてください

## サポートが必要な場合

以下の情報を提供してください:
1. ブラウザのConsoleのエラーメッセージ（スクリーンショット）
2. VercelのRuntime Logsのエラーメッセージ
3. 試したユーザー名（パスワードは含めない）
4. Supabaseで該当ユーザーが存在するか確認した結果
