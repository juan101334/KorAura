import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { carpetaUploads } from './config/uploads.js';
import { cabecerasSeguridad, opcionesCors } from './middlewares/seguridad.js';

const carpetaFrontEnd = fileURLToPath(new URL('../../frontEnd', import.meta.url));

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', () => process.env.TRUST_PROXY === 'true');

app.use(cabecerasSeguridad);
app.use(cors(opcionesCors));
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de KorAura en línea' });
});

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', tiempoActivo: Math.round(process.uptime()) });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ mensaje: 'Esa ruta no existe' });
});

let servidorUploads;
let carpetaServida;

app.use('/uploads', (req, res, next) => {
  const carpeta = carpetaUploads();
  if (carpeta !== carpetaServida) {
    servidorUploads = express.static(carpeta, { fallthrough: false, maxAge: '7d', immutable: true });
    carpetaServida = carpeta;
  }
  servidorUploads(req, res, next);
});

app.use(express.static(carpetaFrontEnd, { extensions: ['html'] }));

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Esa ruta no existe' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'Los datos enviados no tienen un formato válido' });
  }
  if (err.name === 'ValidationError') {
    const errores = Object.values(err.errors).map((e) =>
      e.name === 'CastError' ? `El campo "${e.path}" tiene un valor no válido` : e.message
    );
    return res.status(400).json({ mensaje: errores[0], errores });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ mensaje: 'El identificador no es válido' });
  }
  if (err.status === 404 || err.statusCode === 404) {
    const esFoto = req.originalUrl.startsWith('/uploads');
    return res.status(404).json({ mensaje: esFoto ? 'Esa foto no existe' : 'Esa ruta no existe' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Algo salió mal en el servidor' });
});

export default app;
