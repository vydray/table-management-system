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
    console.log('=== ログイン試行 ===')
    console.log('ユーザー名:', username)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Key存在:', !!process.env.SUPABASE_SERVICE_KEY)

    // ユーザーをデータベースから検索（パスワードハッシュと店舗IDも取得）
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, role, store_id')
      .eq('username', username)
      .single()

    console.log('DBエラー:', error)
    console.log('ユーザー取得:', user ? 'あり' : 'なし')

    if (error || !user) {
      console.log('ユーザーが見つかりません')
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' })
    }

    // パスワードをハッシュと比較
    console.log('パスワードハッシュ確認中...')
    const passwordMatch = await bcrypt.compare(password, user.password)
    console.log('パスワード照合結果:', passwordMatch)

    if (!passwordMatch) {
      console.log('パスワードが一致しません')
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