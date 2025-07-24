// components/SideMenu.tsx - 元の構成にテーブル配置編集を追加

import { FC } from 'react'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  onMenuClick: (action: string) => void
}

export const SideMenu: FC<SideMenuProps> = ({ isOpen, onClose, onMenuClick }) => {
  return (
    <>
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>メニュー</h3>
          <button 
            className="menu-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="menu-items">
          <button className="menu-item" onClick={() => onMenuClick('refresh')}>
            <span className="menu-icon">🔄</span>
            データ更新
          </button>
          <button className="menu-item" onClick={() => onMenuClick('attendance')}>
            <span className="menu-icon">👥</span>
            勤怠登録
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => onMenuClick('receipts')}>
            <span className="menu-icon">📋</span>
            伝票管理
          </button>
          <button className="menu-item" onClick={() => onMenuClick('report')}>
            <span className="menu-icon">📊</span>
            レポート
          </button>
          <button className="menu-item" onClick={() => onMenuClick('table-layout')}>
            <span className="menu-icon">🎨</span>
            テーブル配置編集
          </button>
          <button className="menu-item" onClick={() => onMenuClick('settings')}>
            <span className="menu-icon">⚙️</span>
            設定
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => onMenuClick('logout')}>
            <span className="menu-icon">🚪</span>
            ログアウト
          </button>
        </div>
      </div>
      
      {/* メニューが開いている時の背景オーバーレイ */}
      {isOpen && (
        <div 
          className="menu-overlay"
          onClick={onClose}
        />
      )}
      
      <style jsx>{`
        /* Androidタブレット用のサイズ調整 */
        @media screen and (max-width: 1024px) {
          .side-menu {
            width: 280px !important;
            left: -280px !important;
          }
          
          .side-menu.open {
            left: 0 !important;
          }
          
          .menu-header {
            padding: 20px 20px !important;
          }
          
          .menu-header h3 {
            font-size: 20px !important;
          }
          
          .menu-close {
            font-size: 28px !important;
            padding: 8px !important;
          }
          
          .menu-item {
            padding: 18px 20px !important;
            font-size: 16px !important;
          }
          
          .menu-item .menu-icon {
            margin-right: 15px !important;
            font-size: 20px !important;
          }
        }
      `}</style>
    </>
  )
}