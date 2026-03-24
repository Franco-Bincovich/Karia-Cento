// components/chat/TypingIndicator.jsx
// Tres puntos animados mientras el agente procesa.
// Misma burbuja de agente con animación CSS de puntos en var(--color-teal).

const keyframes = `
@keyframes karia-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1;   }
}`;

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 1rem', marginBottom: '0.75rem' }}>
      <style>{keyframes}</style>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '0.65rem 1rem',
          background: 'var(--color-white)',
          border: '1.5px solid var(--color-teal)',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: 'var(--shadow)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: 'var(--color-teal)',
              animation: `karia-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
