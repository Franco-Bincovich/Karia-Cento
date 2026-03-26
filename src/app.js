// app.js
// Configura Express: middlewares globales y rutas.
// No contiene lógica de negocio ni lectura de process.env.

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const conversacionRoutes = require('./routes/conversacionRoutes');
const filesRoutes = require('./routes/filesRoutes');

const app = express();

// Seguridad de cabeceras HTTP
app.use(helmet());

// CORS con lista blanca desde config
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parseo de JSON con límite de 10kb
app.use(express.json({ limit: '10kb' }));

// Health check — Base 8: Run & See inmediato
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversaciones', conversacionRoutes);
app.use('/api/files', filesRoutes);

// 404 — ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada', code: 'NOT_FOUND' });
});

// Error handler global — debe ir al final, después de todas las rutas
app.use(errorHandler);

module.exports = app;
