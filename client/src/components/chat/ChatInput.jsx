// components/chat/ChatInput.jsx
// Input de texto + botón enviar.
// Enter envía, Shift+Enter inserta nueva línea.
// Botón deshabilitado mientras cargando === true.

import { useState } from 'react';

export default function ChatInput({ onEnviar, cargando }) {
  const [texto, setTexto] = useState('');
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = texto.trim();
    if (!trimmed || cargando) return;
    onEnviar(trimmed);
    setTexto('');
  }

  return (
    <div
      style={{
        display: 'flex', gap: '0.6rem', alignItems: 'flex-end',
        padding: '0.85rem 1rem',
        background: 'var(--color-white)',
        borderTop: '1.5px solid var(--color-gris)',
      }}
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Preguntale algo a Scout..."
        rows={1}
        style={{
          flex: 1, resize: 'none', padding: '0.6rem 0.85rem',
          border: `1.5px solid ${focused ? 'var(--color-teal)' : 'var(--color-gris)'}`,
          borderRadius: 'var(--border-radius)',
          fontFamily: 'var(--font)', fontSize: '15px',
          outline: 'none', lineHeight: '1.5',
          maxHeight: '120px', overflowY: 'auto',
          transition: 'border-color 0.2s',
          color: 'var(--color-text)',
        }}
      />
      <button
        onClick={submit}
        disabled={cargando || !texto.trim()}
        style={{
          padding: '0.6rem 1.2rem', height: '40px',
          background: cargando || !texto.trim() ? 'var(--color-gris)' : 'var(--color-primary)',
          color: 'var(--color-white)', border: 'none',
          borderRadius: 'var(--border-radius)', fontSize: '15px',
          fontWeight: 600, cursor: cargando || !texto.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { if (!cargando && texto.trim()) e.target.style.background = 'var(--color-teal)'; }}
        onMouseLeave={(e) => { if (!cargando && texto.trim()) e.target.style.background = 'var(--color-primary)'; }}
      >
        Enviar
      </button>
    </div>
  );
}
