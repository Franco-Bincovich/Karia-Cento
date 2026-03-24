// components/ui/FileDownloadButton.jsx
// Botón de descarga para archivos generados por el agente (.xlsx, .docx).
// Fondo var(--color-teal), texto var(--color-primary), ícono ↓.
// Al clickear → fetch al backend /api/files/download y dispara la descarga.

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * @param {{ url: string, nombre: string }} props
 * url  — URL del endpoint de descarga (ej: /api/files/download?file=archivo.xlsx)
 * nombre — nombre visible + nombre del archivo al guardar
 */
export default function FileDownloadButton({ url, nombre }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState(false);
  const { token } = useAuth();

  async function handleClick() {
    setDescargando(true);
    setError(false);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(true);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={descargando}
      title={error ? 'No se pudo descargar el archivo' : nombre}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        marginTop: '0.6rem',
        padding: '0.45rem 0.9rem',
        background: error ? 'var(--color-gris)' : 'var(--color-teal)',
        color: 'var(--color-primary)',
        border: 'none', borderRadius: 'var(--border-radius)',
        fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
        cursor: descargando ? 'wait' : 'pointer',
        transition: 'opacity 0.2s',
        opacity: descargando ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: '15px' }}>{error ? '✕' : '↓'}</span>
      {descargando ? 'Descargando…' : error ? 'Error al descargar' : nombre}
    </button>
  );
}
