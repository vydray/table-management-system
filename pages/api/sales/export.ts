// pages/api/sales/export.ts
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { startDate, endDate } = req.query

    try {
      // paymentsテーブルからデータを取得
      let query = supabase
        .from('payments')
        .select('*')
        .order('会計時間', { ascending: false })

      if (startDate) {
        query = query.gte('会計時間', startDate)
      }
      if (endDate) {
        query = query.lte('会計時間', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // CSV形式に変換
      const csvRows = ['会計時間,テーブル番号,名前,商品名,カテゴリー,個数,税別,合計金額,現金,カード,その他']
      
      data?.forEach(row => {
        const csvRow = [
          row.会計時間,
          row.テーブル番号,
          row.名前 || '',
          row.商品名 || '',
          row.カテゴリー || '',
          row.個数 || 0,
          row.税別 || 0,
          row.合計金額 || 0,
          row.現金 || 0,
          row.カード || 0,
          row.その他 || 0
        ].join(',')
        csvRows.push(csvRow)
      })

      const csv = csvRows.join('\n')
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv')
      res.status(200).send('\uFEFF' + csv) // BOM付きで日本語対応
    } catch (error) {
      console.error('Export error:', error)
      res.status(500).json({ error: 'Export failed' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}