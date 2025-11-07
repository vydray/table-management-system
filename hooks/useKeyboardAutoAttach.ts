import { useEffect } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';

export function useKeyboardAutoAttach() {
  const keyboard = useKeyboard();

  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;

      // input要素のみを対象
      if (target.tagName !== 'INPUT') return;

      // type="date", type="checkbox", type="radio"などは除外
      const excludedTypes = ['date', 'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image'];
      if (excludedTypes.includes(target.type)) return;

      // readOnlyまたはdisabledの場合は除外
      if (target.readOnly || target.disabled) return;

      // カスタムキーボードを表示
      target.blur(); // ネイティブキーボードを非表示

      const currentValue = target.value;

      keyboard.showKeyboard(currentValue, (newValue) => {
        target.value = newValue;

        // onChangeイベントを手動でトリガー
        const event = new Event('input', { bubbles: true });
        target.dispatchEvent(event);

        // React用のイベントもトリガー
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(target, newValue);
          const inputEvent = new Event('input', { bubbles: true });
          target.dispatchEvent(inputEvent);
        }
      });

      // inputMode="none"を設定してネイティブキーボードを完全にブロック
      target.setAttribute('inputMode', 'none');
      target.setAttribute('readonly', 'true');
    };

    // 全てのinput要素にフォーカスイベントリスナーを追加
    document.addEventListener('focusin', handleInputFocus, true);

    return () => {
      document.removeEventListener('focusin', handleInputFocus, true);
    };
  }, [keyboard]);
}
