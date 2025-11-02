import { useState } from 'react'
import { Product } from './useProductData'

export const useProductModal = () => {
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCategory, setNewProductCategory] = useState<number | null>(null)
  const [newProductNeedsCast, setNewProductNeedsCast] = useState(false)

  // 新規追加モーダルを開く
  const openNewProductModal = (categoryId: number | null) => {
    setEditingProduct(null)
    setNewProductName('')
    setNewProductPrice('')
    setNewProductCategory(categoryId)
    setNewProductNeedsCast(false)
    setShowEditModal(true)
  }

  // 編集モーダルを開く
  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setNewProductName(product.name)
    setNewProductPrice(product.price.toString())
    setNewProductCategory(product.category_id)
    setNewProductNeedsCast(product.needs_cast || false)
    setShowEditModal(true)
  }

  // モーダルを閉じる
  const closeModal = () => {
    setShowEditModal(false)
    setEditingProduct(null)
    setNewProductName('')
    setNewProductPrice('')
    setNewProductCategory(null)
    setNewProductNeedsCast(false)
  }

  return {
    // State
    showEditModal,
    editingProduct,
    newProductName,
    setNewProductName,
    newProductPrice,
    setNewProductPrice,
    newProductCategory,
    setNewProductCategory,
    newProductNeedsCast,
    setNewProductNeedsCast,

    // Functions
    openNewProductModal,
    openEditModal,
    closeModal
  }
}
