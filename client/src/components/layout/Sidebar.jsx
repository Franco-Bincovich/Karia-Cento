// components/layout/Sidebar.jsx
// Sidebar colapsable. Expandida: 260px | Colapsada: 64px (solo íconos).
// Secciones: FUNCIONALIDADES (acordeón) + CONVERSACIONES (acordeón).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { conversacionesApi } from '../../services/api';
import SidebarHistorial from './SidebarHistorial';

const SECCIONES = [
  { id: 'universal', icon: '🔍', label: 'Buscador Universal' },
  { id: 'local',     icon: '🏪', label: 'Buscador Local' },
  { id: 'tareas',    icon: '📅', label: 'Tareas Programadas' },
];

function KariaIsotipo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="13" fill="#43d1c9" />
      <circle cx="10" cy="12" r="2" fill="#081c54" />
      <circle cx="18" cy="12" r="2" fill="#081c54" />
      <path d="M9 18 Q14 22 19 18" stroke="#081c54" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function NavItem({ icon, label, collapsed, onClick, activo }) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', color: activo ? 'var(--color-teal)' : 'rgba(255,255,255,0.85)', borderLeft: `3px solid ${activo ? 'var(--color-teal)' : 'transparent'}`, background: activo ? 'rgba(67,209,201,0.1)' : 'transparent', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', transition: 'background 0.15s' }}
      onMouseEnter={(e) => { if (!activo) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderLeftColor = 'rgba(67,209,201,0.5)'; } }}
      onMouseLeave={(e) => { if (!activo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span style={{ fontWeight: activo ? 600 : 500 }}>{label}</span>}
    </div>
  );
}

function AccordionSection({ title, open, onToggle, children, collapsed }) {
  if (collapsed) return <>{children}</>;
  return (
    <div>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 2px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ color: 'rgba(186,186,186,0.6)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <span style={{ color: 'rgba(186,186,186,0.5)', fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && children}
    </div>
  );
}

/**
 * @param {{ seccionActiva: string, onCambiarSeccion: (id:string)=>void, onCargarConversacion?: (id:string)=>void, onNuevaConversacion?: ()=>void, refreshTrigger?: number }} props
 */
export default function Sidebar({ seccionActiva, onCambiarSeccion, onCargarConversacion, onNuevaConversacion, refreshTrigger = 0 }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [conversaciones, setConvs] = useState([]);
  const [openFunc, setOpenFunc]   = useState(true);
  const [openConvs, setOpenConvs] = useState(true);

  useEffect(() => {
    if (!token) return;
    conversacionesApi.listar(token)
      .then((d) => setConvs((Array.isArray(d) ? d : d.conversaciones ?? []).slice(0, 10)))
      .catch(() => {});
  }, [token, refreshTrigger]);

  const w = collapsed ? 64 : 260;
  const initials = user?.nombre ? user.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  function handleLogout() { logout(); navigate('/login', { replace: true }); }
  function handleCargar(id) { onCambiarSeccion('universal'); onCargarConversacion?.(id); }
  function handleNueva() { onNuevaConversacion?.(); onCambiarSeccion('universal'); }

  return (
    <aside style={{ width: w, minWidth: w, background: 'var(--color-primary)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', borderRight: '1px solid rgba(67,209,201,0.15)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '12px 14px', height: '56px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <KariaIsotipo />
            <span style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--color-white)' }}>kar</span>
              <span style={{ color: 'var(--color-teal)' }}>IA</span>
              <span style={{ color: 'var(--color-white)' }}> Scout</span>
            </span>
          </div>
        )}
        <button onClick={() => setCollapsed((c) => !c)} title="Menú" style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '20px', cursor: 'pointer', padding: '4px', flexShrink: 0, lineHeight: 1 }}>☰</button>
      </div>

      {/* Perfil */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0 }}>{initials}</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', marginLeft: '10px' }}>
            <div style={{ color: 'var(--color-white)', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre || 'Usuario'}</div>
            <div style={{ color: 'var(--color-gris)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.rol || 'Agente'}</div>
          </div>
        )}
      </div>

      {/* Nueva conversación */}
      <div style={{ padding: '10px 14px', flexShrink: 0 }}>
        <button
          onClick={handleNueva}
          title={collapsed ? 'Nueva conversación' : undefined}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '8px', background: 'var(--color-teal)', color: 'var(--color-primary)', border: 'none', borderRadius: '8px', padding: collapsed ? '8px 0' : '8px 14px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <span style={{ fontSize: '15px' }}>✏️</span>
          {!collapsed && 'Nueva conversación'}
        </button>
      </div>

      {/* FUNCIONALIDADES */}
      <div style={{ flexShrink: 0 }}>
        <AccordionSection title="Funcionalidades" open={openFunc} onToggle={() => setOpenFunc(o => !o)} collapsed={collapsed}>
          {SECCIONES.map(({ id, icon, label }) => (
            <NavItem key={id} icon={icon} label={label} collapsed={collapsed} activo={seccionActiva === id} onClick={() => onCambiarSeccion(id)} />
          ))}
        </AccordionSection>
      </div>

      {/* CONVERSACIONES — solo expandida */}
      {!collapsed && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <AccordionSection title="Conversaciones" open={openConvs} onToggle={() => setOpenConvs(o => !o)} collapsed={false}>
            <SidebarHistorial conversaciones={conversaciones} onCargar={handleCargar} />
          </AccordionSection>
        </div>
      )}

      {/* Logout */}
      <div style={{ marginTop: 'auto', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <NavItem icon="🚪" label="Cerrar sesión" collapsed={collapsed} onClick={handleLogout} />
      </div>
    </aside>
  );
}
