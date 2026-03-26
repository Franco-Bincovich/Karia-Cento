// pages/TareasProgramadas.jsx
// Sección de tareas programadas de monitoreo de precios — UI mockeada.

import { useState } from 'react';

const TIENDAS_OPTS = [
  'ElectroSur', 'Casa Gómez', 'Hogar Centro', 'TechMundo', 'ElectroFácil',
  'Naldo', 'Frávega', 'Megatone', 'Cetrogar', 'OnCity',
];

const TAREAS_MOCK = [
  { id: 1, producto: 'Smart TV 55" 4K',        tiendas: ['Naldo', 'Frávega', 'Megatone'],           formato: 'Excel',          frecuencia: 'Diaria',  horario: '08:00', activa: true  },
  { id: 2, producto: 'Heladera No Frost 380L', tiendas: ['ElectroSur', 'Casa Gómez', 'TechMundo'], formato: 'Resumen en chat', frecuencia: 'Semanal', horario: '09:00', activa: true  },
  { id: 3, producto: 'Aire Acond. 3000 Frg.',  tiendas: ['Cetrogar', 'OnCity', 'Hogar Centro'],    formato: 'Excel',          frecuencia: 'Mensual', horario: '07:30', activa: false },
];

const FORM_INIT = { producto: '', tiendas: [], formato: 'Excel', frecuencia: 'Diaria', horario: '08:00' };

const S = {
  page:   { padding: '24px', overflowY: 'auto', flex: 1, background: 'var(--chat-bg)', fontFamily: 'var(--font)' },
  card:   { background: 'var(--color-white)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '24px', marginBottom: '24px', border: '1px solid #e9e9e9' },
  title:  { fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '16px' },
  label:  { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', display: 'block' },
  input:  { width: '100%', padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' },
  select: { padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'white', cursor: 'pointer' },
  row:    { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  field:  { flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column' },
  btn:    { background: 'var(--color-teal)', color: 'var(--color-primary)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' },
  toast:  { position: 'fixed', top: '20px', right: '20px', background: 'var(--color-primary)', color: 'white', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 1000 },
  th:     { padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-white)', background: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  td:     { padding: '10px 12px', fontSize: '12px', color: 'var(--color-text)', borderBottom: '1px solid #f0f0f0' },
};

function Badge({ activa }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em', background: activa ? 'rgba(67,209,201,0.15)' : 'rgba(186,186,186,0.15)', color: activa ? 'var(--color-teal)' : 'var(--color-gris)' }}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  );
}

export default function TareasProgramadas() {
  const [tareas, setTareas] = useState(TAREAS_MOCK);
  const [form, setForm]     = useState(FORM_INIT);
  const [toast, setToast]   = useState(false);

  function toggleTienda(t) {
    setForm(f => ({ ...f, tiendas: f.tiendas.includes(t) ? f.tiendas.filter(x => x !== t) : [...f.tiendas, t] }));
  }

  function programar(e) {
    e.preventDefault();
    if (!form.producto.trim() || !form.tiendas.length) return;
    setTareas(prev => [{ id: Date.now(), ...form, activa: true }, ...prev]);
    setForm(FORM_INIT);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>✅ Tarea programada correctamente</div>}

      <div style={S.card}>
        <div style={S.title}>📅 Nueva tarea de monitoreo</div>
        <form onSubmit={programar}>
          <div style={{ marginBottom: '16px' }}>
            <label style={S.label}>Producto a monitorear</label>
            <input style={S.input} value={form.producto} onChange={e => setForm(f => ({ ...f, producto: e.target.value }))} placeholder="ej: Smart TV 55 pulgadas 4K" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={S.label}>Tiendas a consultar</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '6px' }}>
              {TIENDAS_OPTS.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--color-text)' }}>
                  <input type="checkbox" checked={form.tiendas.includes(t)} onChange={() => toggleTienda(t)} style={{ accentColor: 'var(--color-teal)', cursor: 'pointer' }} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div style={S.row}>
            <div style={S.field}>
              <label style={S.label}>Formato de salida</label>
              <select style={S.select} value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))}>
                <option>Excel</option>
                <option>Resumen en chat</option>
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Frecuencia</label>
              <select style={S.select} value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))}>
                <option>Diaria</option>
                <option>Semanal</option>
                <option>Mensual</option>
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Horario</label>
              <input type="time" style={S.select} value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} />
            </div>
          </div>

          <button type="submit" style={S.btn}>Programar tarea</button>
        </form>
      </div>

      <div style={S.card}>
        <div style={S.title}>📋 Tareas programadas</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Producto', 'Tiendas', 'Formato', 'Frecuencia', 'Horario', 'Estado'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tareas.map(t => (
                <tr key={t.id} style={{ background: 'var(--color-white)' }}>
                  <td style={S.td}>{t.producto}</td>
                  <td style={S.td}>{t.tiendas.join(', ')}</td>
                  <td style={S.td}>{t.formato}</td>
                  <td style={S.td}>{t.frecuencia}</td>
                  <td style={S.td}>{t.horario}</td>
                  <td style={S.td}><Badge activa={t.activa} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
