import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import Producto from '../models/Producto.js';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const PRODUCTOS = [
  {
    nombre: 'Bolso crossbody',
    descripcion: 'Compacto, con correa ajustable y cierre magnético.',
    precio: 129000,
    categoria: 'Bolsos',
    stock: 8,
  },
  {
    nombre: 'Tote bag',
    descripcion: 'Amplio y estructurado, para el trabajo o la universidad.',
    precio: 159000,
    categoria: 'Bolsos',
    stock: 5,
  },
  {
    nombre: 'Morral urbano',
    descripcion: 'Espacio para portátil y compartimentos internos, con correas acolchadas.',
    precio: 189000,
    categoria: 'Bolsos',
    stock: 4,
  },
  {
    nombre: 'Billetera slim',
    descripcion: 'Delgada, con espacio para tarjetas y billetes.',
    precio: 69000,
    categoria: 'Billeteras',
    stock: 12,
  },
  {
    nombre: 'Billetera larga',
    descripcion: 'Doble compartimento para billetes, monedero con cierre y ranuras para tarjetas.',
    precio: 89000,
    categoria: 'Billeteras',
    stock: 6,
  },
  {
    nombre: 'Cinto Eko',
    descripcion: 'Hebilla metálica y acabado mate que resiste el uso diario.',
    precio: 59000,
    categoria: 'Correas',
    stock: 15,
  },
  {
    nombre: 'Correa clásica',
    descripcion: 'Ancho de 3,5 cm con hebilla plateada, para vestir o para el día a día.',
    precio: 65000,
    categoria: 'Correas',
    stock: 10,
  },
  {
    nombre: 'Portatarjetas',
    descripcion: 'Formato mínimo para llevar lo esencial en el bolsillo.',
    precio: 39000,
    categoria: 'Accesorios',
    stock: 20,
  },
  {
    nombre: 'Llavero artesanal',
    descripcion: 'Con herraje metálico y cuero trenzado a mano.',
    precio: 25000,
    categoria: 'Accesorios',
    stock: 0,
  },
];

const reiniciar = process.argv.includes('--reiniciar');

try {
  await mongoose.connect(process.env.MONGODB_URI);

  if (reiniciar) await Producto.deleteMany({});

  const existentes = await Producto.countDocuments();
  if (existentes > 0) {
    console.log(`Ya hay ${existentes} productos. Usa "npm run semilla -- --reiniciar" para borrarlos y cargar los de ejemplo.`);
  } else {
    await Producto.insertMany(PRODUCTOS);
    console.log(`Se crearon ${PRODUCTOS.length} productos de ejemplo.`);
  }
} catch (error) {
  console.error(`No se pudieron crear los productos: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
