const POLITICA_CONTENIDO = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self'",
  'frame-src https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const ORIGEN_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const origenesPermitidos = () =>
  String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

export const cabecerasSeguridad = (req, res, next) => {
  res.set({
    'Content-Security-Policy': POLITICA_CONTENIDO,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  next();
};

export const opcionesCors = {
  origin: (origen, callback) => callback(null, !origen || ORIGEN_LOCAL.test(origen) || origenesPermitidos().includes(origen)),
};
