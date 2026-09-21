// prismaClient.js — Configuración de la conexión a la base de datos
// Crea una instancia de PrismaClient que se usa en todas las rutas para hacer queries

require('dotenv').config(); // Lee las variables de entorno del archivo .env
const { PrismaNeon } = require('@prisma/adapter-neon'); // Adaptador específico para Neon (serverless Postgres)
const { PrismaClient } = require('@prisma/client'); // Cliente ORM de Prisma

// Conecta a Neon usando la URL que está en DATABASE_URL del .env
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
