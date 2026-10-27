import mongoose from 'mongoose';
import { esFotoSubida } from '../config/uploads.js';

const esUrlValida = (valor) => {
  if (!valor) return true;
  if (esFotoSubida(valor)) return true; 
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [120, 'El nombre no puede pasar de 120 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'La descripción no puede pasar de 1000 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
      validate: { validator: Number.isInteger, message: 'El stock debe ser un número entero' },
    },
    imagen_url: {
      type: String,
      trim: true,
      default: '',
      validate: { validator: esUrlValida, message: 'La imagen debe ser una foto subida o un enlace que empiece por http:// o https://' },
    },
    disponible: { type: Boolean, default: true },
  },
  {
    collection: 'productos',
    timestamps: { createdAt: 'creadoEn', updatedAt: 'actualizadoEn' },
    versionKey: false,
  }
);

export default mongoose.model('Producto', productoSchema);
