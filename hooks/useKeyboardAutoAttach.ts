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

      // 既にinputMode="none"が設定されている場合はスキップ（無限ループ防止）
      if (target.getAttribute('inputMode') === 'none') {
        // カスタムキーボードを表示
        const currentValue = target.value;
        activeInputRef.current = target;

        // フォームまたは親コンテナを画面上部にスクロール
        setTimeout(() => {
          const container = target.closest('form') || target.closest('.login-box') || target.closest('[class*="box"]') || target.parentElement;
          if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
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
                  tracker.setValue('');
                  console.log('[useKeyboardAutoAttach] Reset React value tracker');
                }

                const inputEvent = new Event('input', { bubbles: true });
                activeInputRef.current.dispatchEvent(inputEvent);

                // カーソルを末尾に移動
                activeInputRef.current.setSelectionRange(newValue.length, newValue.length);
                console.log('[useKeyboardAutoAttach] Event dispatched successfully, cursor moved to end');
              } catch (error) {
                console.error('[useKeyboardAutoAttach] Error dispatching event:', error);
              }
            } else {
              console.warn('[useKeyboardAutoAttach] nativeInputValueSetter not found');
            }
          } else {
            console.warn('[useKeyboardAutoAttach] activeInputRef.current is null');
          }
        });
        return;
      }

      // 初回フォーカス時：inputMode="none"を設定
      target.setAttribute('inputMode', 'none');

      // フォーカスを維持したままカスタムキーボードを表示
      const currentValue = target.value;
      activeInputRef.current = target;

      // フォームまたは親コンテナを画面上部にスクロール
      setTimeout(() => {
        const container = target.closest('form') || target.closest('.login-box') || target.closest('[class*="box"]') || target.parentElement;
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
                tracker.setValue('');
                console.log('[useKeyboardAutoAttach] Reset initial React value tracker');
              }

              const inputEvent = new Event('input', { bubbles: true });
              activeInputRef.current.dispatchEvent(inputEvent);

              // カーソルを末尾に移動
              activeInputRef.current.setSelectionRange(newValue.length, newValue.length);
              console.log('[useKeyboardAutoAttach] Initial event dispatched successfully, cursor moved to end');
            } catch (error) {
              console.error('[useKeyboardAutoAttach] Error dispatching initial event:', error);
            }
          } else {
            console.warn('[useKeyboardAutoAttach] Initial nativeInputValueSetter not found');
          }
        } else {
          console.warn('[useKeyboardAutoAttach] Initial activeInputRef.current is null');
        }
      });
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
          }
          // それ以外の場合（キーボードボタンクリック等）は、元のinputにフォーカスを戻す
          else if (newFocus !== activeInputRef.current && activeInputRef.current) {
            activeInputRef.current.focus();
          }
        }, 100);
      }
    };

    // 全てのinput要素にフォーカス/ブラーイベントリスナーを追加
    document.addEventListener('focusin', handleInputFocus, true);
    document.addEventListener('focusout', handleInputBlur, true);

    return () => {
      document.removeEventListener('focusin', handleInputFocus, true);
      document.removeEventListener('focusout', handleInputBlur, true);
    };
  }, [keyboard]);
}
