import { getSupabaseServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

const supabase = getSupabaseServerClient()

// Supabase Auth用クライアント（anon keyで作成、signInに使用）
function getSupabaseAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body

  // 入力チェック
  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' })
  }

  try {
    // ユーザーをデータベースから検索（パスワードハッシュと店舗IDも取得）
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, role, store_id')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' })
    }

    // パスワードをハッシュと比較（bcryptハッシュと平文の両方に対応）
    let passwordMatch = false

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // bcryptハッシュの場合
      passwordMatch = await bcrypt.compare(password, user.password)
    } else {
      // 平文の場合（後方互換性のため）
      passwordMatch = password === user.password
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' })
    }

    // store_idが設定されていない場合はエラー
    if (!user.store_id) {
      return res.status(403).json({ error: '店舗が設定されていません。管理者に連絡してください。' })
    }

    // === Supabase Auth連携（RLS用） ===
    const authSecret = process.env.SUPABASE_AUTH_SECRET
    let session = null

    if (authSecret) {
      const email = `user_${user.id}@internal.local`

      // 既存のSupabase Authユーザーを確認
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === email)

      if (!existingUser) {
        // 初回：Supabase Authユーザーを作成
        const { error: createError } = await supabase.auth.admin.createUser({
          email,
          password: authSecret,
          email_confirm: true,
          app_metadata: {
            store_id: user.store_id,
            user_id: user.id,
            role: user.role
          }
        })
        if (createError) {
          console.error('Auth user creation failed:', createError)
        }
      } else {
        // 既存ユーザー：app_metadataを更新
        await supabase.auth.admin.updateUserById(existingUser.id, {
          app_metadata: {
            store_id: user.store_id,
            user_id: user.id,
            role: user.role
          }
        })
      }

      // セッションを作成（anon keyのクライアントでsignIn）
      const authClient = getSupabaseAuthClient()
      const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password: authSecret
      })

      if (!signInError && signInData.session) {
        session = {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token
        }
      }
    }

    // ログイン成功
    res.status(200).json({
      success: true,
      username: user.username,
      role: user.role,
      userId: user.id,
      storeId: user.store_id,
      message: 'ログインに成功しました',
      // Supabase Authセッション（RLS用）
      session
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}