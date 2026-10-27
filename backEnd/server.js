import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import connectDB from './src/config/database.js';
import app from './src/app.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

if (!process.env.JWT_SECRET) {
  console.error('Falta definir JWT_SECRET en el archivo .env (corre "npm install" o copia .env.example a .env)');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

await connectDB();

const servidor = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Tienda:   http://localhost:${PORT}`);
  console.log(`Catálogo: http://localhost:${PORT}/catalogo.html`);
  console.log(`Panel:    http://localhost:${PORT}/login.html`);
});

const apagar = (senal) => {
  console.log(`Recibida la señal ${senal}, cerrando el servidor`);
  servidor.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
