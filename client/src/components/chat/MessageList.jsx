// components/chat/MessageList.jsx
// Lista scrolleable de mensajes. Auto-scroll al último mensaje.
// Muestra TypingIndicator mientras el agente procesa.

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const BIENVENIDA = '¡Hola! Soy Scout. Podés pedirme que busque precios, compare tiendas o te genere un reporte.';

export default function MessageList({ mensajes, cargando }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto', padding: '1rem 0',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {mensajes.length === 0 && !cargando && (
        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '420px', textAlign: 'center', padding: '2rem',
              background: 'var(--color-white)', borderRadius: '12px',
              boxShadow: 'var(--shadow)', border: '1.5px solid var(--color-teal)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👋</div>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{BIENVENIDA}</p>
          </div>
        </div>
      )}

      {mensajes.map((m) => (
        <MessageBubble key={m.id} mensaje={m} />
      ))}

      {cargando && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
