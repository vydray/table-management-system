import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET': {
      const { tableId } = req.query
      
      try {
        const { data, error } = await supabase
          .from('current_order_items')
          .select('*')
          .eq('table_id', tableId)
        
        if (error) throw error
        
        res.status(200).json(data || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'Failed to fetch orders' })
      }
      break
    }

    case 'POST': {
      const { tableId, orderItems } = req.body
      
      try {
        // 既存のアイテムを削除
        const { error: deleteError } = await supabase
          .from('current_order_items')
          .delete()
          .eq('table_id', tableId)
        
        if (deleteError) throw deleteError
        
        // 新しいアイテムを挿入
        if (orderItems && orderItems.length > 0) {
          const itemsToInsert = orderItems.map((item: OrderItem) => ({
            table_id: tableId,
            product_name: item.name,
            cast_name: item.cast || null,
            quantity: item.quantity,
            unit_price: item.price
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