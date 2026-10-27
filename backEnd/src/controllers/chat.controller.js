import Producto from '../models/Producto.js';
import { preguntarIA } from '../services/openai.js';
import { responderSinIA } from '../services/busquedaLocal.js';

const LARGO_MAXIMO = 500;

const limpiarHistorial = (historial) => {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter((m) => (m?.rol === 'cliente' || m?.rol === 'bot') && typeof m.texto === 'string')
    .slice(-6)
    .map((m) => ({ role: m.rol === 'cliente' ? 'user' : 'assistant', content: m.texto.slice(0, LARGO_MAXIMO) }));
};

export const conversar = async (req, res) => {
  const mensaje = String(req.body?.mensaje || '').trim();

  if (!mensaje) {
    return res.status(400).json({ mensaje: 'Escribe tu pregunta' });
  }
  if (mensaje.length > LARGO_MAXIMO) {
    return res.status(400).json({ mensaje: `La pregunta no puede pasar de ${LARGO_MAXIMO} caracteres` });
  }

  const productos = await Producto.find({ disponible: true }).lean();

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ ...responderSinIA(mensaje, productos), modo: 'local' });
  }

  try {
    const { respuesta, ids } = await preguntarIA({ mensaje, historial: limpiarHistorial(req.body.historial), productos });
    const recomendados = ids
      .map((id) => productos.find((p) => String(p._id) === id))
      .filter(Boolean)
      .slice(0, 3);
    res.json({ respuesta, productos: recomendados, modo: 'ia' });
  } catch (error) {
    console.error(`Chatbot: OpenAI no respondió (${error.message}). Se usa la búsqueda local.`);
    res.json({ ...responderSinIA(mensaje, productos), modo: 'local' });
  }
};
