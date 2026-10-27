import Producto from '../models/Producto.js';
import { borrarFotoSubida, PREFIJO_UPLOADS } from '../config/uploads.js';

const CAMPOS = ['nombre', 'descripcion', 'precio', 'categoria', 'stock', 'imagen_url', 'disponible'];

const tomarCampos = (body = {}) =>
  Object.fromEntries(CAMPOS.filter((campo) => body[campo] !== undefined).map((campo) => [campo, body[campo]]));

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listarPublicos = async (req, res) => {
  const productos = await Producto.find({ disponible: true }).sort({ _id: -1 });
  res.json(productos);
};

export const listarTodos = async (req, res) => {
  const filtro = {};
  const { buscar, categoria } = req.query;

  if (buscar) filtro.nombre = { $regex: escaparRegex(String(buscar)), $options: 'i' };
  if (categoria) filtro.categoria = String(categoria);

  const productos = await Producto.find(filtro).sort({ _id: -1 });
  res.json(productos);
};

export const obtener = async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto) return res.status(404).json({ mensaje: 'Ese producto no existe' });
  res.json(producto);
};

export const crear = async (req, res) => {
  const producto = await Producto.create(tomarCampos(req.body));
  res.status(201).json(producto);
};

export const actualizar = async (req, res) => {
  const anterior = await Producto.findById(req.params.id);
  if (!anterior) return res.status(404).json({ mensaje: 'Ese producto no existe' });

  const producto = await Producto.findByIdAndUpdate(req.params.id, tomarCampos(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!producto) return res.status(404).json({ mensaje: 'Ese producto no existe' });

  if (anterior.imagen_url !== producto.imagen_url) await borrarFotoSubida(anterior.imagen_url);

  res.json(producto);
};

export const eliminar = async (req, res) => {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) return res.status(404).json({ mensaje: 'Ese producto no existe' });
  await borrarFotoSubida(producto.imagen_url);
  res.json({ mensaje: 'Producto eliminado', id: producto._id });
};

export const subirFoto = (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'Elige una foto para subir' });
  res.status(201).json({ url: `${PREFIJO_UPLOADS}${req.file.filename}` });
};
