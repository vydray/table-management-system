import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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

    // パスワードをハッシュと比較
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' })
    }

    // store_idが設定されていない場合はエラー
    if (!user.store_id) {
      return res.status(403).json({ error: '店舗が設定されていません。管理者に連絡してください。' })
    }

    // ログイン成功
    res.status(200).json({
      success: true,
      username: user.username,
      role: user.role,
      userId: user.id,
      storeId: user.store_id,  // 店舗IDを追加
      message: 'ログインに成功しました'
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}