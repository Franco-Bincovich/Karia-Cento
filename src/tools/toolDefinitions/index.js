// tools/toolDefinitions/index.js
// Punto de entrada del módulo toolDefinitions.
// Combina las definiciones core y Google Workspace en el array TOOLS
// que consume la API de Anthropic.

const { toolsCore } = require('./toolsCore');
const { toolsGoogle } = require('./toolsGoogle');

const TOOLS = [...toolsCore, ...toolsGoogle];

module.exports = { TOOLS };
