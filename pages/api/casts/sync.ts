import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // APIキーで認証
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.SYNC_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    const { casts } = req.body

    try {
      // 既存のキャストを全て削除
      await supabase.from('casts').delete().neq('id', 0)

      // 新しいキャストを挿入
      const { error } = await supabase
        .from('casts')
        .insert(casts.map((name: string) => ({ name, active: true })))

      if (error) throw error

      // ログ出力
      console.log(`[${new Date().toISOString()}] キャスト同期成功: ${casts.length}名`)

      res.status(200).json({ 
        success: true, 
        count: casts.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('同期エラー:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: errorMessage })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}