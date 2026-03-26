// components/layout/SidebarHistorial.jsx
// Lista de conversaciones previas — últimas 10.
// Muestra título (primeras palabras) + fecha DD/MM/YYYY HH:mm.

function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const yy  = d.getFullYear();
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

const S = {
  wrapper: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(67,209,201,0.3) transparent',
  },
  empty: { padding: '8px 16px', color: 'rgba(186,186,186,0.5)', fontSize: '12px' },
  item: {
    padding: '9px 16px',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '12px',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
};

/**
 * @param {{ conversaciones: Array<{id:string,titulo?:string,created_at?:string,updated_at?:string}>, onCargar: (id:string)=>void }} props
 */
export default function SidebarHistorial({ conversaciones, onCargar }) {
  return (
    <div style={S.wrapper}>
      {!conversaciones.length && <div style={S.empty}>Sin historial aún</div>}

      {conversaciones.map((c) => {
        const titulo = c.titulo || `Conversación ${c.id.slice(0, 8)}`;
        const fecha  = formatFecha(c.updated_at || c.created_at);
        return (
          <div
            key={c.id}
            style={S.item}
            title={titulo}
            onClick={() => onCargar && onCargar(c.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderLeftColor = 'var(--color-teal)';
              e.currentTarget.style.color = 'var(--color-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeftColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
            }}
          >
            <span style={{ flexShrink: 0, marginTop: '1px' }}>💬</span>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titulo}
              </div>
              {fecha && (
                <div style={{ fontSize: '10px', color: 'rgba(186,186,186,0.55)', marginTop: '1px' }}>
                  {fecha}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
