export const crearLimitador = ({ maximo, ventanaMs, mensaje }) => {
  const registros = new Map();

  setInterval(() => {
    const ahora = Date.now();
    for (const [clave, registro] of registros) {
      if (ahora - registro.inicio > ventanaMs) registros.delete(clave);
    }
  }, ventanaMs).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    const clave = req.ip;
    const registro = registros.get(clave);

    if (!registro || ahora - registro.inicio > ventanaMs) {
      registros.set(clave, { inicio: ahora, cantidad: 1 });
      return next();
    }

    registro.cantidad += 1;
    if (registro.cantidad > maximo) {
      const espera = Math.ceil((registro.inicio + ventanaMs - ahora) / 1000);
      res.set('Retry-After', String(espera));
      return res.status(429).json({ mensaje });
    }
    next();
  };
};
