// tools/toolDefinitions/toolsGoogle.js
// Definiciones de herramientas Google Workspace: Gmail, Calendar, Drive, Contacts.

const toolsGoogle = [
  {
    name: 'leer_correos',
    description: 'Lee los correos no leídos de Gmail',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number', description: '1 o 2' },
        maxResults: { type: 'number', description: 'Máximo de correos a retornar (default 10)' },
      },
    },
  },
  {
    name: 'enviar_correo',
    description: 'Envía un correo electrónico desde Gmail',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number' },
        to: { type: 'string', description: 'Email del destinatario' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'buscar_correos',
    description: 'Busca correos en Gmail usando una query (mismo formato que la búsqueda de Gmail)',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number', description: '1 o 2' },
        query: { type: 'string', description: 'Query de búsqueda de Gmail (ej: "from:cliente@empresa.com")' },
        maxResults: { type: 'number', description: 'Máximo de correos a retornar (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'listar_eventos',
    description: 'Lista eventos del calendario de Google',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number' },
        desde: { type: 'string', description: 'Fecha ISO 8601' },
        hasta: { type: 'string', description: 'Fecha ISO 8601' },
        maxResults: { type: 'number' },
      },
    },
  },
  {
    name: 'crear_evento',
    description: 'Crea un evento en Google Calendar',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number' },
        titulo: { type: 'string' },
        inicio: { type: 'string', description: 'Fecha y hora ISO 8601' },
        fin: { type: 'string', description: 'Fecha y hora ISO 8601' },
        descripcion: { type: 'string' },
      },
      required: ['titulo', 'inicio', 'fin'],
    },
  },
  {
    name: 'eliminar_evento',
    description: 'Elimina un evento del calendario de Google por su ID',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number', description: '1 o 2' },
        eventId: { type: 'string', description: 'ID del evento a eliminar' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'subir_archivo',
    description: 'Sube un archivo local generado por el agente a Google Drive',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number', description: '1 o 2' },
        nombreArchivo: { type: 'string', description: 'Nombre del archivo en Drive' },
        rutaLocal: { type: 'string', description: 'Ruta local del archivo (generado en /tmp)' },
        mimeType: {
          type: 'string',
          description: 'MIME type del archivo (ej: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)',
        },
      },
      required: ['nombreArchivo', 'rutaLocal', 'mimeType'],
    },
  },
  {
    name: 'buscar_contactos',
    description: 'Busca contactos en Google Contacts',
    input_schema: {
      type: 'object',
      properties: {
        numeroCuenta: { type: 'number' },
        query: { type: 'string', description: 'Nombre o email a buscar' },
      },
      required: ['query'],
    },
  },
];

module.exports = { toolsGoogle };
