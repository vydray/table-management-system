import { useState } from 'react'
import { Category } from './useCategoryData'

export const useCategoryModal = () => {
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  // 編集モーダルを開く
  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setShowEditModal(true)
  }

  // 編集モーダルを閉じる
  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingCategory(null)
    setNewCategoryName('')
  }

  // 新規カテゴリー名をクリア
  const clearCategoryName = () => {
    setNewCategoryName('')
  }

  return {
    // State
    showEditModal,
    editingCategory,
    newCategoryName,
    setNewCategoryName,

    // Functions
    openEditModal,
    closeEditModal,
    clearCategoryName
  }
}
