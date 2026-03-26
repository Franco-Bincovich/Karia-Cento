// hooks/useChat.js
// Maneja el estado del chat: mensajes, conversacionId, loading, error, conversacionFecha.

import { useState, useCallback } from 'react';
import { chatApi, conversacionesApi } from '../services/api';
import { useAuth } from './useAuth';

function crearMensaje(rol, texto) {
  return { id: crypto.randomUUID(), rol, texto, timestamp: new Date() };
}

/**
 * Extrae texto plano de un campo content de Anthropic.
 * content puede ser string, o array de bloques { type, text }.
 */
function extraerTextoContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  }
  return '';
}

/**
 * @param {{ onMensajeGuardado?: () => void }} [opts]
 */
export function useChat({ onMensajeGuardado } = {}) {
  const { token } = useAuth();
  const [mensajes, setMensajes]             = useState([]);
  const [conversacionId, setConversacionId] = useState(null);
  const [conversacionFecha, setConvFecha]   = useState(null);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState(null);

  const enviar = useCallback(
    async (texto) => {
      if (!texto.trim() || cargando) return;

      setMensajes((prev) => [...prev, crearMensaje('user', texto.trim())]);
      setCargando(true);
      setError(null);

      try {
        const idConversacion = conversacionId || undefined;
        const data = await chatApi.enviar(texto.trim(), idConversacion, token);

        setMensajes((prev) => [...prev, crearMensaje('agent', data.respuesta)]);

        if (!conversacionId && data.conversacionId) {
          setConversacionId(data.conversacionId);
        }

        // Notificar al sidebar que hay datos nuevos para refrescar
        onMensajeGuardado?.();
      } catch (err) {
        const msg = err.message || 'Error al conectar con el servidor';
        setError(msg);
        setMensajes((prev) => [...prev, crearMensaje('agent', `⚠️ ${msg}`)]);
      } finally {
        setCargando(false);
      }
    },
    [token, conversacionId, cargando, onMensajeGuardado]
  );

  /**
   * Carga una conversación guardada.
   * Los mensajes almacenados usan formato Anthropic { role, content }.
   * content puede ser string o array de content blocks.
   */
  const cargarConversacion = useCallback(
    async (id) => {
      try {
        const data = await conversacionesApi.cargar(id, token);

        const msgs = (data.mensajes || [])
          .map((m) => {
            // Soporte formato Anthropic (role/content) y formato legacy (rol/contenido/texto)
            const role = m.role || m.rol || '';
            const texto = extraerTextoContent(m.content ?? m.contenido ?? m.texto ?? '');
            const rol = role === 'assistant' ? 'agent' : 'user';
            return { role, texto, rol };
          })
          .filter(({ texto, role }) => texto.length > 0 && (role === 'user' || role === 'assistant'))
          .map(({ rol, texto }) => crearMensaje(rol, texto));

        setMensajes(msgs);
        setConversacionId(id);
        setConvFecha(data.conversacion?.created_at ? new Date(data.conversacion.created_at) : null);
      } catch {
        // fail silently — historial no bloquea el chat
      }
    },
    [token]
  );

  /** Limpia el estado para empezar una conversación nueva desde cero. */
  const nuevaConversacion = useCallback(() => {
    setMensajes([]);
    setConversacionId(null);
    setConvFecha(null);
    setError(null);
  }, []);

  return { mensajes, enviar, cargando, error, cargarConversacion, conversacionFecha, nuevaConversacion };
}
