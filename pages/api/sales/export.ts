import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// 型定義を追加
interface OrderItem {
  product_name: string
  cast_name: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

interface Payment {
  cash_amount: number
  credit_card_amount: number
  other_payment_amount: number
}

interface Order {
  id: string
  checkout_datetime: string
  table_number: string
  staff_name: string | null
  subtotal_excl_tax: number
  tax_amount: number
  total_incl_tax: number
  order_items: OrderItem[]
  payments: Payment[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { startDate, endDate } = req.query

    try {
      // ordersとorder_itemsを結合して取得
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items!inner(
            product_name,
            cast_name,
            quantity,
            unit_price,
            subtotal
          ),
          payments!inner(
            cash_amount,
            credit_card_amount,
            other_payment_amount
          )
        `)
        .order('checkout_datetime', { ascending: false })

      if (startDate) {
        query = query.gte('checkout_datetime', startDate as string)
      }
      if (endDate) {
        query = query.lte('checkout_datetime', endDate as string)
      }

      const { data, error } = await query

      if (error) throw error

      // CSV形式に変換
      const csvRows = ['会計時間,テーブル番号,お客様名,メインキャスト,商品名,担当キャスト,数量,単価,小計,現金,カード,その他,税抜合計,税額,税込合計']
      
      const orders = data as Order[]
      
      orders?.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item: OrderItem, index: number) => {
            const payment = order.payments?.[0] || {} as Payment
            const row = [
              order.checkout_datetime,
              order.table_number,
              '', // お客様名（ordersテーブルには無いので空欄）
              order.staff_name || '',
              item.product_name,
              item.cast_name || '',
              item.quantity,
              item.unit_price,
              item.subtotal,
              index === 0 ? payment.cash_amount || 0 : '',
              index === 0 ? payment.credit_card_amount || 0 : '',
              index === 0 ? payment.other_payment_amount || 0 : '',
              index === 0 ? order.subtotal_excl_tax : '',
              index === 0 ? order.tax_amount : '',
              index === 0 ? order.total_incl_tax : ''
            ].join(',')
            csvRows.push(row)
          })
        }
      })

      const csv = csvRows.join('\n')
      
      // BOM付きでUTF-8として出力（Excelでの文字化け防止）
      const bom = '\uFEFF'
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.csv`)
      res.status(200).send(bom + csv)
    } catch (error) {
      console.error('Export error:', error)
      res.status(500).json({ error: 'Export failed' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}