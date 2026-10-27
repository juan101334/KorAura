import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { open, unlink } from 'node:fs/promises';
import { carpetaUploads } from '../config/uploads.js';

export const TAMANO_MAXIMO_MB = 5;

const EXTENSIONES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const FIRMAS = [
  (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  (bytes) => bytes.subarray(0, 8).equals(FIRMA_PNG),
  (bytes) => ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('latin1')),
  (bytes) => bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP',
];

const tieneFormatoDeImagen = async (ruta) => {
  const archivo = await open(ruta, 'r');
  try {
    const { buffer, bytesRead } = await archivo.read(Buffer.alloc(12), 0, 12, 0);
    const inicio = buffer.subarray(0, bytesRead);
    return FIRMAS.some((firma) => firma(inicio));
  } finally {
    await archivo.close();
  }
};

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaUploads()),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${EXTENSIONES[file.mimetype]}`),
});

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: TAMANO_MAXIMO_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true);
    const error = new Error('La foto debe ser JPG, PNG, WEBP o GIF');
    error.status = 400;
    cb(error);
  },
});

export const subirImagen = (req, res, next) => {
  subida.single('imagen')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: `La foto pesa más de ${TAMANO_MAXIMO_MB} MB` });
      }
      if (err instanceof multer.MulterError || err.status === 400) {
        return res.status(400).json({ mensaje: err.status === 400 ? err.message : 'No se pudo recibir la foto' });
      }
      return next(err);
    }

    if (!req.file) return next();

    try {
      if (await tieneFormatoDeImagen(req.file.path)) return next();
      await unlink(req.file.path).catch(() => {});
      return res.status(400).json({ mensaje: 'El archivo no es una imagen válida' });
    } catch (error) {
      next(error);
    }
  });
};
