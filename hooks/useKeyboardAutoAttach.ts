import { useEffect, useRef } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

export function useKeyboardAutoAttach() {
  const keyboard = useKeyboard();
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;

      // input要素のみを対象
      if (target.tagName !== 'INPUT') return;

      // type="date", type="checkbox", type="radio"などは除外
      const excludedTypes = ['date', 'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image'];
      if (excludedTypes.includes(target.type)) return;

      // disabledの場合は除外（readOnlyはチェックしない）
      if (target.disabled) return;

      // 手動でキーボードを管理する要素は除外
      if (target.getAttribute('data-manual-keyboard') === 'true') return;

      // 既にinputMode="none"が設定されている場合はスキップ（無限ループ防止）
      if (target.getAttribute('inputMode') === 'none') {
        // カスタムキーボードを表示
        const currentValue = target.value;
        activeInputRef.current = target;

        // 必要に応じて画面をスクロール（最小限の移動）
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }, 100);

        keyboard.showKeyboard(currentValue, (newValue) => {
          console.log('[useKeyboardAutoAttach] Callback called with:', newValue);
          if (activeInputRef.current) {
            console.log('[useKeyboardAutoAttach] Setting input value to:', newValue);
            activeInputRef.current.value = newValue;

            // React用のイベントトリガー
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;

            if (nativeInputValueSetter) {
              try {
                console.log('[useKeyboardAutoAttach] Triggering native input event');
                nativeInputValueSetter.call(activeInputRef.current, newValue);

                // Reset React's internal value tracker to force change detection
                const tracker = (activeInputRef.current as any)._valueTracker;
                if (tracker) {
                  // 新しい値と確実に異なる値にリセット（空文字列の場合は特殊文字）
                  tracker.setValue(newValue === '' ? '\u0000' : '');
                  console.log('[useKeyboardAutoAttach] Reset React value tracker to detect change');
                }

                const inputEvent = new Event('input', { bubbles: true });
                activeInputRef.current.dispatchEvent(inputEvent);

                // カーソルを末尾に移動（Reactの再レンダリング後に実行）
                setTimeout(() => {
                  if (activeInputRef.current) {
                    activeInputRef.current.setSelectionRange(newValue.length, newValue.length);
                    console.log('[useKeyboardAutoAttach] Cursor moved to end');
                  }
                }, 0);
                console.log('[useKeyboardAutoAttach] Event dispatched successfully');
              } catch (error) {
                console.error('[useKeyboardAutoAttach] Error dispatching event:', error);
              }
            } else {
              console.warn('[useKeyboardAutoAttach] nativeInputValueSetter not found');
            }
          } else {
            console.warn('[useKeyboardAutoAttach] activeInputRef.current is null');
          }
        }, () => activeInputRef.current?.value || '');
        return;
      }

      // 初回フォーカス時：inputMode="none"を設定
      target.setAttribute('inputMode', 'none');

      // フォーカスを維持したままカスタムキーボードを表示
      const currentValue = target.value;
      activeInputRef.current = target;

      // 必要に応じて画面をスクロール（最小限の移動）
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }, 100);

      keyboard.showKeyboard(currentValue, (newValue) => {
        console.log('[useKeyboardAutoAttach] Initial callback called with:', newValue);
        if (activeInputRef.current) {
          console.log('[useKeyboardAutoAttach] Setting initial input value to:', newValue);
          activeInputRef.current.value = newValue;

          // React用のイベントトリガー
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            try {
              console.log('[useKeyboardAutoAttach] Triggering initial native input event');
              nativeInputValueSetter.call(activeInputRef.current, newValue);

              // Reset React's internal value tracker to force change detection
              const tracker = (activeInputRef.current as any)._valueTracker;
              if (tracker) {
                // 新しい値と確実に異なる値にリセット（空文字列の場合は特殊文字）
                tracker.setValue(newValue === '' ? '\u0000' : '');
                console.log('[useKeyboardAutoAttach] Reset initial React value tracker to detect change');
              }

              const inputEvent = new Event('input', { bubbles: true });
              activeInputRef.current.dispatchEvent(inputEvent);

              // カーソルを末尾に移動（Reactの再レンダリング後に実行）
              setTimeout(() => {
                if (activeInputRef.current) {
                  activeInputRef.current.setSelectionRange(newValue.length, newValue.length);
                  console.log('[useKeyboardAutoAttach] Initial cursor moved to end');
                }
              }, 0);
              console.log('[useKeyboardAutoAttach] Initial event dispatched successfully');
            } catch (error) {
              console.error('[useKeyboardAutoAttach] Error dispatching initial event:', error);
            }
          } else {
            console.warn('[useKeyboardAutoAttach] Initial nativeInputValueSetter not found');
          }
        } else {
          console.warn('[useKeyboardAutoAttach] Initial activeInputRef.current is null');
        }
      }, () => activeInputRef.current?.value || '');
    };

    const handleInputBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target === activeInputRef.current) {
        // キーボードを閉じる（別のinput要素にフォーカスが移った場合のみ）
        // キーボードのボタンをクリックした場合は閉じない
        setTimeout(() => {
          const newFocus = document.activeElement;

          // 新しいフォーカス先が別のinput要素の場合のみキーボードを閉じる
          if (newFocus && newFocus.tagName === 'INPUT' && newFocus !== activeInputRef.current) {
            keyboard.hideKeyboard();
            activeInputRef.current = null;
            return;
          }

          // Enterボタンがクリックされた場合は、フォーカスを戻さない
          const isEnterButton = newFocus && (
            newFocus instanceof HTMLElement &&
            (newFocus.classList.contains('enter-key') ||
             newFocus.closest('.enter-key'))
          );

          if (isEnterButton) {
            // Enterボタンがクリックされた場合はフォーカスを戻さず、キーボードを閉じる
            activeInputRef.current = null;
            return;
          }

          // それ以外の場合（キーボードの通常ボタンクリック等）
          if (newFocus !== activeInputRef.current && activeInputRef.current) {
            // キーボードのボタン（完了以外）がクリックされた場合はフォーカスを戻す
            const isKeyboardButton = newFocus && newFocus instanceof HTMLElement &&
              (newFocus.classList.contains('key') ||
               newFocus.closest('.japanese-keyboard'));

            if (isKeyboardButton && keyboard.isVisible) {
              // キーボードのボタンがクリックされた場合はフォーカスを戻す
              const cursorPos = activeInputRef.current.value.length;
              activeInputRef.current.focus();
              setTimeout(() => {
                if (activeInputRef.current) {
                  activeInputRef.current.setSelectionRange(cursorPos, cursorPos);
                }
              }, 0);
            } else if (!keyboard.isVisible) {
              // キーボードが閉じられている場合はクリーンアップ
              activeInputRef.current = null;
            }
          }
        }, 100);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // キーボードが表示されていない場合は何もしない
      if (!keyboard.isVisible) return;

      // クリックされた要素がキーボード内部の場合は何もしない
      const isKeyboardClick = target.closest('.japanese-keyboard');
      if (isKeyboardClick) return;

      // クリックされた要素がアクティブなinput要素の場合は何もしない
      if (target === activeInputRef.current) return;

      // クリックされた要素が別のinput要素の場合は、そちらにフォーカスが移るので何もしない
      // （handleInputFocusが自動的に処理する）
      if (target.tagName === 'INPUT') return;

      // それ以外の場合は、キーボードを閉じてinputのフォーカスを外す
      if (activeInputRef.current) {
        activeInputRef.current.blur();
        keyboard.hideKeyboard();
        activeInputRef.current = null;
      }
    };

    // 全てのinput要素にフォーカス/ブラーイベントリスナーを追加
    document.addEventListener('focusin', handleInputFocus, true);
    document.addEventListener('focusout', handleInputBlur, true);
    // キーボード以外をタップしたときにキーボードを閉じる
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('focusin', handleInputFocus, true);
      document.removeEventListener('focusout', handleInputBlur, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [keyboard]);
}
