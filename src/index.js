// index.js — Punto de entrada del servidor Express
// Configura middleware, conecta las rutas y arranca el servidor

require('dotenv').config(); // Carga variables de entorno (.env) al inicio

const express = require('express');
const authRoutes = require('./routes/auth');       // Rutas de registro y login
const deckRoutes = require('./routes/decks');      // Rutas CRUD de mazos
const flashcardRoutes = require('./routes/flashcards'); // Rutas CRUD de flashcards
const prisma = require('./prismaClient');          // Cliente de base de datos

const app = express();

// Middleware: permite que Express entienda JSON en el body de las peticiones
app.use(express.json());

// Rutas: cada grupo de rutas maneja una parte de la API
app.use('/auth', authRoutes);         // /auth/register, /auth/login
app.use('/decks', deckRoutes);        // /decks (CRUD de mazos)
app.use('/flashcards', flashcardRoutes); // /flashcards (CRUD de tarjetas)

// Endpoint de salud: sirve para verificar que el servidor y la DB están funcionando
app.get('/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count(); // Cuenta usuarios en la DB
    res.json({ status: 'ok', userCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Arranca el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
