// agent.js
// Loop principal del agente Claude con soporte de herramientas.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');
const { AppError } = require('./middleware/errorHandler');
const logger = require('./utils/logger').child({ module: 'agent' });
const { TOOLS, ejecutarTool } = require('./tools');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const MAX_ITERACIONES = 10;

const SYSTEM_PROMPT =
  'Sos KarIA Scout, un agente de inteligencia comercial para equipos de ventas de electrodomésticos en Argentina. ' +
  'Tu rol es buscar y comparar precios de productos en las principales cadenas (Naldo, OnCity, Cetrogar, Megatone, Frávega) ' +
  'usando las herramientas disponibles. Siempre respondé en español. ' +
  'Cuando el usuario pida una comparación, usá buscarPrecios y luego generá el Excel con generarExcelComparacion. ' +
  'Cuando el resultado sea un archivo, informá el nombre del archivo para que el usuario pueda descargarlo.';

/**
 * Extrae el texto plano del array de bloques de contenido de Anthropic.
 *
 * @param {Object[]} contenido - content array de la respuesta
 * @returns {string}
 */
function extraerTexto(contenido) {
  return contenido
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Ejecuta el loop del agente Claude con soporte de herramientas.
 *
 * @param {Object} params
 * @param {string} params.mensaje - Mensaje del usuario
 * @param {Object[]} params.historial - Mensajes previos de la conversación
 * @param {string} params.userId - ID del usuario (para logs y auditoría)
 *
 * @returns {Promise<{ respuesta: string, mensajesActualizados: Object[] }>}
 *
 * @throws {AppError} code: 'CLAUDE_UNAVAILABLE' (503)
 * @throws {AppError} code: 'AGENT_LOOP_ERROR' (500)
 */
async function ejecutarAgente({ mensaje, historial, userId }) {
  // Sólo se pasan role y content a Anthropic (limpiar campos extra de Supabase)
  const messages = [
    ...historial.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: mensaje },
  ];

  let iteraciones = 0;

  try {
    while (iteraciones < MAX_ITERACIONES) {
      iteraciones++;

      // eslint-disable-next-line no-await-in-loop
      const respuesta = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      logger.info('Respuesta de Claude', {
        userId,
        iteracion: iteraciones,
        stop_reason: respuesta.stop_reason,
      });

      if (respuesta.stop_reason === 'end_turn') {
        messages.push({ role: 'assistant', content: respuesta.content });
        return { respuesta: extraerTexto(respuesta.content), mensajesActualizados: messages };
      }

      if (respuesta.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: respuesta.content });

        // Ejecutar cada tool_use y recopilar resultados
        const resultados = await Promise.all(
          respuesta.content
            .filter((b) => b.type === 'tool_use')
            .map(async (b) => {
              try {
                const resultado = await ejecutarTool(b.name, b.input, userId);
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: JSON.stringify(resultado),
                };
              } catch (toolErr) {
                logger.warn('Error ejecutando tool', { tool: b.name, error: toolErr.message });
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: `Error: ${toolErr.message}`,
                  is_error: true,
                };
              }
            })
        );

        messages.push({ role: 'user', content: resultados });
        continue;
      }

      // stop_reason inesperado
      break;
    }

    throw new AppError('El agente alcanzó el máximo de iteraciones', 'AGENT_LOOP_ERROR', 500);
  } catch (err) {
    if (err.isOperational) throw err;

    if (err.status === 529 || err.status === 503 || err.status === 502) {
      throw new AppError('Claude no está disponible temporalmente', 'CLAUDE_UNAVAILABLE', 503);
    }

    logger.error('Error en loop del agente', { error: err.message, userId });
    throw new AppError('Error en el loop del agente', 'AGENT_LOOP_ERROR', 500);
  }
}

module.exports = { ejecutarAgente };
