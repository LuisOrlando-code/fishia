// routes/auth.js — Rutas de autenticación
// Maneja registro de nuevos usuarios y login de existentes
// Devuelve un token JWT que el frontend usa para autenticarse en las demás rutas

const express = require('express');
const bcrypt = require('bcrypt');    // Para hashear contraseñas (nunca guardar texto plano)
const jwt = require('jsonwebtoken'); // Para crear tokens de sesión
const prisma = require('../prismaClient');

const router = express.Router();

// POST /auth/register — Crear una cuenta nueva
// Recibe email + password, crea el usuario en la DB, devuelve un token JWT
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que manden ambos campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // Hashear la contraseña con bcrypt (10 rondas de sal)
    // Nunca guardamos la contraseña original en la DB
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear el usuario en la DB
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    // Crear token JWT con el ID del usuario, válido por 7 días
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Devolver token + datos del usuario (sin passwordHash)
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('ERROR COMPLETO:', error);
    res.status(500).json({ error: error.message, name: error.name, code: error.code });
  }
});

// POST /auth/login — Iniciar sesión
// Recibe email + password, verifica credenciales, devuelve un token JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que manden ambos campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Mensaje genérico para no revelar si el email existe o no
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar la contraseña enviada con el hash guardado en la DB
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear token JWT, válido por 7 días
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('ERROR COMPLETO:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
