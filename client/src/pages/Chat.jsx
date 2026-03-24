// pages/Chat.jsx
// Pantalla principal de chat de KarIA Scout.
// Layout: header fijo (logo + cerrar sesión) + área de mensajes + input fijo abajo.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

export default function Chat() {
  const { logout } = useAuth();
  const { mensajes, enviar, cargando } = useChat();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* Header fijo */}
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', height: '56px', flexShrink: 0,
          background: 'var(--color-primary)',
          boxShadow: '0 2px 8px rgba(8,28,84,0.18)',
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font)' }}>
          <span style={{ color: 'var(--color-white)' }}>kar</span>
          <span style={{ color: 'var(--color-teal)' }}>IA</span>
          <span style={{ color: 'var(--color-white)' }}> Scout</span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent', border: '1.5px solid rgba(255,255,255,0.4)',
            color: 'var(--color-white)', padding: '0.3rem 0.9rem',
            borderRadius: 'var(--border-radius)', fontSize: '13px',
            fontFamily: 'var(--font)', cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = 'var(--color-teal)'; e.target.style.background = 'rgba(67,209,201,0.12)'; }}
          onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'transparent'; }}
        >
          Cerrar sesión
        </button>
      </header>

      {/* Área de mensajes — ocupa todo el espacio disponible */}
      <MessageList mensajes={mensajes} cargando={cargando} />

      {/* Input fijo en la parte inferior */}
      <ChatInput onEnviar={enviar} cargando={cargando} />
    </div>
  );
}
