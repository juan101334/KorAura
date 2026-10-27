import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_VALIDA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const crearToken = (usuario) => jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '8h' });

const datosPublicos = (usuario) => ({
  id: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
});

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Escribe tu correo y tu contraseña' });
  }

  const usuario = await Usuario.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  const credencialesOk = usuario && usuario.activo && (await usuario.compararPassword(String(password)));
  if (!credencialesOk) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
  }

  res.json({ token: crearToken(usuario), usuario: datosPublicos(usuario) });
};

export const perfil = (req, res) => {
  res.json(datosPublicos(req.usuario));
};

export const estado = async (req, res) => {
  const total = await Usuario.countDocuments();
  res.json({ necesitaPrimerAdmin: total === 0 });
};

export const registro = async (req, res) => {
  const { nombre, email, password } = req.body || {};

  const nombreLimpio = String(nombre || '').trim();
  const emailLimpio = String(email || '').toLowerCase().trim();
  const pass = String(password || '');

  if (!nombreLimpio || !emailLimpio || !pass) {
    return res.status(400).json({ mensaje: 'Escribe nombre, correo y contraseña' });
  }
  if (!EMAIL_VALIDO.test(emailLimpio)) {
    return res.status(400).json({ mensaje: 'El correo no tiene un formato válido' });
  }
  if (!PASSWORD_VALIDA.test(pass)) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 8 caracteres, con letras y números' });
  }

  const existe = await Usuario.exists({ email: emailLimpio });
  if (existe) {
    return res.status(409).json({ mensaje: 'Ya hay una cuenta con ese correo' });
  }

  const usuario = await Usuario.create({ nombre: nombreLimpio, email: emailLimpio, password: pass, rol: 'admin' });

  if (req.esPrimerAdmin) {
    return res.status(201).json({ token: crearToken(usuario), usuario: datosPublicos(usuario) });
  }
  res.status(201).json({ usuario: datosPublicos(usuario) });
};
