// hooks/useChat.js
// Maneja el estado del chat: mensajes, conversacionId, loading, error.
// Llama a chatApi.enviar y actualiza el estado con la respuesta.

import { useState, useCallback } from 'react';
import { chatApi } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Crea un objeto de mensaje con rol y timestamp.
 * @param {'user'|'agent'} rol
 * @param {string} texto
 */
function crearMensaje(rol, texto) {
  return { id: crypto.randomUUID(), rol, texto, timestamp: new Date() };
}

export function useChat() {
  const { token } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [conversacionId, setConversacionId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = useCallback(
    async (texto) => {
      if (!texto.trim() || cargando) return;

      // 1. Agregar mensaje del usuario al estado inmediatamente
      setMensajes((prev) => [...prev, crearMensaje('user', texto.trim())]);
      setCargando(true);
      setError(null);

      try {
        // 2. Llamar al backend
        const data = await chatApi.enviar(texto.trim(), conversacionId, token);

        // 3. Agregar respuesta del agente
        setMensajes((prev) => [...prev, crearMensaje('agent', data.respuesta)]);

        // 4. Guardar conversacionId si es nueva conversación
        if (!conversacionId && data.conversacionId) {
          setConversacionId(data.conversacionId);
        }
      } catch (err) {
        const msg = err.message || 'Error al conectar con el servidor';
        setError(msg);
        setMensajes((prev) => [...prev, crearMensaje('agent', `⚠️ ${msg}`)]);
      } finally {
        setCargando(false);
      }
    },
    [token, conversacionId, cargando]
  );

  return { mensajes, enviar, cargando, error };
}
