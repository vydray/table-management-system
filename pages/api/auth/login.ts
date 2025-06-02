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
    // ユーザーをデータベースから検索（パスワードハッシュも取得）
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, role')
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

    // パスワードを除外してレスポンス
    const { password: _, ...userWithoutPassword } = user

    // ログイン成功
    res.status(200).json({
      success: true,
      username: user.username,
      role: user.role,
      userId: user.id,
      message: 'ログインに成功しました'
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}