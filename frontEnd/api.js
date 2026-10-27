(() => {
  "use strict";

  const config = { whatsapp: "", puertoBackend: "5000", apiUrl: "", ...window.KORAURA_CONFIG };

  const esLocal = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const usarPuertoLocal = location.protocol === "file:" || (esLocal && location.port !== config.puertoBackend);
  const API_URL = config.apiUrl || (usarPuertoLocal ? `http://localhost:${config.puertoBackend}/api` : `${location.origin}/api`);

  const TOKEN_KEY = "koraura_token";
  const USER_KEY = "koraura_user";

  const sesion = {
    token: () => sessionStorage.getItem(TOKEN_KEY),
    guardar: (token, nombre) => {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, nombre || "Administrador");
    },
    cerrar: () => {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    },
  };

  class ErrorApi extends Error {
    constructor(mensaje, status) {
      super(mensaje);
      this.status = status;
    }
  }

  const pedir = async (ruta, { metodo = "GET", datos, conToken = true } = {}) => {
    const headers = {};
    const esArchivo = datos instanceof FormData;
    if (datos !== undefined && !esArchivo) headers["Content-Type"] = "application/json";
    const token = sesion.token();
    if (conToken && token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers,
        body: datos === undefined ? undefined : esArchivo ? datos : JSON.stringify(datos),
      });
    } catch {
      throw new ErrorApi("No pudimos conectar con el servidor. Revisa que el backend esté encendido.", 0);
    }

    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ErrorApi(cuerpo.mensaje || "Algo salió mal. Intenta de nuevo.", res.status);
    }
    return cuerpo;
  };

  const subirFoto = async (archivo) => {
    const datos = new FormData();
    datos.append("imagen", archivo);
    const { url } = await pedir("/productos/imagen", { metodo: "POST", datos });
    return url;
  };

  const ORIGEN_BACKEND = API_URL.replace(/\/api$/, "");
  const urlImagen = (url) => (url && url.startsWith("/uploads/") ? `${ORIGEN_BACKEND}${url}` : url || "");

  const formatoPesos = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
  const formatearPrecio = (valor) => formatoPesos.format(Number(valor) || 0);

  const enlaceWhatsApp = (producto) => {
    const texto = producto
      ? `Hola, me interesa el producto "${producto}" de KorAura. ¿Me das más información?`
      : "Hola, quisiera más información sobre los productos KorAura";
    return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;
  };

  const enlaceWhatsAppTexto = (texto) => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;

  const normalizar = (texto) =>
    String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const el = (etiqueta, props = {}, ...hijos) => {
    const nodo = document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(props)) {
      if (valor === undefined || valor === null || valor === false) continue;
      if (clave === "class") nodo.className = valor;
      else if (clave === "text") nodo.textContent = valor;
      else if (clave === "dataset") Object.assign(nodo.dataset, valor);
      else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
      else nodo.setAttribute(clave, valor === true ? "" : valor);
    }
    for (const hijo of hijos.flat()) {
      if (hijo === null || hijo === undefined || hijo === false) continue;
      nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    }
    return nodo;
  };

  window.KorAura = {
    API_URL,
    sesion,
    pedir,
    subirFoto,
    urlImagen,
    ErrorApi,
    formatearPrecio,
    enlaceWhatsApp,
    enlaceWhatsAppTexto,
    normalizar,
    el,
  };
})();
