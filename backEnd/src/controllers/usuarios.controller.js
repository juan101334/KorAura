import Usuario from '../models/Usuario.js';

export const listar = async (req, res) => {
  const usuarios = await Usuario.find().sort({ _id: 1 });
  res.json(
    usuarios.map((u) => ({
      id: u._id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      creadoEn: u.creadoEn,
    }))
  );
};

export const cambiarEstado = async (req, res) => {
  const { activo } = req.body || {};

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ mensaje: 'Indica si la cuenta queda activa (true o false)' });
  }
  if (String(req.usuario._id) === String(req.params.id)) {
    return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
  }

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { activo }, { returnDocument: 'after' });
  if (!usuario) return res.status(404).json({ mensaje: 'Ese usuario no existe' });

  res.json({ id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo });
};
