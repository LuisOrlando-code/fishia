// routes/flashcards.js — CRUD de flashcards (tarjetas)
// Cada flashcard vive dentro de un mazo (deck) y tiene front (pregunta) y back (respuesta)
// Para verificar ownership, se busca la flashcard con su deck y se compara deck.userId

const express = require('express');
const prisma = require('../prismaClient');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /flashcards/:deckId — Crear una flashcard dentro de un mazo
// Recibe front (pregunta) y back (respuesta) en el body
// Verifica que el mazo exista y sea del usuario logueado
router.post('/:deckId', requireAuth, async (req, res) => {
  try {
    const { front, back } = req.body;

    // Validar que manden ambos lados de la tarjeta
    if (!front || !back) {
      return res.status(400).json({ error: 'front y back son requeridos' });
    }

    // Verificar que el mazo exista y pertenezca al usuario
    const deck = await prisma.deck.findUnique({ where: { id: req.params.deckId } });
    if (!deck || deck.userId !== req.userId) {
      return res.status(404).json({ error: 'Mazo no encontrado' });
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        front,
        back,
        deckId: req.params.deckId, // La asocia al mazo indicado en la URL
      },
    });

    res.status(201).json(flashcard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la flashcard' });
  }
});

// PUT /flashcards/:id — Editar una flashcard existente
// Actualiza front y/o back. Verifica ownership a través del deck relacionado
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Buscamos la flashcard CON su deck para poder verificar quién es el dueño
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: req.params.id },
      include: { deck: true }, // Trae el deck padre para verificar ownership
    });

    // Si no existe o el deck no es del usuario, rechazar
    if (!flashcard || flashcard.deck.userId !== req.userId) {
      return res.status(404).json({ error: 'Flashcard no encontrada' });
    }

    const { front, back } = req.body;

    const updated = await prisma.flashcard.update({
      where: { id: req.params.id },
      data: { front, back }, // Actualiza solo los campos enviados
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la flashcard' });
  }
});

// DELETE /flashcards/:id — Borrar una flashcard
// Mismo patrón: verificar ownership a través del deck, luego borrar
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: req.params.id },
      include: { deck: true }, // Necesitamos el deck para saber si es del usuario
    });

    if (!flashcard || flashcard.deck.userId !== req.userId) {
      return res.status(404).json({ error: 'Flashcard no encontrada' });
    }

    await prisma.flashcard.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al borrar la flashcard' });
  }
});

module.exports = router;
