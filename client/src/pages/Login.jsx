// pages/Login.jsx
// Pantalla de login con identidad visual KarIA Scout.
// Sin librerías de UI externas — solo CSS variables de globals.css.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--color-bg)',
  },
  card: {
    width: '100%', maxWidth: '400px', background: 'var(--color-white)',
    borderRadius: '12px', padding: '2.5rem 2rem',
    boxShadow: '0 2px 8px rgba(8,28,84,0.12)',
  },
  logo: {
    fontSize: '32px', fontWeight: 600, textAlign: 'center',
    marginBottom: '0.35rem', fontFamily: 'var(--font)',
  },
  subtitle: {
    textAlign: 'center', color: 'var(--color-text-muted)',
    fontSize: '14px', marginBottom: '2rem',
  },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '0.35rem' },
  input: {
    width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--color-gris)',
    borderRadius: 'var(--border-radius)', fontSize: '15px', outline: 'none',
    fontFamily: 'var(--font)', transition: 'border-color 0.2s',
    background: 'var(--color-white)', color: 'var(--color-text)',
  },
  group: { marginBottom: '1.1rem' },
  btn: {
    width: '100%', padding: '0.75rem', marginTop: '0.5rem',
    background: 'var(--color-primary)', color: 'var(--color-white)',
    border: 'none', borderRadius: 'var(--border-radius)', fontSize: '16px',
    fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  },
  error: {
    marginTop: '1rem', padding: '0.65rem 0.85rem',
    background: '#fef2f2', border: '1px solid #fca5a5',
    borderRadius: 'var(--border-radius)', color: 'var(--color-error)',
    fontSize: '14px', textAlign: 'center',
  },
  spinner: {
    width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'karia-spin 0.7s linear infinite',
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      login(data.token, data.user);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  function focusTeal(e) { e.target.style.borderColor = 'var(--color-teal)'; }
  function blurGris(e)  { e.target.style.borderColor = 'var(--color-gris)'; }

  return (
    <div style={s.page}>
      <style>{`@keyframes karia-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={{ color: 'var(--color-primary)' }}>kar</span>
          <span style={{ color: 'var(--color-teal)' }}>IA</span>
          <span style={{ color: 'var(--color-primary)' }}> Scout</span>
        </div>
        <p style={s.subtitle}>Inteligencia competitiva de precios</p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={s.group}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={focusTeal} onBlur={blurGris}
              style={s.input} placeholder="usuario@empresa.com"
            />
          </div>
          <div style={s.group}>
            <label style={s.label} htmlFor="password">Contraseña</label>
            <input
              id="password" type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={focusTeal} onBlur={blurGris}
              style={s.input} placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ ...s.btn, background: loading ? 'var(--color-gris)' : 'var(--color-primary)' }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = 'var(--color-teal)'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = 'var(--color-primary)'; }}
          >
            {loading && <span style={s.spinner} />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        {error && <div style={s.error}>{error}</div>}
      </div>
    </div>
  );
}
