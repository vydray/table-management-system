import { useState } from 'react'
import { AttendanceStatusItem } from './useAttendanceStatusData'

export const useAttendanceStatusModal = () => {
  const [showAddStatus, setShowAddStatus] = useState(false)
  const [showEditStatus, setShowEditStatus] = useState(false)
  const [editingStatus, setEditingStatus] = useState<AttendanceStatusItem | null>(null)
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#4ECDC4')

  // 追加モーダルを開く
  const openAddModal = () => {
    setShowAddStatus(true)
  }

  // 追加モーダルを閉じる
  const closeAddModal = () => {
    setShowAddStatus(false)
    setNewStatusName('')
    setNewStatusColor('#4ECDC4')
  }

  // 編集モーダルを開く
  const openEditModal = (status: AttendanceStatusItem) => {
    setEditingStatus(status)
    setNewStatusName(status.name)
    setNewStatusColor(status.color)
    setShowEditStatus(true)
  }

  // 編集モーダルを閉じる
  const closeEditModal = () => {
    setShowEditStatus(false)
    setEditingStatus(null)
    setNewStatusName('')
    setNewStatusColor('#4ECDC4')
  }

  return {
    // State
    showAddStatus,
    showEditStatus,
    editingStatus,
    newStatusName,
    setNewStatusName,
    newStatusColor,
    setNewStatusColor,

    // Functions
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal
  }
}
