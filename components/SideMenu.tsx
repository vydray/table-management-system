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
          <button className="menu-item" onClick={() => onMenuClick('キャスト管理')}>
            <span className="menu-icon">👥</span>
            キャスト管理
          </button>
          <button className="menu-item" onClick={() => onMenuClick('勤怠管理')}>
            <span className="menu-icon">📅</span>
            勤怠管理
          </button>
          <button className="menu-item" onClick={() => onMenuClick('売上レポート')}>
            <span className="menu-icon">📊</span>
            売上レポート
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
            min-width: 40px !important;
            min-height: 40px !important;
          }
          
          .menu-item {
            padding: 16px 20px !important;
            font-size: 16px !important;
            min-height: 50px !important;
          }
          
          .menu-item .menu-icon {
            font-size: 20px !important;
            margin-right: 12px !important;
          }
          
          .menu-divider {
            margin: 15px 20px !important;
          }
        }
        
        /* スマートフォン用 */
        @media screen and (max-width: 600px) {
          .side-menu {
            width: 240px !important;
            left: -240px !important;
          }
          
          .menu-header {
            padding: 15px !important;
          }
          
          .menu-header h3 {
            font-size: 18px !important;
          }
          
          .menu-item {
            padding: 14px 15px !important;
            font-size: 14px !important;
            min-height: 44px !important;
          }
          
          .menu-item .menu-icon {
            font-size: 18px !important;
            margin-right: 10px !important;
          }
        }
      `}</style>
    </>
  )
}