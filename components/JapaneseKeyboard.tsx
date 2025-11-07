import { useState } from 'react';

type KeyboardMode = 'hiragana' | 'alphabet' | 'number';

interface JapaneseKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function JapaneseKeyboard({ value, onChange, onClose }: JapaneseKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>('hiragana');
  const [isShift, setIsShift] = useState(false);

  const handleClose = () => {
    // フォーカスを外してからキーボードを閉じる
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  // ひらがなキー配列（あかさたな順）
  const hiraganaKeys = [
    ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
    ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '', 'り', 'を'],
    ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', 'ん'],
    ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '', 'れ', 'ー'],
    ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', '、'],
  ];

  // アルファベットキー配列（QWERTY）
  const alphabetKeys = isShift ? [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ] : [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  // 数字キー配列
  const numberKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '.', '-'],
  ];

  const handleKeyPress = (key: string) => {
    if (key === '') return;
    onChange(value + key);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    onChange(value + ' ');
  };

  // 濁点変換
  const handleDakuten = () => {
    if (value.length === 0) return;
    const lastChar = value[value.length - 1];
    const dakutenMap: { [key: string]: string } = {
      'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
      'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
      'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
      'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
    };
    if (dakutenMap[lastChar]) {
      onChange(value.slice(0, -1) + dakutenMap[lastChar]);
    }
  };

  // 半濁点変換
  const handleHandakuten = () => {
    if (value.length === 0) return;
    const lastChar = value[value.length - 1];
    const handakutenMap: { [key: string]: string } = {
      'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ',
    };
    if (handakutenMap[lastChar]) {
      onChange(value.slice(0, -1) + handakutenMap[lastChar]);
    }
  };

  // 小文字変換
  const handleSmall = () => {
    if (value.length === 0) return;
    const lastChar = value[value.length - 1];
    const smallMap: { [key: string]: string } = {
      'あ': 'ぁ', 'い': 'ぃ', 'う': 'ぅ', 'え': 'ぇ', 'お': 'ぉ',
      'や': 'ゃ', 'ゆ': 'ゅ', 'よ': 'ょ',
      'つ': 'っ', 'わ': 'ゎ',
    };
    if (smallMap[lastChar]) {
      onChange(value.slice(0, -1) + smallMap[lastChar]);
    }
  };

  return (
    <div className="japanese-keyboard">
      <div className="keyboard-content">
        {/* モード切り替えボタン */}
        <div className="mode-buttons">
          <button
            className={mode === 'hiragana' ? 'active' : ''}
            onClick={() => setMode('hiragana')}
            tabIndex={-1}
          >
            あ
          </button>
          <button
            className={mode === 'alphabet' ? 'active' : ''}
            onClick={() => setMode('alphabet')}
            tabIndex={-1}
          >
            A
          </button>
          <button
            className={mode === 'number' ? 'active' : ''}
            onClick={() => setMode('number')}
            tabIndex={-1}
          >
            123
          </button>
        </div>

        {/* キーボード本体 */}
        <div className="keyboard-keys">
          {mode === 'hiragana' && (
            <>
              {hiraganaKeys.map((row, rowIndex) => (
                <div key={rowIndex} className="key-row">
                  {row.map((key, keyIndex) => (
                    <button
                      key={keyIndex}
                      className={`key ${key === '' ? 'empty' : ''}`}
                      onClick={() => handleKeyPress(key)}
                      disabled={key === ''}
                      tabIndex={-1}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              {/* 特殊キー行 */}
              <div className="key-row special-row">
                <button className="key special" onClick={handleDakuten} tabIndex={-1}>゛</button>
                <button className="key special" onClick={handleHandakuten} tabIndex={-1}>゜</button>
                <button className="key special" onClick={handleSmall} tabIndex={-1}>小</button>
                <button className="key wide" onClick={handleSpace} tabIndex={-1}>スペース</button>
                <button className="key special" onClick={handleBackspace} tabIndex={-1}>⌫</button>
              </div>
            </>
          )}

          {mode === 'alphabet' && (
            <>
              {alphabetKeys.map((row, rowIndex) => (
                <div key={rowIndex} className="key-row">
                  {row.map((key, keyIndex) => (
                    <button
                      key={keyIndex}
                      className="key"
                      onClick={() => handleKeyPress(key)}
                      tabIndex={-1}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              {/* 特殊キー行 */}
              <div className="key-row special-row">
                <button
                  className={`key special ${isShift ? 'active' : ''}`}
                  onClick={() => setIsShift(!isShift)}
                  tabIndex={-1}
                >
                  ⇧
                </button>
                <button className="key wide" onClick={handleSpace} tabIndex={-1}>Space</button>
                <button className="key special" onClick={handleBackspace} tabIndex={-1}>⌫</button>
              </div>
            </>
          )}

          {mode === 'number' && (
            <>
              {numberKeys.map((row, rowIndex) => (
                <div key={rowIndex} className="key-row">
                  {row.map((key, keyIndex) => (
                    <button
                      key={keyIndex}
                      className="key"
                      onClick={() => handleKeyPress(key)}
                      tabIndex={-1}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              {/* 特殊キー行 */}
              <div className="key-row special-row">
                <button className="key wide" onClick={handleSpace} tabIndex={-1}>Space</button>
                <button className="key special" onClick={handleBackspace} tabIndex={-1}>⌫</button>
              </div>
            </>
          )}
        </div>

        {/* 閉じるボタン */}
        <button className="close-button" onClick={handleClose} tabIndex={-1}>
          閉じる
        </button>
      </div>

      <style jsx>{`
        .japanese-keyboard {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #e8e8e8;
          padding: 12px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
          z-index: 9999;
          max-height: 45vh;
          overflow-y: auto;
        }

        .keyboard-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .mode-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          justify-content: center;
        }

        .mode-buttons button {
          padding: 12px 24px;
          border: 2px solid #ccc;
          background: white;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-buttons button.active {
          background: #ff9800;
          color: white;
          border-color: #ff9800;
        }

        .keyboard-keys {
          background: white;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .key-row {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
          justify-content: center;
        }

        .key {
          min-width: 60px;
          height: 60px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 6px;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          touch-action: manipulation;
        }

        .key:active {
          background: #ddd;
          transform: scale(0.95);
        }

        .key.empty {
          visibility: hidden;
          pointer-events: none;
        }

        .key.wide {
          min-width: 180px;
        }

        .key.special {
          background: #f0f0f0;
          font-weight: bold;
        }

        .key.special.active {
          background: #ff9800;
          color: white;
        }

        .special-row {
          margin-top: 10px;
        }

        .close-button {
          width: 100%;
          padding: 14px;
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
          touch-action: manipulation;
        }

        .close-button:active {
          background: #e68900;
        }

        @media (max-width: 600px) {
          .key {
            min-width: 45px;
            height: 50px;
            font-size: 18px;
          }

          .key.wide {
            min-width: 130px;
          }

          .japanese-keyboard {
            max-height: 40vh;
          }
        }
      `}</style>
    </div>
  );
}
