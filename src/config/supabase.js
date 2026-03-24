// src/config/supabase.js
// Cliente Supabase singleton.
// Importar desde acá en todos los repositories — nunca crear otro cliente.

const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabase = createClient(config.supabase.url, config.supabase.key);

module.exports = supabase;
