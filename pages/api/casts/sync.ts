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
    const { castsData } = req.body // 全データを受け取る

    try {
      // 既存のデータを全て削除
      await supabase.from('casts').delete().neq('id', 0)

      // 新しいデータを挿入
      const { error } = await supabase
        .from('casts')
        .insert(castsData)

      if (error) throw error

      // ログ出力
      console.log(`[${new Date().toISOString()}] キャスト同期成功: ${castsData.length}名（全データ）`)

      res.status(200).json({ 
        success: true, 
        count: castsData.length,
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