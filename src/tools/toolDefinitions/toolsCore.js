// tools/toolDefinitions/toolsCore.js
// Definiciones de herramientas core del agente: precios, archivos y presentaciones.

const toolsCore = [
  {
    name: 'buscar_precios',
    description:
      'Busca y compara precios de productos en las principales cadenas de electrodomésticos de Argentina (Naldo, OnCity, Frávega, Cetrogar, Megatone, Musimundo). Detecta automáticamente las tiendas mencionadas.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre del producto a buscar' },
        tiendas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tiendas específicas. Si está vacío busca en todas.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'generar_excel',
    description: 'Genera un archivo Excel (.xlsx) con datos tabulares',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string' },
        columnas: { type: 'array', items: { type: 'string' } },
        filas: { type: 'array', items: { type: 'array' } },
      },
      required: ['nombreArchivo', 'columnas', 'filas'],
    },
  },
  {
    name: 'generar_excel_comparacion',
    description:
      'Genera un Excel pivoteado de comparación de precios por tienda. Una fila por producto, una columna por tienda. El precio más bajo de cada fila se resalta en verde. Usar después de buscar_precios.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string', description: 'Nombre del archivo sin extensión' },
        query: { type: 'string', description: 'Nombre del producto buscado' },
        resultados: {
          type: 'array',
          description: 'Array retornado por buscar_precios',
          items: { type: 'object' },
        },
      },
      required: ['nombreArchivo', 'query', 'resultados'],
    },
  },
  {
    name: 'generar_word',
    description: 'Genera un documento Word (.docx)',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string' },
        titulo: { type: 'string' },
        contenido: { type: 'string' },
      },
      required: ['nombreArchivo', 'titulo', 'contenido'],
    },
  },
  {
    name: 'generar_presentacion',
    description: 'Genera una presentación usando Gamma AI',
    input_schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        contenido: { type: 'string', description: 'Contenido o outline de la presentación' },
      },
      required: ['titulo', 'contenido'],
    },
  },
];

module.exports = { toolsCore };
