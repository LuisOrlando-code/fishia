# Flashia

<!-- Descripción breve: qué es el proyecto y para qué sirve -->
Generador de flashcards con IA y repaso espaciado. Crea tarjetas de estudio desde cualquier tema usando Claude AI, organízalas en mazos y revísalas con el algoritmo SM-2.

## Stack

<!-- Tecnologías utilizadas y por qué se eligieron -->
- **Backend:** Node.js + Express — framework ligero y rápido para APIs REST
- **Base de datos:** PostgreSQL (Neon) + Prisma ORM — base de datos relacional serverless, Prisma genera el cliente tipado y maneja migraciones
- **Autenticación:** JWT + bcrypt — tokens stateless para sesiones, bcrypt para hashear contraseñas de forma segura
- **IA:** API de Claude — genera flashcards automáticamente a partir de un texto o tema

## Arquitectura

<!-- Estructura de carpetas y qué hace cada archivo -->
```
src/
├── index.js              # Punto de entrada: configura Express, conecta rutas, arranca servidor
├── prismaClient.js       # Crea la conexión a Neon usando el adaptador de Prisma
├── middleware/
│   └── auth.js           # Intercepta peticiones, verifica el token JWT, extrae el userId
└── routes/
    ├── auth.js           # Registro (crear cuenta) e inicio de sesión (devolver token)
    ├── decks.js          # CRUD de mazos: crear, listar, ver uno con sus flashcards, borrar
    └── flashcards.js     # CRUD de flashcards: crear dentro de un mazo, editar, borrar
```

## Modelo de Datos

<!-- Relaciones entre tablas en la base de datos -->
```
User ──< Deck ──< Flashcard >── Review
  1       1          1            1
  │       │          │            │
  └─ 1:N ─┘    1:N   └── 1:1 ────┘
```

- **User:** cada usuario tiene email único + contraseña hasheada (nunca se guarda en texto plano)
- **Deck:** mazo de flashcards, pertenece a un usuario, puede tener descripción y prompt de origen
- **Flashcard:** tarjeta con frente (pregunta) y dorso (respuesta), vive dentro de un mazo
- **Review:** datos del algoritmo SM-2 para cada tarjeta — controla cuándo se repasa y con qué frecuencia

## Configuración

<!-- Pasos para levantar el proyecto localmente -->
```bash
# 1. Instalar dependencias (express, prisma, bcrypt, etc.)
npm install

# 2. Crear archivo de variables de entorno desde la plantilla
cp .env.example .env
# 3. Editar .env con tu URL de Neon y tu secreto JWT

# 4. Aplicar migraciones de la base de datos (crea las tablas)
npx prisma migrate dev

# 5. Iniciar servidor en modo desarrollo (con hot-reload)
npm run dev
```

## Endpoints de la API

### Autenticación
<!-- Rutas públicas: no requieren token -->
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Crear cuenta nueva (email + contraseña), devuelve token |
| POST | `/auth/login` | Verificar credenciales, devolver token JWT para usar en las demás rutas |

### Mazos (requiere token Bearer)
<!-- Rutas protegidas: el middleware auth.js verifica el token antes de llegar aquí -->
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/decks` | Crear un mazo nuevo (título requerido, descripción opcional) |
| GET | `/decks` | Listar todos los mazos del usuario logueado, del más nuevo al más viejo |
| GET | `/decks/:id` | Ver un mazo específico con todas sus flashcards incluidas |
| DELETE | `/decks/:id` | Borrar un mazo y todas sus flashcards (cascade delete) |

### Flashcards (requiere token Bearer)
<!-- Las flashcards viven dentro de un mazo, se identifican por deckId -->
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/flashcards/:deckId` | Crear una flashcard dentro del mazo indicado |
| PUT | `/flashcards/:id` | Editar el frente (pregunta) y/o dorso (respuesta) de una flashcard |
| DELETE | `/flashcards/:id` | Borrar una flashcard específica |

### Salud del servidor
<!-- Endpoint para monitoreo: verifica que el servidor y la DB estén respondiendo -->
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Devuelve status ok + número de usuarios en la DB |

## Ejemplo de Uso

<!-- Flujo típico: register → login → crear mazo → crear flashcards -->
```bash
# 1. Registrarse (crea la cuenta y devuelve token)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"mipassword"}'

# 2. Iniciar sesión (si ya tienes cuenta)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"mipassword"}'

# 3. Crear un mazo (usar el token del login en el header)
curl -X POST http://localhost:3000/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"title":"JavaScript Básico"}'

# 4. Crear flashcards dentro del mazo (reemplazar ID_DEL_MAZO)
curl -X POST http://localhost:3000/flashcards/ID_DEL_MAZO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"front":"¿Qué es un closure?","back":"Una función que conserva acceso a su ámbito léxico"}'
```

## Seguridad

<!-- Medidas de protección implementadas -->
- **Contraseñas:** hasheadas con bcrypt (10 rondas de sal) — nunca se almacenan en texto plano
- **Tokens JWT:** expiran después de 7 días — si se pierde, el usuario debe volver a iniciar sesión
- **Verificación de propiedad:** cada ruta verifica que el mazo/flashcard pertenezca al usuario del token
- **Mensajes genéricos:** en login, "credenciales inválidas" no revela si el email existe o no
- **Variables de entorno:** `.env` excluido del repositorio, los secretos nunca se suben a Git

## Lo que Aprendí

<!-- Conceptos clave reforzados durante el desarrollo -->
- **Arquitectura backend:** Separación de rutas, middleware, y conexión a DB en archivos independientes
- **Diseño relacional:** Modelado de entidades (User, Deck, Flashcard, Review) con relaciones 1:N y 1:1
- **Autenticación JWT:** Flujo completo — registro → hash de contraseña → login → verificación de token
- **Prisma ORM:** Migraciones, schema, queries con include para traer relaciones, eliminación en cascada
- **Seguridad:** Bcrypt para contraseñas, validación de entradas, ownership check en cada ruta
