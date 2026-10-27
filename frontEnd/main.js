(() => {
  "use strict";

  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const { pedir, el, tarjetaProducto, carrito } = window.KorAura;
  const DESTACADOS = 4;

  const mensaje = (texto) => el("p", { class: "grid__empty", text: texto });

  const cargar = async () => {
    try {
      const productos = await pedir("/productos", { conToken: false });
      if (Array.isArray(productos)) carrito.sincronizar(productos);
      if (!Array.isArray(productos) || productos.length === 0) {
        grid.replaceChildren(mensaje("Muy pronto tendremos productos nuevos. Escríbenos por WhatsApp."));
        return;
      }
      grid.replaceChildren(...productos.slice(0, DESTACADOS).map((p, i) => tarjetaProducto(p, i)));
    } catch {
      grid.replaceChildren(mensaje("No pudimos cargar los productos en este momento. Inténtalo de nuevo en unos minutos."));
    }
  };

  cargar();
})();
