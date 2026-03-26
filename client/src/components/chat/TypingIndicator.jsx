// components/chat/TypingIndicator.jsx
// Tres puntos con animación bounce dentro de burbuja gris (igual al agente).
// Incluye avatar KarIA a la izquierda, mismo layout que MessageBubble.

const keyframes = `
@keyframes karia-bounce {
  0%, 60%, 100% { transform: translateY(0);   opacity: 0.5; }
  30%            { transform: translateY(-6px); opacity: 1;   }
}`;

function AgentAvatar() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0, alignSelf: 'flex-end', marginBottom: '2px' }}>
      <circle cx="14" cy="14" r="13" fill="#43d1c9" />
      <circle cx="10" cy="12" r="2" fill="#081c54" />
      <circle cx="18" cy="12" r="2" fill="#081c54" />
      <path d="M9 18 Q14 22 19 18" stroke="#081c54" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '6px', padding: '0 12px', marginBottom: '4px' }}>
      <style>{keyframes}</style>
      <AgentAvatar />
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '10px 14px',
          background: '#f0f0f0',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: '#888',
              animation: `karia-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
