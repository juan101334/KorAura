# KorAura

Tienda en línea de accesorios en cuero (bolsos, billeteras, correas y más). Incluye un catálogo con búsqueda y filtros por categoría, un panel de administración protegido con sesión y un asistente de compras que recomienda productos. Los pedidos se cierran por WhatsApp.

## Funciones

- **Tienda**: portada con productos nuevos y enlace al catálogo completo.
- **Catálogo** (`/catalogo.html`): búsqueda por nombre o descripción, filtro por categoría, orden por precio o nombre y filtros guardados en la URL para poder compartirlos.
- **Carrito de compras**: añadir productos desde el catálogo, ajustar cantidades (con tope por stock) y enviar el pedido completo por WhatsApp con el detalle y el total. Se guarda en el navegador y se sincroniza con los precios y el stock actuales.
- **Panel de administración**: crear, editar y eliminar productos con foto, y gestionar administradores.
- **Asistente de compras**: responde con la API de OpenAI si hay clave configurada y, si no, busca por palabras en los productos.
- **Seguridad**: sesiones con JWT, contraseñas con bcrypt, cabeceras de seguridad, CORS restringido, límite de intentos en el login y validación del contenido real de las fotos.

## Tecnologías

- Frontend: HTML, CSS y JavaScript sin dependencias.
- Backend: Node.js, Express 5, MongoDB con Mongoose, JWT, Multer.
- Pruebas: `node:test`, Supertest y MongoDB en memoria.

## Estructura

```
KorAura/
├── backEnd/
│   ├── server.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   └── services/
│   └── tests/
├── frontEnd/
│   ├── index.html
│   ├── catalogo.html
│   ├── login.html
│   ├── registro.html
│   └── admin.html
└── .env.example
```

## Requisitos

- Node.js 20.19 o superior
- MongoDB en local o una URI de MongoDB Atlas

## Instalación

```bash
git clone <url-del-repositorio>
cd KorAura/backEnd
npm install
```

`npm install` crea el archivo `.env` en la raíz del proyecto a partir de `.env.example` y genera un `JWT_SECRET` aleatorio.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto 5000) |
| `MONGODB_URI` | Conexión a MongoDB |
| `JWT_SECRET` | Clave para firmar las sesiones |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Datos del administrador que crea `npm run crear-admin` |
| `WHATSAPP_NUMBER` | Número de WhatsApp con indicativo, sin signos (usado por el asistente) |
| `CORS_ORIGIN` | Orígenes permitidos separados por coma, además de `localhost` |
| `TRUST_PROXY` | `true` si el servidor está detrás de un proxy inverso |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Opcionales, activan las respuestas con IA |

El número de WhatsApp que ven los clientes en la página se cambia en `frontEnd/config.js`, junto con la URL de la API si el frontend se publica en otro dominio.

## Uso

```bash
npm run semilla
npm run crear-admin
npm start
```

- Tienda: http://localhost:5000
- Catálogo: http://localhost:5000/catalogo.html
- Panel: http://localhost:5000/login.html

`npm run semilla` carga productos de ejemplo solo si la base está vacía. Con `npm run semilla -- --reiniciar` borra los productos existentes y vuelve a cargar los de ejemplo.

Si no hay administradores, la página `registro.html` permite crear el primero.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Inicia el servidor |
| `npm run dev` | Inicia el servidor y lo reinicia al guardar cambios |
| `npm test` | Corre las pruebas |
| `npm run crear-admin` | Crea un administrador con los datos del `.env` |
| `npm run semilla` | Carga productos de ejemplo |

Desde la raíz también están `npm run lint` y `npm run format` (requieren `npm install` en la raíz).

## API

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Estado del servidor |
| GET | `/api/productos` | Público | Productos disponibles |
| POST | `/api/chat` | Público | Asistente de compras |
| POST | `/api/auth/login` | Público | Iniciar sesión |
| GET | `/api/auth/estado` | Público | Indica si falta crear el primer administrador |
| POST | `/api/auth/registro` | Primer admin o admin | Crear administrador |
| GET | `/api/auth/perfil` | Admin | Datos del administrador actual |
| GET | `/api/productos/admin` | Admin | Todos los productos |
| GET | `/api/productos/:id` | Admin | Un producto |
| POST | `/api/productos` | Admin | Crear producto |
| PUT | `/api/productos/:id` | Admin | Editar producto |
| DELETE | `/api/productos/:id` | Admin | Eliminar producto |
| POST | `/api/productos/imagen` | Admin | Subir foto (JPG, PNG, WEBP o GIF, máximo 5 MB) |
| GET | `/api/usuarios` | Admin | Lista de administradores |
| PATCH | `/api/usuarios/:id/estado` | Admin | Activar o desactivar un administrador |

## Pruebas

```bash
cd backEnd
npm test
```

Las pruebas usan una base MongoDB en memoria, por lo que no tocan tus datos.

## Licencia

ISC. Ver [LICENSE](LICENSE).
