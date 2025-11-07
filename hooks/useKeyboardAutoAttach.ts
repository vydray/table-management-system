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

        keyboard.showKeyboard(currentValue, (newValue) => {
          if (activeInputRef.current) {
            activeInputRef.current.value = newValue;

            // React用のイベントトリガー
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;

            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(activeInputRef.current, newValue);
              const inputEvent = new Event('input', { bubbles: true });
              activeInputRef.current.dispatchEvent(inputEvent);
            }
          }
        });
        return;
      }

      // 初回フォーカス時：inputMode="none"を設定
      target.setAttribute('inputMode', 'none');

      // フォーカスを維持したままカスタムキーボードを表示
      const currentValue = target.value;
      activeInputRef.current = target;

      keyboard.showKeyboard(currentValue, (newValue) => {
        if (activeInputRef.current) {
          activeInputRef.current.value = newValue;

          // React用のイベントトリガー
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(activeInputRef.current, newValue);
            const inputEvent = new Event('input', { bubbles: true });
            activeInputRef.current.dispatchEvent(inputEvent);
          }
        }
      });
    };

    const handleInputBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target === activeInputRef.current) {
        // キーボードを閉じる（別の要素にフォーカスが移った場合のみ）
        setTimeout(() => {
          if (document.activeElement !== activeInputRef.current) {
            keyboard.hideKeyboard();
            activeInputRef.current = null;
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
