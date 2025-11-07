import { useKeyboard } from '../contexts/KeyboardContext';

interface CustomInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: 'text' | 'number';
  required?: boolean;
}

export default function CustomInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  type = 'text',
  required = false,
}: CustomInputProps) {
  const keyboard = useKeyboard();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur();
    if (!disabled) {
      keyboard.showKeyboard(value, onChange);
    }
  };

  return (
    <input
      type={type === 'number' ? 'tel' : 'text'}
      inputMode="none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      required={required}
      readOnly
    />
  );
}
