import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

const supabase = getSupabaseServerClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password, role = 'staff' } = req.body

  // 入力チェック
  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' })
  }

  // パスワードの強度チェック
  if (password.length < 8) {
    return res.status(400).json({ error: 'パスワードは8文字以上にしてください' })
  }

  try {
    // 既存ユーザーのチェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return res.status(409).json({ error: 'このユーザー名は既に使用されています' })
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // ユーザーを作成
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          password: hashedPassword,
          role
        }
      ])
      .select('id, username, role')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({
      success: true,
      message: 'ユーザーを作成しました',
      user: newUser
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'ユーザー作成に失敗しました' })
  }
}