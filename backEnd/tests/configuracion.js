import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Usuario from '../src/models/Usuario.js';

process.env.JWT_SECRET = 'clave-de-prueba';
process.env.UPLOADS_DIR = mkdtempSync(path.join(tmpdir(), 'koraura-fotos-'));

let mongoPrueba;

export async function conectar() {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    mongoPrueba = await MongoMemoryServer.create();
    uri = mongoPrueba.getUri();
  }
  await mongoose.connect(uri, { dbName: `koraura_test_${process.pid}` });
}

export async function limpiar() {
  await mongoose.connection.dropDatabase();
}

export async function desconectar() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoPrueba) await mongoPrueba.stop();
  rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
}

export async function crearAdmin(email = 'admin@koraura.com') {
  const usuario = await Usuario.create({ nombre: 'Admin', email, password: 'Clave12345' });
  const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
  return { usuario, token };
}
