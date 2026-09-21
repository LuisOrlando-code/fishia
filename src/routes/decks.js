// routes/decks.js — CRUD de mazos (decks)
// Cada mazo contiene flashcards. Un usuario solo puede ver/borrar sus propios mazos.
// Todas las rutas usan requireAuth para saber quién está logueado (req.userId)

const express = require('express');
const prisma = require('../prismaClient');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /decks — Crear un mazo nuevo
// Recibe title (requerido), description y sourcePrompt (opcional)
// El mazo se asigna al usuario logueado automáticamente con req.userId
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, sourcePrompt } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    const deck = await prisma.deck.create({
      data: {
        title,
        description,
        sourcePrompt,
        userId: req.userId, // Viene del token JWT verificado por requireAuth
      },
    });

    res.status(201).json(deck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el mazo' });
  }
});

// GET /decks — Listar todos los mazos del usuario logueado
// Solo devuelve los mazos donde userId coincide con el usuario del token
// Ordenados del más nuevo al más viejo
router.get('/', requireAuth, async (req, res) => {
  try {
    const decks = await prisma.deck.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(decks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar los mazos' });
  }
});

// GET /decks/:id — Ver un mazo específico con todas sus flashcards
// Incluye las flashcards gracias a: include: { flashcards: true }
// Verifica que el mazo pertenezca al usuario logueado
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const deck = await prisma.deck.findUnique({
      where: { id: req.params.id },
      include: { flashcards: true }, // Trae todas las flashcards del mazo
    });

    // Si el mazo no existe o no es del usuario, devolver 404
    if (!deck || deck.userId !== req.userId) {
      return res.status(404).json({ error: 'Mazo no encontrado' });
    }

    res.json(deck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el mazo' });
  }
});

// DELETE /decks/:id — Borrar un mazo y todas sus flashcards
// Verifica que el mazo pertenezca al usuario antes de borrar
// Prisma se encadena en cascade: al borrar el deck, borra sus flashcards automáticamente
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deck = await prisma.deck.findUnique({ where: { id: req.params.id } });

    if (!deck || deck.userId !== req.userId) {
      return res.status(404).json({ error: 'Mazo no encontrado' });
    }

    await prisma.deck.delete({ where: { id: req.params.id } });

    res.status(204).send(); // 204 =成功 pero sin contenido
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al borrar el mazo' });
  }
});

module.exports = router;
