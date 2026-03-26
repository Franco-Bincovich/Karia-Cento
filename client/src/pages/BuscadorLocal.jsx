// pages/BuscadorLocal.jsx
// Buscador mockeado de precios en tiendas locales de Córdoba.
// Misma estructura visual que el Buscador Universal.

import { useState } from 'react';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';

const TIENDAS = [
  { nombre: 'ElectroSur',   direccion: 'Av. Colón 1234, Nueva Córdoba' },
  { nombre: 'Casa Gómez',   direccion: 'San Martín 567, Centro' },
  { nombre: 'Hogar Centro', direccion: 'Obispo Trejo 890, Centro' },
  { nombre: 'TechMundo',    direccion: 'Av. Vélez Sársfield 2301, Alberdi' },
  { nombre: 'ElectroFácil', direccion: 'Bv. San Juan 445, San Vicente' },
];

const VARIACIONES = [0, 0.07, -0.05, 0.12, -0.08];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h);
}

function generarResultados(producto) {
  const base = (hashStr(producto.toLowerCase().trim()) % 400000) + 80000;
  return TIENDAS
    .map((t, i) => ({ ...t, precio: Math.round((base * (1 + VARIACIONES[i])) / 100) * 100 }))
    .sort((a, b) => a.precio - b.precio);
}

function formatPeso(n) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

function ResultadoCard({ tienda, esMejorPrecio }) {
  return (
    <div style={{
      background: 'var(--color-white)', borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--shadow)', padding: '14px 20px',
      border: `1.5px solid ${esMejorPrecio ? 'var(--color-teal)' : '#e9e9e9'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-primary)' }}>
            {tienda.nombre}
          </span>
          {esMejorPrecio && (
            <span style={{
              background: 'var(--color-teal)', color: 'var(--color-primary)',
              fontSize: '10px', fontWeight: 700, padding: '2px 8px',
              borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Mejor precio
            </span>
          )}
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
          📍 {tienda.direccion}
        </div>
      </div>
      <div style={{
        fontSize: '18px', fontWeight: 700, flexShrink: 0,
        color: esMejorPrecio ? 'var(--color-teal)' : 'var(--color-primary)',
      }}>
        {formatPeso(tienda.precio)}
      </div>
    </div>
  );
}

const BUSQUEDA_INICIAL = 'Lavarropas Samsung 10kg';

export default function BuscadorLocal() {
  const [resultados, setResultados] = useState(() => generarResultados(BUSQUEDA_INICIAL));
  const [buscando, setBuscando] = useState(false);
  const [ultimaBusqueda, setUltimaBusqueda] = useState(BUSQUEDA_INICIAL);

  function buscar(producto) {
    setBuscando(true);
    setUltimaBusqueda(producto);
    setTimeout(() => {
      setResultados(generarResultados(producto));
      setBuscando(false);
    }, 900);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', background: 'var(--chat-bg)' }}>

        {!resultados && !buscando && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem', background: 'var(--color-white)', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1.5px solid var(--color-teal)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏪</div>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Escribí un producto y comparamos precios en tiendas locales de Córdoba.
              </p>
            </div>
          </div>
        )}

        {buscando && <TypingIndicator />}

        {resultados && !buscando && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '700px', width: '100%', margin: '0 auto' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Resultados para: <strong style={{ color: 'var(--color-primary)' }}>{ultimaBusqueda}</strong>
            </div>
            {resultados.map((t, i) => (
              <ResultadoCard key={t.nombre} tienda={t} esMejorPrecio={i === 0} />
            ))}
          </div>
        )}

      </div>
      <ChatInput onEnviar={buscar} cargando={buscando} placeholder="Buscá un producto... ej: heladera 380L" />
    </div>
  );
}
