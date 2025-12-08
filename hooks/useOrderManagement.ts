import { useState } from 'react'
import { OrderItem } from '../types'
import { getCurrentStoreId } from '../utils/storeContext'

export const useOrderManagement = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: number, needsCast: boolean} | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')

  // 注文データを取得
  const loadOrderItems = async (tableId: string) => {
    try {
      const storeId = getCurrentStoreId()
      const res = await fetch(`/api/orders/current?tableId=${tableId}&storeId=${storeId}`)
      const data = await res.json()

      if (res.ok && data.length > 0) {
        interface OrderItemDB {
          product_name: string
          cast_name: string | string[] | null
          quantity: number
          unit_price: number
        }

        const items = data.map((item: OrderItemDB) => {
          // cast_nameを配列に変換（互換性のため文字列も受け付ける）
          let castArray: string[] | undefined
          if (item.cast_name) {
            if (Array.isArray(item.cast_name)) {
              castArray = item.cast_name
            } else {
              castArray = [item.cast_name]
            }
          }
          return {
            name: item.product_name,
            cast: castArray,
            quantity: item.quantity,
            price: item.unit_price
          }
        })
        setOrderItems(items)
      } else {
        setOrderItems([])  // データがない場合は空配列をセット
      }
    } catch (error) {
      console.error('Error loading order items:', error)
      setOrderItems([])  // エラーの場合も空配列をセット
    }
  }

  // 注文内容を保存
  const saveOrderItems = async (currentTable: string, silent: boolean = false) => {
    try {
      const storeId = getCurrentStoreId()
      const response = await fetch('/api/orders/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: currentTable,
          orderItems: orderItems,
          storeId: storeId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save order items')
      }

      if (!silent) {
        alert('注文内容を保存しました')
      }
    } catch (error) {
      console.error('Error saving order items:', error)
      if (!silent) {
        alert('注文内容の保存に失敗しました')
      }
    }
  }

  // 配列の内容が同じかどうかを比較
  const arraysEqual = (a?: string[], b?: string[]): boolean => {
    if (!a && !b) return true
    if (!a || !b) return false
    if (a.length !== b.length) return false
    return a.every((val, i) => val === b[i])
  }

  // 商品を直接注文に追加（タップで追加）
  const addProductToOrder = (productName: string, price: number, needsCast: boolean, castNames?: string[]) => {
    if (needsCast && (!castNames || castNames.length === 0)) {
      // キャストが必要な商品を選択
      setSelectedProduct({ name: productName, price: price, needsCast: true })
      return
    }

    // 既存の商品をチェック（商品名、キャスト名配列、価格が全て同じものを探す）
    const existingItemIndex = orderItems.findIndex(item =>
      item.name === productName &&
      item.price === price &&  // 価格も一致条件に追加
      ((!needsCast && !item.cast) || (needsCast && arraysEqual(item.cast, castNames)))
    )

    if (existingItemIndex >= 0) {
      // 既存の商品の個数を増やす
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      setOrderItems(updatedItems)
    } else {
      // 新しい商品を追加（価格が異なる場合は別商品として扱う）
      const newItem: OrderItem = {
        name: productName,
        cast: needsCast ? castNames : undefined,
        quantity: 1,
        price: price
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  // 注文アイテムを削除
  const deleteOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index)
    setOrderItems(updatedItems)
  }

  // 注文アイテムの個数を更新
  const updateOrderItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      deleteOrderItem(index)
      return
    }
    const updatedItems = [...orderItems]
    updatedItems[index].quantity = newQuantity
    setOrderItems(updatedItems)
  }

  // 注文アイテムの価格を更新
  const updateOrderItemPrice = (index: number, newPrice: number) => {
    const updatedItems = [...orderItems]
    updatedItems[index].price = newPrice
    setOrderItems(updatedItems)
  }

  return {
    // State
    orderItems,
    setOrderItems,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,

    // Functions
    loadOrderItems,
    saveOrderItems,
    addProductToOrder,
    deleteOrderItem,
    updateOrderItemQuantity,
    updateOrderItemPrice
  }
}
