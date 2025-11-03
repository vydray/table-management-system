import { useEffect, useRef } from 'react'

export const useModalPosition = () => {
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // モーダルが開いたときにbodyのスクロールを無効化
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width

    // iOSでのスクロール固定
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    // モーダルの位置を自動調整
    const adjustModalPosition = () => {
      if (modalContentRef.current) {
        // 親モーダル（注文モーダル）を取得
        const parentModal = document.querySelector('#modal')
        if (parentModal) {
          // 親モーダルのスクロール位置とサイズを取得
          const parentScrollTop = parentModal.scrollTop

          // ビューポートのサイズを取得
          const viewportHeight = window.innerHeight

          // モーダルコンテンツのサイズを取得
          const modalHeight = modalContentRef.current.offsetHeight

          // 表示位置を計算（親モーダルのスクロール位置を考慮）
          // ビューポートの中央に配置
          let topPosition = parentScrollTop + (viewportHeight - modalHeight) / 2

          // 最小値を設定（画面上部から最低20px）
          topPosition = Math.max(topPosition, parentScrollTop + 20)

          // 最大値を設定（親モーダルの下部を超えないように）
          const parentScrollHeight = parentModal.scrollHeight
          const maxTop = parentScrollHeight - modalHeight - 20
          topPosition = Math.min(topPosition, maxTop)

          // 位置を設定
          modalContentRef.current.style.position = 'absolute'
          modalContentRef.current.style.top = `${topPosition}px`
          modalContentRef.current.style.left = '50%'
          modalContentRef.current.style.transform = 'translateX(-50%)'
          modalContentRef.current.style.maxHeight = `${viewportHeight - 40}px`
          modalContentRef.current.style.overflowY = 'auto'
        }
      }
    }

    // 初回の位置調整
    setTimeout(adjustModalPosition, 0)

    // 親モーダルのスクロールイベントをリッスン（オプション）
    const parentModal = document.querySelector('#modal')
    if (parentModal) {
      parentModal.addEventListener('scroll', adjustModalPosition)
    }

    // ウィンドウのリサイズイベントをリッスン
    window.addEventListener('resize', adjustModalPosition)

    return () => {
      // モーダルが閉じたときに元に戻す
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      window.scrollTo(0, scrollY)

      // イベントリスナーを削除
      if (parentModal) {
        parentModal.removeEventListener('scroll', adjustModalPosition)
      }
      window.removeEventListener('resize', adjustModalPosition)
    }
  }, [])

  return modalContentRef
}
