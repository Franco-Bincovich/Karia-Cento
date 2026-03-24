// components/ui/Button.jsx
// Componente base reutilizable con variantes de marca KarIA Scout.
// Variantes: 'primary' (#081c54) | 'secondary' (#43d1c9/teal) | 'ghost'

const VARIANTES = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-white)',
    border: 'none',
    hoverBg: 'var(--color-teal)',
    hoverColor: 'var(--color-white)',
  },
  secondary: {
    background: 'var(--color-teal)',
    color: 'var(--color-primary)',
    border: 'none',
    hoverBg: 'var(--color-primary)',
    hoverColor: 'var(--color-white)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-primary)',
    border: '1.5px solid var(--color-primary)',
    hoverBg: 'var(--color-primary)',
    hoverColor: 'var(--color-white)',
  },
};

/**
 * @param {{ variante?: 'primary'|'secondary'|'ghost', disabled?: boolean, onClick?: Function, children: React.ReactNode, style?: object }} props
 */
export default function Button({ variante = 'primary', disabled = false, onClick, children, style = {} }) {
  const v = VARIANTES[variante] || VARIANTES.primary;

  function onEnter(e) {
    if (!disabled) { e.target.style.background = v.hoverBg; e.target.style.color = v.hoverColor; }
  }
  function onLeave(e) {
    if (!disabled) { e.target.style.background = v.background; e.target.style.color = v.color; }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: '0.6rem 1.2rem',
        background: disabled ? 'var(--color-gris)' : v.background,
        color: disabled ? 'var(--color-white)' : v.color,
        border: v.border || 'none',
        borderRadius: 'var(--border-radius)',
        fontSize: '15px', fontWeight: 600,
        fontFamily: 'var(--font)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, color 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
