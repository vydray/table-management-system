import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ログアウト処理（将来的にはセッションの削除など）
  res.status(200).json({
    success: true,
    message: 'ログアウトしました'
  })
}