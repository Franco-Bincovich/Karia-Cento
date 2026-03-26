// components/chat/MessageBubble.jsx
// Burbuja estilo WhatsApp: usuario derecha (#081c54) | agente izquierda (#f0f0f0).
// Agente incluye avatar KarIA a la izquierda. Timestamp HH:mm en 10px.

import ReactMarkdown from 'react-markdown';
import FileDownloadButton from '../ui/FileDownloadButton';

const RE_XLSX  = /https?:\/\/\S+\.xlsx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.xlsx\b/gi;
const RE_DOCX  = /https?:\/\/\S+\.docx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.docx\b/gi;
const RE_GAMMA = /https?:\/\/\S*gamma\.app\S*/gi;
const RE_DRIVE = /https?:\/\/drive\.google\.com\S*/gi;

function nombreDeRuta(ruta) { return ruta.split(/[/\\]/).pop().split('?')[0]; }
function urlDescarga(f) { return `/api/files/download?file=${encodeURIComponent(f)}`; }
function detectarLinks(t) {
  return {
    xlsx:  [...t.matchAll(RE_XLSX)].map(m => m[0]),
    docx:  [...t.matchAll(RE_DOCX)].map(m => m[0]),
    gamma: [...t.matchAll(RE_GAMMA)].map(m => m[0]),
    drive: [...t.matchAll(RE_DRIVE)].map(m => m[0]),
  };
}
function formatHora(date) {
  return date instanceof Date
    ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '';
}

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

const s = {
  wrapper: (eu) => ({
    display: 'flex', justifyContent: eu ? 'flex-end' : 'flex-start',
    alignItems: 'flex-end', gap: '6px',
    marginBottom: '4px', padding: '0 12px',
  }),
  burbuja: (eu) => ({
    maxWidth: '70%', padding: '8px 12px',
    borderRadius: eu ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: eu ? '#081c54' : '#f0f0f0',
    color: eu ? '#ffffff' : 'var(--color-text)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word',
    fontFamily: 'var(--font)',
  }),
  hora: (eu) => ({
    fontSize: '10px', marginTop: '3px',
    textAlign: eu ? 'right' : 'left',
    color: eu ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)',
  }),
  link: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    marginTop: '6px', marginRight: '6px',
    color: 'var(--color-teal)', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
  },
  mdPre: {
    background: 'rgba(8,28,84,0.06)', borderRadius: '6px',
    padding: '6px 10px', overflowX: 'auto', fontSize: '12px',
  },
};

export default function MessageBubble({ mensaje }) {
  const eu = mensaje.rol === 'user';
  const links = eu ? null : detectarLinks(mensaje.texto);
  const tieneAcciones = links && (links.xlsx.length + links.docx.length + links.gamma.length + links.drive.length) > 0;

  return (
    <div style={s.wrapper(eu)}>
      {!eu && <AgentAvatar />}
      <div style={s.burbuja(eu)}>
        {eu ? (
          <span>{mensaje.texto}</span>
        ) : (
          <ReactMarkdown
            components={{
              pre:  ({ children }) => <pre style={s.mdPre}>{children}</pre>,
              code: ({ children }) => <code style={{ background: 'rgba(8,28,84,0.06)', borderRadius: '3px', padding: '1px 4px', fontSize: '12px' }}>{children}</code>,
              p:    ({ children }) => <p style={{ marginBottom: '4px' }}>{children}</p>,
            }}
          >
            {mensaje.texto}
          </ReactMarkdown>
        )}

        {tieneAcciones && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {links.xlsx.map((r, i) => <FileDownloadButton key={`x${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Excel" />)}
            {links.docx.map((r, i) => <FileDownloadButton key={`d${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Word" />)}
            {links.gamma.map((u, i) => <a key={`g${i}`} href={u} target="_blank" rel="noreferrer" style={s.link}>Ver presentación →</a>)}
            {links.drive.map((u, i) => <a key={`dr${i}`} href={u} target="_blank" rel="noreferrer" style={s.link}>Abrir en Drive →</a>)}
          </div>
        )}

        <div style={s.hora(eu)}>{formatHora(mensaje.timestamp)}</div>
      </div>
    </div>
  );
}
