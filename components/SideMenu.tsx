// components/SideMenu.tsx を修正

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
          <button className="menu-item" onClick={() => onMenuClick('ホーム')}>
            <span className="menu-icon">🏠</span>
            ホーム
          </button>
          <button className="menu-item" onClick={() => onMenuClick('データ取得')}>
            <span className="menu-icon">🔄</span>
            データ取得
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => onMenuClick('キャスト')}>
            <span className="menu-icon">👥</span>
            キャスト
          </button>
          <button className="menu-item" onClick={() => onMenuClick('勤怠管理')}>
            <span className="menu-icon">📅</span>
            勤怠管理
          </button>
          <button className="menu-item" onClick={() => onMenuClick('レポート')}>
            <span className="menu-icon">📊</span>
            レポート
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => onMenuClick('テーブル配置編集')}>
            <span className="menu-icon">🎨</span>
            テーブル配置編集
          </button>
          <button className="menu-item" onClick={() => onMenuClick('設定')}>
            <span className="menu-icon">⚙️</span>
            設定
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => onMenuClick('ログアウト')}>
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