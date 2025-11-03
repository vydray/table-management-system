import { Cast } from './useCastData'

export const useCastHandlers = (
  addNewCast: (cast: Cast) => Promise<boolean>,
  updateCast: (cast: Cast) => Promise<boolean>,
  deleteCast: (cast: Cast) => Promise<boolean>,
  updateCastStatus: (cast: Cast, newStatus: string) => Promise<boolean>,
  retireCast: (cast: Cast, retirementDate: string) => Promise<boolean>,
  updateCastPosition: (cast: Cast, newPosition: string) => Promise<boolean>,
  toggleCastShowInPos: (cast: Cast) => Promise<boolean>,
  addPositionData: (name: string) => Promise<boolean>,
  setCasts: React.Dispatch<React.SetStateAction<Cast[]>>,
  closeCastModal: () => void,
  closePositionModal: () => void,
  closeRetirementModal: () => void,
  openRetirementModal: (cast: Cast) => void,
  setNewPositionName: React.Dispatch<React.SetStateAction<string>>
) => {
  // ステータスの背景色を取得
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case '在籍':
        return '#e6f7e6'
      case '体験':
        return '#fff7e6'
      case '退店':
        return '#f0f0f0'
      default:
        return '#ffffff'
    }
  }

  // 役職追加のラッパー関数
  const addPosition = async (newPositionName: string) => {
    const success = await addPositionData(newPositionName)
    if (success) {
      setNewPositionName('')
      closePositionModal()
    }
  }

  // 新規キャスト追加のラッパー関数
  const handleAddNewCast = async (editingCast: Cast | null) => {
    if (!editingCast) return
    const success = await addNewCast(editingCast)
    if (success) {
      closeCastModal()
    }
  }

  // キャスト更新のラッパー関数
  const handleUpdateCast = async (editingCast: Cast | null) => {
    if (!editingCast) return
    const success = await updateCast(editingCast)
    if (success) {
      closeCastModal()
    }
  }

  // キャスト削除のラッパー関数
  const handleDeleteCast = async (editingCast: Cast | null) => {
    if (!editingCast) return
    const success = await deleteCast(editingCast)
    if (success) {
      closeCastModal()
    }
  }

  // ステータス更新のラッパー関数（退店モーダル処理を含む）
  const handleUpdateCastStatus = async (cast: Cast, newStatus: string) => {
    if (newStatus === '退店') {
      openRetirementModal(cast)
      return
    }
    await updateCastStatus(cast, newStatus)
  }

  // 退店処理のラッパー関数
  const confirmRetirement = async (retirementCast: Cast | null, retirementDate: string) => {
    if (!retirementCast || !retirementDate) return
    const success = await retireCast(retirementCast, retirementDate)
    if (success) {
      closeRetirementModal()
    }
  }

  // UIヘルパー：楽観的UI更新付きの役職更新
  const handleUpdateCastPosition = async (cast: Cast, newPosition: string) => {
    const success = await updateCastPosition(cast, newPosition)
    if (success) {
      setCasts(prev => prev.map(c =>
        c.id === cast.id ? { ...c, attributes: newPosition } : c
      ))
    }
  }

  // UIヘルパー：楽観的UI更新付きのPOS表示切り替え
  const handleToggleCastShowInPos = async (cast: Cast) => {
    const success = await toggleCastShowInPos(cast)
    if (success) {
      setCasts(prev => prev.map(c =>
        c.id === cast.id ? { ...c, show_in_pos: !cast.show_in_pos } : c
      ))
    }
  }

  return {
    getStatusColor,
    addPosition,
    handleAddNewCast,
    handleUpdateCast,
    handleDeleteCast,
    handleUpdateCastStatus,
    confirmRetirement,
    handleUpdateCastPosition,
    handleToggleCastShowInPos
  }
}
