import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const carpetaUploads = () => {
  const carpeta = process.env.UPLOADS_DIR || fileURLToPath(new URL('../../uploads', import.meta.url));
  mkdirSync(carpeta, { recursive: true });
  return carpeta;
};

export const PREFIJO_UPLOADS = '/uploads/';

export const esFotoSubida = (url) => typeof url === 'string' && /^\/uploads\/[\w-]+\.(jpg|png|webp|gif)$/.test(url);

export const borrarFotoSubida = async (url) => {
  if (!esFotoSubida(url)) return;
  const archivo = path.join(carpetaUploads(), path.basename(url));
  await unlink(archivo).catch(() => {});
};
