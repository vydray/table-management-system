import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { storeId } = req.query
      
      // storeIdが指定されていない場合はデフォルト値を使用
      const targetStoreId = storeId || 1
      
      // statusが「在籍」のキャストのみ取得
      const { data, error } = await supabase
        .from('casts')
        .select('name')
        .eq('store_id', targetStoreId)  // 店舗IDでフィルタ
        .eq('status', '在籍')            // 在籍のみフィルタ
        .not('name', 'is', null)         // 名前がnullでない
        .neq('name', '')                 // 名前が空文字でない
        .order('name')

      if (error) {
        console.error('Supabase error:', error)
        return res.status(500).json({ error: error.message })
      }

      // 名前のリストを作成（重複を除去）
      const castNames = [...new Set(data?.map(cast => cast.name) || [])]

      res.status(200).json(castNames)
    } catch (error) {
      console.error('API error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: errorMessage })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}