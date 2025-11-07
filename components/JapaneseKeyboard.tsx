import { useState, useEffect } from 'react';

type KeyboardMode = 'romaji' | 'alphabet' | 'number';

// ローマ字→ひらがな変換マップ
const romajiToHiragana: { [key: string]: string } = {
  // 単独
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  // か行
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  // が行
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  // さ行
  'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'shi': 'し',
  // ざ行
  'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'ji': 'じ',
  // た行
  'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'chi': 'ち', 'tsu': 'つ',
  // だ行
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  // な行
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  // は行
  'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'fu': 'ふ',
  // ば行
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  // ぱ行
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  // ま行
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  // や行
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  // ら行
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  // わ行
  'wa': 'わ', 'wo': 'を', 'n': 'ん',
  // きゃ行
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  // 小文字
  'xa': 'ぁ', 'xi': 'ぃ', 'xu': 'ぅ', 'xe': 'ぇ', 'xo': 'ぉ',
  'xya': 'ゃ', 'xyu': 'ゅ', 'xyo': 'ょ',
  'xtu': 'っ', 'xtsu': 'っ',
  'xwa': 'ゎ',
  // 記号
  '-': 'ー', ',': '、', '.': '。',
};

interface JapaneseKeyboardProps {
  onChange: (value: string) => void;
  onClose: () => void;
  getInputValue: () => string;
}

export default function JapaneseKeyboard({ onChange, onClose, getInputValue }: JapaneseKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>('romaji');
  const [isShift, setIsShift] = useState(false);
  const [romajiBuffer, setRomajiBuffer] = useState('');

  // モード変更時にバッファをクリア
  useEffect(() => {
    setRomajiBuffer('');
  }, [mode]);

  const handleOverlayClick = () => {
    // フォーカスされているinput要素があればblurする
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }
    // 少し待ってからonCloseを呼ぶ（blurが完了するまで）
    setTimeout(() => {
      onClose();
    }, 50);
  };

  // ローマ字→ひらがな変換処理
  const convertRomaji = (buffer: string): { converted: string; remaining: string } => {
    // 3文字、2文字、1文字の順でマッチを試す
    for (let len = Math.min(4, buffer.length); len > 0; len--) {
      const substr = buffer.substring(0, len);
      if (romajiToHiragana[substr]) {
        return {
          converted: romajiToHiragana[substr],
          remaining: buffer.substring(len)
        };
      }
    }

    // 「n」の特殊処理：次が母音でない場合は「ん」に変換
    if (buffer.length >= 2 && buffer[0] === 'n' && !'aiueony'.includes(buffer[1])) {
      return {
        converted: 'ん',
        remaining: buffer.substring(1)
      };
    }

    // 促音（っ）の処理：同じ子音が2つ続く場合
    if (buffer.length >= 2 && buffer[0] === buffer[1] && 'kgsztdhbpmyrwn'.includes(buffer[0])) {
      return {
        converted: 'っ',
        remaining: buffer.substring(1)
      };
    }

    return { converted: '', remaining: buffer };
  };

  // ローマ字モードのキー入力
  const handleRomajiKey = (key: string) => {
    const newBuffer = romajiBuffer + key;
    console.log('[Romaji] Buffer:', newBuffer);

    const { converted, remaining } = convertRomaji(newBuffer);

    if (converted) {
      // 変換成功
      const currentValue = getInputValue();
      onChange(currentValue + converted);
      setRomajiBuffer(remaining);
      console.log('[Romaji] Converted:', converted, 'Remaining:', remaining);
    } else {
      // まだ変換できない（バッファに溜める）
      setRomajiBuffer(newBuffer);
    }
  };

  // 通常のキー入力（アルファベット・数字モード）
  const handleKeyPress = (key: string) => {
    if (key === '') return;

    if (mode === 'romaji') {
      handleRomajiKey(key.toLowerCase());
    } else {
      const currentValue = getInputValue();
      onChange(currentValue + key);
    }
  };

  const handleBackspace = () => {
    if (mode === 'romaji' && romajiBuffer.length > 0) {
      // バッファから削除
      setRomajiBuffer(romajiBuffer.slice(0, -1));
    } else {
      // 入力値から削除
      const currentValue = getInputValue();
      onChange(currentValue.slice(0, -1));
    }
  };

  const handleSpace = () => {
    // バッファをクリアしてスペース挿入
    if (mode === 'romaji') {
      setRomajiBuffer('');
    }
    const currentValue = getInputValue();
    onChange(currentValue + ' ');
  };

  // 次のモードに切り替え
  const handleModeSwitch = () => {
    const modes: KeyboardMode[] = ['romaji', 'alphabet', 'number'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  // キーボードレイアウト
  const romajiKeys = isShift ? [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ] : [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const alphabetKeys = isShift ? [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ] : [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const numberKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '.', '-'],
  ];

  const getModeLabel = () => {
    switch (mode) {
      case 'romaji': return 'あ';
      case 'alphabet': return 'A';
      case 'number': return '123';
    }
  };

  const handleKeyboardClick = (e: React.MouseEvent) => {
    // キーボード本体のクリックでは閉じない
    e.stopPropagation();
  };

  return (
    <div className="keyboard-overlay" onClick={handleOverlayClick}>
      <div className="japanese-keyboard" onClick={handleKeyboardClick}>
        <div className="keyboard-content">
        {/* ローマ字バッファ表示 */}
        {mode === 'romaji' && romajiBuffer && (
          <div className="romaji-buffer">
            {romajiBuffer}
          </div>
        )}

        {/* キーボード本体 */}
        <div className="keyboard-keys">
          {(mode === 'romaji' || mode === 'alphabet') && (
            <>
              {(mode === 'romaji' ? romajiKeys : alphabetKeys).map((row, rowIndex) => (
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
              {/* 最下段：Shift、スペース、モード切り替え、削除 */}
              <div className="key-row bottom-row">
                <button
                  className={`key shift ${isShift ? 'active' : ''}`}
                  onClick={() => setIsShift(!isShift)}
                  tabIndex={-1}
                >
                  ⇧
                </button>
                <button className="key space" onClick={handleSpace} tabIndex={-1}>
                  Space
                </button>
                <button className="key mode-switch" onClick={handleModeSwitch} tabIndex={-1}>
                  {getModeLabel()}
                </button>
                <button className="key backspace" onClick={handleBackspace} tabIndex={-1}>
                  ⌫
                </button>
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
              {/* 最下段：スペース、モード切り替え、削除 */}
              <div className="key-row bottom-row">
                <button className="key space" onClick={handleSpace} tabIndex={-1}>
                  Space
                </button>
                <button className="key mode-switch" onClick={handleModeSwitch} tabIndex={-1}>
                  {getModeLabel()}
                </button>
                <button className="key backspace" onClick={handleBackspace} tabIndex={-1}>
                  ⌫
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      <style jsx>{`
        .keyboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 45vh;
          background: transparent;
          z-index: 9998;
        }

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

        .romaji-buffer {
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 18px;
          font-weight: bold;
          color: #ff9800;
          text-align: center;
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
          min-width: 50px;
          height: 50px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 6px;
          font-size: 20px;
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

        .bottom-row {
          margin-top: 10px;
        }

        .key.shift,
        .key.mode-switch,
        .key.backspace {
          min-width: 60px;
          background: #f0f0f0;
          font-weight: bold;
        }

        .key.shift.active {
          background: #ff9800;
          color: white;
        }

        .key.space {
          flex: 1;
          min-width: 200px;
        }

        @media (max-width: 600px) {
          .key {
            min-width: 40px;
            height: 45px;
            font-size: 16px;
          }

          .key.shift,
          .key.mode-switch,
          .key.backspace {
            min-width: 50px;
          }

          .key.space {
            min-width: 150px;
          }

          .keyboard-overlay {
            bottom: 40vh;
          }

          .japanese-keyboard {
            max-height: 40vh;
          }
        }
      `}</style>
    </div>
  );
}
