import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 開発環境のみで使用
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'パスワードを入力してください' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    res.status(200).json({
      original: password,
      hashed: hashedPassword,
      sqlUpdate: `UPDATE users SET password = '${hashedPassword}' WHERE username = 'YOUR_USERNAME';`
    })
  } catch (error) {
    console.error('Hash error:', error)
    res.status(500).json({ error: 'ハッシュ化に失敗しました' })
  }
}