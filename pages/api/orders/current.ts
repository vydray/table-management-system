import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = getSupabaseServerClient()

interface OrderItem {
  name: string
  cast?: string[]
  quantity: number
  price: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET': {
      const { tableId, storeId } = req.query

      if (!storeId) {
        return res.status(400).json({ error: 'storeId is required' })
      }

      try {
        const { data, error } = await supabase
          .from('current_order_items')
          .select('*')
          .eq('table_id', tableId)
          .eq('store_id', storeId)
        
        if (error) throw error
        
        res.status(200).json(data || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'Failed to fetch orders' })
      }
      break
    }

    case 'POST': {
      const { tableId, orderItems, storeId } = req.body

      if (!storeId) {
        return res.status(400).json({ error: 'storeId is required' })
      }

      try {
        // 既存のアイテムを削除（同じ店舗のもののみ）
        const { error: deleteError } = await supabase
          .from('current_order_items')
          .delete()
          .eq('table_id', tableId)
          .eq('store_id', storeId)
        
        if (deleteError) throw deleteError
        
        // 新しいアイテムを挿入
        if (orderItems && orderItems.length > 0) {
          const itemsToInsert = orderItems.map((item: OrderItem) => ({
            table_id: tableId,
            product_name: item.name,
            // cast_nameを配列として保存（DBがtext[]型の場合はそのまま、text型の場合はJSON文字列化）
            cast_name: item.cast && item.cast.length > 0 ? item.cast : null,
            quantity: item.quantity,
            unit_price: item.price,
            store_id: storeId  // 店舗IDを追加
          }))
          
          const { error: insertError } = await supabase
            .from('current_order_items')
            .insert(itemsToInsert)
          
          if (insertError) throw insertError
        }
        
        res.status(200).json({ success: true })
      } catch (error) {
        console.error('Error saving orders:', error)
        res.status(500).json({ error: 'Failed to save orders' })
      }
      break
    }

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}