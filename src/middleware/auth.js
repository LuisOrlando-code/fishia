// middleware/auth.js — Middleware de autenticación JWT
// Verifica que el usuario haya enviado un token válido en el header Authorization
// Si es válido, extrae el userId y lo pone en req.userId para que las rutas lo usen

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // El token viene en el header: "Authorization: Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  // Si no hay header o no empieza con "Bearer ", rechazar
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Extraer solo el token (después de "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify decodifica el token y verifica que no esté expirado
    // El payload contiene { userId: "..." } que pusimos al crear el token en login/register
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId; // Guardamos el userId para que la ruta lo use
    next(); // Todo bien, continuar a la siguiente función (la ruta)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = requireAuth;
