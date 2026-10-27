import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import Usuario from '../models/Usuario.js';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const email = (process.env.ADMIN_EMAIL || 'admin@koraura.com').toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;

if (!password || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
  console.error('Falta ADMIN_PASSWORD (mínimo 8 caracteres, con letras y números).');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);

  let admin = await Usuario.findOne({ email });
  if (admin) {
    admin.password = password;
    admin.rol = 'admin';
    admin.activo = true;
  } else {
    admin = new Usuario({ nombre: 'Administrador KorAura', email, password, rol: 'admin' });
  }

  await admin.save();
  console.log(`Listo, ${email} ya puede iniciar sesión.`);
} catch (error) {
  console.error(`No se pudo crear el administrador: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
