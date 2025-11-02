# Supabase RLS (Row Level Security) 修正ガイド

## 重要: ログインが失敗する原因の可能性

Vercelでログインが失敗している場合、**Supabase側でRow Level Security (RLS)が有効になっている**ことが原因の可能性があります。

RLSが有効でポリシーが設定されていない場合、すべてのクエリがブロックされます。

## 確認方法

### 1. Supabaseダッシュボードで確認

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `ivgkberavxekkqgoavmo` を選択
3. 左メニューから `Authentication` → `Policies` をクリック
4. `users` テーブルのRLSステータスを確認

### 2. RLSが有効になっているか確認

`Table Editor` → `users` テーブル → 右上の歯車アイコン → `Edit table` をクリック

**RLS enabled** というトグルが**ON**になっている場合、ポリシーが必要です。

## 解決方法

### オプション1: RLSを無効にする（簡単だが非推奨）

⚠️ **本番環境では推奨しません**

```sql
-- SQL Editorで実行
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE table_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE casts DISABLE ROW LEVEL SECURITY;
```

### オプション2: 適切なRLSポリシーを設定する（推奨）

#### Service Roleキーには全アクセスを許可

```sql
-- SQL Editorで以下を実行

-- usersテーブル用ポリシー（Service Role Keyからの全アクセスを許可）
CREATE POLICY "Service role can do anything on users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- table_statusテーブル用ポリシー
CREATE POLICY "Service role can do anything on table_status"
ON table_status
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ordersテーブル用ポリシー
CREATE POLICY "Service role can do anything on orders"
ON orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- order_itemsテーブル用ポリシー
CREATE POLICY "Service role can do anything on order_items"
ON order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- productsテーブル用ポリシー
CREATE POLICY "Service role can do anything on products"
ON products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- product_categoriesテーブル用ポリシー
CREATE POLICY "Service role can do anything on product_categories"
ON product_categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- castsテーブル用ポリシー
CREATE POLICY "Service role can do anything on casts"
ON casts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### APK版（ANON KEYアクセス）用のポリシーも追加

APK版では`NEXT_PUBLIC_SUPABASE_ANON_KEY`を使用してクライアント側からアクセスするため、anonロールにも読み取りアクセスを許可する必要があります。

```sql
-- anonロール（APK版）用ポリシー - usersテーブルの読み取り専用
CREATE POLICY "Anon users can read users table"
ON users
FOR SELECT
TO anon
USING (true);

-- その他のテーブルも同様に設定（必要に応じて）
CREATE POLICY "Anon users can read table_status"
ON table_status
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon users can read and modify orders"
ON orders
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon users can read and modify order_items"
ON order_items
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon users can read products"
ON products
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon users can read product_categories"
ON product_categories
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon users can read casts"
ON casts
FOR SELECT
TO anon
USING (true);
```

## 実行手順

1. Supabaseダッシュボードにアクセス
2. 左メニューから `SQL Editor` をクリック
3. `New query` をクリック
4. 上記のSQLをコピー&ペースト
5. `Run` をクリック

## 確認

SQLを実行した後:

1. Vercelデプロイ先のURLでログインを試す
2. APK版でもログインを試す
3. 両方で正常にログインできることを確認

## トラブルシューティング

### エラー: "policy already exists"

すでにポリシーが存在する場合、以下のコマンドで削除してから再作成:

```sql
DROP POLICY IF EXISTS "Service role can do anything on users" ON users;
DROP POLICY IF EXISTS "Anon users can read users table" ON users;
-- その他のポリシーも同様に削除
```

### エラー: "permission denied"

RLSが原因でアクセスが拒否されている場合、一時的にRLSを無効化:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

ログインが成功することを確認してから、再度RLSを有効化してポリシーを設定します。

## 参考

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Policies Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
