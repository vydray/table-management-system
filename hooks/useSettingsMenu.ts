import { useState } from 'react'

export interface MenuItem {
  id: string
  label: string
  icon: string
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'system', label: 'システム設定', icon: '⚙️' },
  { id: 'products', label: '商品管理', icon: '🛍️' },
  { id: 'categories', label: 'カテゴリー管理', icon: '📁' },
  { id: 'cast', label: 'キャスト管理', icon: '👥' },
  { id: 'attendance', label: '勤怠ステータス', icon: '📊' },
  { id: 'receipt', label: 'レシート設定', icon: '🧾' }
]

export const useSettingsMenu = (initialMenu: string = 'system') => {
  const [activeMenu, setActiveMenu] = useState(initialMenu)

  const getActiveMenuLabel = () => {
    return MENU_ITEMS.find(item => item.id === activeMenu)?.label
  }

  return {
    activeMenu,
    setActiveMenu,
    menuItems: MENU_ITEMS,
    getActiveMenuLabel
  }
}
