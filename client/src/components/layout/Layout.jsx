// components/layout/Layout.jsx
// Wrapper horizontal: Sidebar fija a la izquierda + área de contenido principal.

import Sidebar from './Sidebar';

/**
 * @param {{ children: React.ReactNode, seccionActiva: string, onCambiarSeccion: (id:string)=>void, onCargarConversacion?: (id:string)=>void, onNuevaConversacion?: ()=>void, refreshTrigger?: number }} props
 */
export default function Layout({ children, seccionActiva, onCambiarSeccion, onCargarConversacion, onNuevaConversacion, refreshTrigger }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)' }}>
      <Sidebar
        seccionActiva={seccionActiva}
        onCambiarSeccion={onCambiarSeccion}
        onCargarConversacion={onCargarConversacion}
        onNuevaConversacion={onNuevaConversacion}
        refreshTrigger={refreshTrigger}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
