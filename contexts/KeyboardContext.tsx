import { createContext, useContext, useState, ReactNode } from 'react';

interface KeyboardContextType {
  isVisible: boolean;
  value: string;
  showKeyboard: (initialValue: string, onUpdate: (value: string) => void) => void;
  hideKeyboard: () => void;
  updateValue: (newValue: string) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [value, setValue] = useState('');
  const [onUpdateCallback, setOnUpdateCallback] = useState<((value: string) => void) | null>(null);

  const showKeyboard = (initialValue: string, onUpdate: (value: string) => void) => {
    setValue(initialValue);
    setOnUpdateCallback(() => onUpdate);
    setIsVisible(true);
  };

  const hideKeyboard = () => {
    setIsVisible(false);
    setValue('');
    setOnUpdateCallback(null);
  };

  const updateValue = (newValue: string) => {
    setValue(newValue);
    if (onUpdateCallback) {
      onUpdateCallback(newValue);
    }
  };

  return (
    <KeyboardContext.Provider
      value={{
        isVisible,
        value,
        showKeyboard,
        hideKeyboard,
        updateValue,
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
