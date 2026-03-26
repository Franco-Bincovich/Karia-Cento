// components/chat/MessageList.jsx
// Lista scrolleable de mensajes. Auto-scroll al último mensaje.
// Muestra TypingIndicator mientras el agente procesa.
// Muestra banner de fecha cuando se carga una conversación guardada.

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const BIENVENIDA = `¡Hola! Soy KarIA Scout de Cento. Puedo ayudarte con:

🔍 Buscador Universal — consultá precios de electrodomésticos en las principales cadenas del país (Naldo, OnCity, Cetrogar, Megatone, Frávega)

📍 Buscador Local — consultá precios en las tiendas locales de Córdoba

¿Qué producto querés buscar hoy?`;

function formatFechaBanner(date) {
  if (!date) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ mensajes, cargando, conversacionFecha }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto', padding: '12px 0',
        display: 'flex', flexDirection: 'column',
        background: 'var(--chat-bg)',
      }}
    >
      {mensajes.length === 0 && !cargando && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem', background: 'var(--color-white)', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1.5px solid var(--color-teal)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👋</div>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.8', whiteSpace: 'pre-line', textAlign: 'left' }}>{BIENVENIDA}</p>
          </div>
        </div>
      )}

      {conversacionFecha && mensajes.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          📅 Conversación del {formatFechaBanner(conversacionFecha)}
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
