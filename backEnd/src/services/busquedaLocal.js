const normalizar = (texto) =>
  String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const PALABRAS_VACIAS = new Set([
  'que', 'tienen', 'tiene', 'para', 'una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'con', 'por',
  'quiero', 'busco', 'necesito', 'algo', 'hay', 'cuanto', 'vale', 'cuesta', 'precio', 'me', 'mas',
  'menos', 'mil', 'pesos', 'hola', 'como', 'esta', 'estan', 'tienes', 'de', 'el', 'la', 'un', 'y', 'o',
]);

const SINONIMOS = { cinturon: 'cinto', correa: 'cinto', cartera: 'billetera', monedero: 'billetera', mochila: 'bolso', morral: 'bolso' };

const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const leerPrecioMaximo = (texto) => {
  const encontrado = texto.match(/(?:menos de|hasta|maximo|max)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (!encontrado) return null;
  let valor = Number(encontrado[1].replace(/\./g, ''));
  if (encontrado[2]) valor *= 1000;
  return valor || null;
};

export const buscarProductos = (mensaje, productos) => {
  const texto = normalizar(mensaje);
  const precioMaximo = leerPrecioMaximo(texto);
  const palabras = texto
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p))
    .map((p) => SINONIMOS[p] || p);

  const puntuados = productos
    .filter((p) => precioMaximo === null || p.precio <= precioMaximo)
    .map((producto) => {
      const nombre = normalizar(producto.nombre);
      const resto = normalizar(`${producto.categoria} ${producto.descripcion}`);
      let puntos = 0;
      for (const palabra of palabras) {
        const raiz = palabra.length > 4 ? palabra.replace(/(es|s)$/, '') : palabra;
        if (nombre.includes(raiz)) puntos += 3;
        else if (resto.includes(raiz)) puntos += 1;
      }
      return { producto, puntos };
    });

  const sinPalabras = palabras.length === 0 && precioMaximo !== null;

  return puntuados
    .filter((p) => p.puntos > 0 || sinPalabras)
    .sort((a, b) => b.puntos - a.puntos || a.producto.precio - b.producto.precio)
    .slice(0, 3)
    .map((p) => p.producto);
};

export const responderSinIA = (mensaje, productos) => {
  const encontrados = buscarProductos(mensaje, productos);

  if (encontrados.length === 0 && /^(hola|buenas|buenos|hey)\b/.test(normalizar(mensaje).trim())) {
    return {
      respuesta: '¡Hola! Cuéntame qué estás buscando (por ejemplo "un bolso para la universidad") y te muestro las opciones.',
      productos: [],
    };
  }

  if (encontrados.length === 0) {
    return {
      respuesta:
        'No encontré un producto con esa descripción. Prueba con otras palabras (por ejemplo "bolso", "billetera" o "cinto") o escríbenos por WhatsApp y te ayudamos.',
      productos: [],
    };
  }

  const lista = encontrados.map((p) => `${p.nombre} (${formatoPesos.format(p.precio)})`).join(', ');
  return {
    respuesta: encontrados.length === 1 ? `Te puede servir: ${lista}.` : `Encontré estas opciones: ${lista}.`,
    productos: encontrados,
  };
};
