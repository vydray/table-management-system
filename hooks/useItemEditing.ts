import { useState } from 'react'

export const useItemEditing = (
  initialPrice: number,
  initialQuantity: number,
  itemIndex: number,
  onUpdatePrice?: (index: number, price: number) => void,
  onUpdateQuantity?: (index: number, quantity: number) => void
) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [tempPrice, setTempPrice] = useState(initialPrice.toString())
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(initialQuantity.toString())

  // 価格更新を送信
  const handlePriceSubmit = () => {
    const newPrice = parseInt(tempPrice)
    if (!isNaN(newPrice) && newPrice > 0 && onUpdatePrice) {
      onUpdatePrice(itemIndex, newPrice)
      setIsEditingPrice(false)
    }
  }

  // 価格編集をキャンセル
  const cancelPriceEdit = () => {
    setIsEditingPrice(false)
    setTempPrice(initialPrice.toString())
  }

  // 数量更新を送信
  const handleQuantitySubmit = () => {
    const newQuantity = parseInt(tempQuantity)
    if (!isNaN(newQuantity) && newQuantity > 0 && onUpdateQuantity) {
      onUpdateQuantity(itemIndex, newQuantity)
      setIsEditingQuantity(false)
    }
  }

  // 数量編集をキャンセル
  const cancelQuantityEdit = () => {
    setIsEditingQuantity(false)
    setTempQuantity(initialQuantity.toString())
  }

  return {
    // 価格編集
    isEditingPrice,
    setIsEditingPrice,
    tempPrice,
    setTempPrice,
    handlePriceSubmit,
    cancelPriceEdit,

    // 数量編集
    isEditingQuantity,
    setIsEditingQuantity,
    tempQuantity,
    setTempQuantity,
    handleQuantitySubmit,
    cancelQuantityEdit
  }
}
