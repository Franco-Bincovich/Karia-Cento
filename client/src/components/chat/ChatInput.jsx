// components/chat/ChatInput.jsx
// Input compacto estilo WhatsApp: altura 44px, bordes redondeados, botón circular.
// Enter envía, Shift+Enter inserta nueva línea.

import { useState } from 'react';

const SEND_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ChatInput({ onEnviar, cargando, placeholder = 'Escribí un mensaje...' }) {
  const [texto, setTexto] = useState('');
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function submit() {
    const trimmed = texto.trim();
    if (!trimmed || cargando) return;
    onEnviar(trimmed);
    setTexto('');
  }

  const activo = !cargando && !!texto.trim();

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px',
        background: '#ffffff',
        borderTop: '1px solid #e9e9e9',
      }}
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1, resize: 'none',
          padding: '10px 16px',
          height: '44px', maxHeight: '120px',
          border: `1.5px solid ${focused ? 'var(--color-teal)' : '#e0e0e0'}`,
          borderRadius: '22px',
          fontFamily: 'var(--font)', fontSize: '13px',
          outline: 'none', lineHeight: '1.5',
          overflowY: 'auto', color: 'var(--color-text)',
          background: '#f9f9f9',
          transition: 'border-color 0.2s',
        }}
      />
      <button
        onClick={submit}
        disabled={!activo}
        title="Enviar"
        style={{
          width: '44px', height: '44px', flexShrink: 0,
          borderRadius: '50%', border: 'none',
          background: activo ? 'var(--color-teal)' : '#d0d0d0',
          color: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: activo ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseEnter={(e) => { if (activo) e.currentTarget.style.background = '#33bdb5'; }}
        onMouseLeave={(e) => { if (activo) e.currentTarget.style.background = 'var(--color-teal)'; }}
        onMouseDown={(e) => { if (activo) e.currentTarget.style.transform = 'scale(0.93)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {SEND_ICON}
      </button>
    </div>
  );
}
