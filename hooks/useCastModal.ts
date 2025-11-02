import { useState } from 'react'
import { Cast } from './useCastData'

export const useCastModal = () => {
  const [showCastModal, setShowCastModal] = useState(false)
  const [editingCast, setEditingCast] = useState<Cast | null>(null)
  const [isNewCast, setIsNewCast] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [showRetirementModal, setShowRetirementModal] = useState(false)
  const [retirementDate, setRetirementDate] = useState('')
  const [retirementCast, setRetirementCast] = useState<Cast | null>(null)

  // キャスト編集モーダルを開く
  const openEditModal = (cast: Cast) => {
    setEditingCast(cast)
    setIsNewCast(false)
    setShowCastModal(true)
  }

  // 新規キャスト追加モーダルを開く
  const openNewCastModal = (initialCast: Cast) => {
    setEditingCast(initialCast)
    setIsNewCast(true)
    setShowCastModal(true)
  }

  // キャストモーダルを閉じる
  const closeCastModal = () => {
    setShowCastModal(false)
    setEditingCast(null)
    setIsNewCast(false)
  }

  // 役職モーダルを開く
  const openPositionModal = () => {
    setShowPositionModal(true)
  }

  // 役職モーダルを閉じる
  const closePositionModal = () => {
    setShowPositionModal(false)
    setNewPositionName('')
  }

  // 退店モーダルを開く
  const openRetirementModal = (cast: Cast) => {
    setRetirementCast(cast)
    setRetirementDate(new Date().toISOString().split('T')[0])
    setShowRetirementModal(true)
  }

  // 退店モーダルを閉じる
  const closeRetirementModal = () => {
    setShowRetirementModal(false)
    setRetirementCast(null)
    setRetirementDate('')
  }

  return {
    // State
    showCastModal,
    editingCast,
    setEditingCast,
    isNewCast,
    showPositionModal,
    newPositionName,
    setNewPositionName,
    showRetirementModal,
    retirementDate,
    setRetirementDate,
    retirementCast,

    // Functions
    openEditModal,
    openNewCastModal,
    closeCastModal,
    openPositionModal,
    closePositionModal,
    openRetirementModal,
    closeRetirementModal
  }
}
