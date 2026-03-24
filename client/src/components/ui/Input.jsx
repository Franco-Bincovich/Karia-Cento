// components/ui/Input.jsx
// Componente base de input reutilizable con estilos de marca KarIA Scout.
// Borde var(--color-gris), focus var(--color-teal), label en var(--color-primary).

import { useState } from 'react';

/**
 * @param {{ id: string, label?: string, type?: string, value: string, onChange: Function, placeholder?: string, required?: boolean, autoComplete?: string, style?: object }} props
 */
export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  autoComplete,
  style = {},
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '13px', fontWeight: 600,
            color: 'var(--color-primary)',
            fontFamily: 'var(--font)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '0.65rem 0.85rem',
          border: `1.5px solid ${focused ? 'var(--color-teal)' : 'var(--color-gris)'}`,
          borderRadius: 'var(--border-radius)',
          fontSize: '15px', outline: 'none',
          fontFamily: 'var(--font)',
          background: 'var(--color-white)',
          color: 'var(--color-text)',
          transition: 'border-color 0.2s',
          width: '100%',
        }}
      />
    </div>
  );
}
