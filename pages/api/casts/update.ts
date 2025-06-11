// toggleCastShowInPos関数を修正
const toggleCastShowInPos = async (cast: Cast) => {
  try {
    const storeId = getCurrentStoreId()
    const newValue = !cast.show_in_pos
    
    const response = await fetch('/api/casts/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: cast.id,
        storeId: storeId,
        show_in_pos: newValue
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update')
    }
    
    setCasts(prev => prev.map(c => 
      c.id === cast.id ? { ...c, show_in_pos: newValue } : c
    ))
  } catch (error) {
    console.error('Error toggling show_in_pos:', error)
    alert('更新に失敗しました')
  }
}

// updateCast関数も修正
const updateCast = async () => {
  if (!editingCast) return

  try {
    const storeId = getCurrentStoreId()
    
    const response = await fetch('/api/casts/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: editingCast.id,
        storeId: storeId,
        name: editingCast.name,
        twitter: editingCast.twitter,
        instagram: editingCast.instagram,
        attributes: editingCast.attributes,
        status: editingCast.status,
        show_in_pos: editingCast.show_in_pos
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update')
    }
    
    alert('キャスト情報を更新しました')
    loadCasts()
    setShowCastModal(false)
    setEditingCast(null)
  } catch (error) {
    console.error('Failed to update cast:', error)
    alert('更新に失敗しました')
  }
}