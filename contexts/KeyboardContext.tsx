import { createContext, useContext, useState, ReactNode } from 'react';

interface KeyboardContextType {
  isVisible: boolean;
  value: string;
  showKeyboard: (initialValue: string, onUpdate: (value: string) => void, getInputValue: () => string, options?: KeyboardOptions) => void;
  hideKeyboard: () => void;
  updateValue: (newValue: string) => void;
  getInputValue: () => string;
  keyboardOptions: KeyboardOptions;
}

interface KeyboardOptions {
  preferredMode?: 'romaji' | 'alphabet' | 'number';
  deleteFromFront?: boolean;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [value, setValue] = useState('');
  const [onUpdateCallback, setOnUpdateCallback] = useState<((value: string) => void) | null>(null);
  const [getInputValueCallback, setGetInputValueCallback] = useState<(() => string) | null>(null);
  const [keyboardOptions, setKeyboardOptions] = useState<KeyboardOptions>({});

  const showKeyboard = (initialValue: string, onUpdate: (value: string) => void, getInputValue: () => string, options?: KeyboardOptions) => {
    setValue(initialValue);
    // Reactで関数を状態として保存する場合、関数でラップして返す必要がある
    // () => onUpdate だと、onUpdate関数を返すだけの関数になってしまう
    // 正しくは、引数を受け取ってonUpdateに渡す関数を作る
    setOnUpdateCallback(() => (val: string) => onUpdate(val));
    setGetInputValueCallback(() => getInputValue);
    setKeyboardOptions(options || {});
    setIsVisible(true);
  };

  const hideKeyboard = () => {
    setIsVisible(false);
    setValue('');
    setOnUpdateCallback(null);
    setGetInputValueCallback(null);
  };

  const updateValue = (newValue: string) => {
    console.log('[KeyboardContext] updateValue called with:', newValue);
    console.log('[KeyboardContext] onUpdateCallback exists:', !!onUpdateCallback);
    setValue(newValue);
    if (onUpdateCallback) {
      try {
        console.log('[KeyboardContext] calling onUpdateCallback');
        onUpdateCallback(newValue);
        console.log('[KeyboardContext] onUpdateCallback completed');
      } catch (error) {
        console.error('[KeyboardContext] Error in onUpdateCallback:', error);
      }
    }
  };

  const getInputValue = () => {
    if (getInputValueCallback) {
      return getInputValueCallback();
    }
    return '';
  };

  return (
    <KeyboardContext.Provider
      value={{
        isVisible,
        value,
        showKeyboard,
        hideKeyboard,
        updateValue,
        getInputValue,
        keyboardOptions,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
