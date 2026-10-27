import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const rutaEnv = fileURLToPath(new URL('../../../.env', import.meta.url));
const rutaEjemplo = fileURLToPath(new URL('../../../.env.example', import.meta.url));

const nuevaClave = () => randomBytes(48).toString('hex');

try {
  if (!existsSync(rutaEnv)) {
    if (!existsSync(rutaEjemplo)) {
      console.log('[KorAura] No encontré .env.example; crea el archivo .env a mano.');
      process.exit(0);
    }
    const contenido = readFileSync(rutaEjemplo, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${nuevaClave()}`);
    writeFileSync(rutaEnv, contenido);
    console.log('[KorAura] Se creó el archivo .env con una clave JWT nueva.');
  } else {
    const actual = readFileSync(rutaEnv, 'utf8');
    if (/^JWT_SECRET=\s*$/m.test(actual)) {
      writeFileSync(rutaEnv, actual.replace(/^JWT_SECRET=\s*$/m, `JWT_SECRET=${nuevaClave()}`));
      console.log('[KorAura] Se agregó una clave JWT al archivo .env.');
    }
  }
} catch (error) {
  console.log(`[KorAura] No se pudo preparar el .env automáticamente: ${error.message}`);
}
