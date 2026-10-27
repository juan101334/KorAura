import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const verificarToken = async (req, res, next) => {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Necesitas iniciar sesión' });
  }

  let id;
  try {
    ({ id } = jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    return res.status(401).json({ mensaje: 'La sesión venció, inicia sesión de nuevo' });
  }

  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ mensaje: 'La sesión no es válida' });
  }

  req.usuario = usuario;
  next();
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Esta sección es solo para el administrador' });
  }
  next();
};

export const permitirRegistro = async (req, res, next) => {
  const total = await Usuario.countDocuments();
  if (total === 0) {
    req.esPrimerAdmin = true;
    return next();
  }
  return verificarToken(req, res, () => soloAdmin(req, res, next));
};
