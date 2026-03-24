// components/chat/MessageBubble.jsx
// Burbuja de mensaje — diferencia usuario vs agente visualmente.
// Usuario: alineado derecha, fondo var(--color-primary), texto blanco.
// Agente:   alineado izquierda, fondo blanco, borde var(--color-teal).
// Detecta links de archivos generados y muestra botones/links de acción.

import ReactMarkdown from 'react-markdown';
import FileDownloadButton from '../ui/FileDownloadButton';

// Regexes para detectar patrones de archivos/links en el mensaje del agente
const RE_XLSX  = /https?:\/\/\S+\.xlsx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.xlsx\b/gi;
const RE_DOCX  = /https?:\/\/\S+\.docx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.docx\b/gi;
const RE_GAMMA = /https?:\/\/\S*gamma\.app\S*/gi;
const RE_DRIVE = /https?:\/\/drive\.google\.com\S*/gi;

/** Extrae el nombre de archivo del path/URL detectado. */
function nombreDeRuta(ruta) {
  return ruta.split(/[/\\]/).pop().split('?')[0];
}

/** Construye la URL de descarga a partir del nombre de archivo. */
function urlDescarga(nombreArchivo) {
  return `/api/files/download?file=${encodeURIComponent(nombreArchivo)}`;
}

/** Detecta links de acción en el texto y devuelve arrays de coincidencias. */
function detectarLinks(texto) {
  return {
    xlsx:  [...texto.matchAll(RE_XLSX)].map(m => m[0]),
    docx:  [...texto.matchAll(RE_DOCX)].map(m => m[0]),
    gamma: [...texto.matchAll(RE_GAMMA)].map(m => m[0]),
    drive: [...texto.matchAll(RE_DRIVE)].map(m => m[0]),
  };
}

function formatHora(date) {
  return date instanceof Date
    ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '';
}

const s = {
  wrapper: (esUsuario) => ({
    display: 'flex',
    justifyContent: esUsuario ? 'flex-end' : 'flex-start',
    marginBottom: '0.75rem', padding: '0 1rem',
  }),
  burbuja: (esUsuario) => ({
    maxWidth: '72%', padding: '0.65rem 1rem',
    borderRadius: esUsuario ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: esUsuario ? 'var(--color-primary)' : 'var(--color-white)',
    color: esUsuario ? 'var(--color-white)' : 'var(--color-text)',
    border: esUsuario ? 'none' : '1.5px solid var(--color-teal)',
    boxShadow: 'var(--shadow)', fontSize: '15px', lineHeight: '1.5', wordBreak: 'break-word',
  }),
  hora: (esUsuario) => ({
    fontSize: '11px', marginTop: '0.3rem',
    textAlign: esUsuario ? 'right' : 'left',
    color: esUsuario ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)',
  }),
  externalLink: {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    marginTop: '0.6rem', marginRight: '0.5rem',
    color: 'var(--color-teal)', fontSize: '13px', fontWeight: 600,
    textDecoration: 'none',
  },
  mdPre: {
    background: 'rgba(8,28,84,0.06)', borderRadius: '6px',
    padding: '0.5rem 0.75rem', overflowX: 'auto', fontSize: '13px',
  },
};

export default function MessageBubble({ mensaje }) {
  const esUsuario = mensaje.rol === 'user';
  const links = esUsuario ? null : detectarLinks(mensaje.texto);
  const tieneAcciones = links && (links.xlsx.length + links.docx.length + links.gamma.length + links.drive.length) > 0;

  return (
    <div style={s.wrapper(esUsuario)}>
      <div style={s.burbuja(esUsuario)}>
        {esUsuario ? (
          <span>{mensaje.texto}</span>
        ) : (
          <ReactMarkdown
            components={{
              pre:  ({ children }) => <pre style={s.mdPre}>{children}</pre>,
              code: ({ children }) => (
                <code style={{ background: 'rgba(8,28,84,0.06)', borderRadius: '3px', padding: '1px 4px', fontSize: '13px' }}>
                  {children}
                </code>
              ),
              p: ({ children }) => <p style={{ marginBottom: '0.4rem' }}>{children}</p>,
            }}
          >
            {mensaje.texto}
          </ReactMarkdown>
        )}

        {tieneAcciones && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {links.xlsx.map((r, i) => (
              <FileDownloadButton key={`xlsx-${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Excel" />
            ))}
            {links.docx.map((r, i) => (
              <FileDownloadButton key={`docx-${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Word" />
            ))}
            {links.gamma.map((url, i) => (
              <a key={`gamma-${i}`} href={url} target="_blank" rel="noreferrer" style={s.externalLink}>
                Ver presentación →
              </a>
            ))}
            {links.drive.map((url, i) => (
              <a key={`drive-${i}`} href={url} target="_blank" rel="noreferrer" style={s.externalLink}>
                Abrir en Drive →
              </a>
            ))}
          </div>
        )}

        <div style={s.hora(esUsuario)}>{formatHora(mensaje.timestamp)}</div>
      </div>
    </div>
  );
}
