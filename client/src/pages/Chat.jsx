// pages/Chat.jsx
// Pantalla principal — alterna entre Buscador Universal, Buscador Local y Tareas Programadas.

import { useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import Layout from '../components/layout/Layout';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import BuscadorLocal from './BuscadorLocal';
import TareasProgramadas from './TareasProgramadas';

export default function Chat() {
  const [seccion, setSeccion]             = useState('universal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onMensajeGuardado = useCallback(() => setRefreshTrigger((n) => n + 1), []);

  const {
    mensajes, enviar, cargando,
    cargarConversacion, conversacionFecha,
    nuevaConversacion,
  } = useChat({ onMensajeGuardado });

  return (
    <Layout
      seccionActiva={seccion}
      onCambiarSeccion={setSeccion}
      onCargarConversacion={cargarConversacion}
      onNuevaConversacion={nuevaConversacion}
      refreshTrigger={refreshTrigger}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {seccion === 'universal' ? (
          <>
            <MessageList mensajes={mensajes} cargando={cargando} conversacionFecha={conversacionFecha} />
            <ChatInput onEnviar={enviar} cargando={cargando} />
          </>
        ) : seccion === 'local' ? (
          <BuscadorLocal />
        ) : (
          <TareasProgramadas />
        )}
      </div>
    </Layout>
  );
}
