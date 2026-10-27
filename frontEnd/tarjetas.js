(() => {
  "use strict";

  const { el, formatearPrecio, urlImagen, normalizar, carrito } = window.KorAura;

  const SVG = "http://www.w3.org/2000/svg";
  const COLORES = ["sand", "sage", "bronze", "ink"];

  const TRAZOS = {
    bolso: [
      ["path", { d: "M72 76c0-34 56-34 56 0" }],
      ["path", { d: "M52 76h96l10 78a8 8 0 0 1-8 9H50a8 8 0 0 1-8-9z" }],
      ["path", { d: "M72 76v14M128 76v14" }],
    ],
    billetera: [
      ["rect", { x: "40", y: "62", width: "120", height: "82", rx: "10" }],
      ["path", { d: "M40 84h120" }],
      ["rect", { x: "118", y: "96", width: "42", height: "26", rx: "8" }],
      ["circle", { cx: "132", cy: "109", r: "3" }],
    ],
    correa: [
      ["path", { d: "M30 88h140a10 10 0 0 1 10 10v4a10 10 0 0 1-10 10H30" }],
      ["path", { d: "M30 88v24" }],
      ["rect", { x: "100", y: "80", width: "30", height: "40", rx: "6" }],
      ["path", { d: "M110 100h10" }],
      ["circle", { cx: "62", cy: "100", r: "2" }],
      ["circle", { cx: "82", cy: "100", r: "2" }],
      ["circle", { cx: "150", cy: "100", r: "2" }],
      ["circle", { cx: "168", cy: "100", r: "2" }],
    ],
  };

  const svg = (viewBox, atributos, ...trazos) => {
    const nodo = document.createElementNS(SVG, "svg");
    nodo.setAttribute("viewBox", viewBox);
    nodo.setAttribute("aria-hidden", "true");
    Object.entries(atributos).forEach(([k, v]) => nodo.setAttribute(k, v));
    trazos.forEach(([etiqueta, attrs]) => {
      const t = document.createElementNS(SVG, etiqueta);
      Object.entries(attrs).forEach(([k, v]) => t.setAttribute(k, v));
      nodo.append(t);
    });
    return nodo;
  };

  const tipoIcono = (categoria) => {
    const c = normalizar(categoria);
    if (c.includes("billet") || c.includes("cartera")) return "billetera";
    if (c.includes("corre") || c.includes("cint")) return "correa";
    return "bolso";
  };

  const icono = (categoria) =>
    svg(
      "0 0 200 200",
      { fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" },
      ...TRAZOS[tipoIcono(categoria)]
    );

  const datos = new WeakMap();

  const pintarAccion = (tarjeta) => {
    const registro = datos.get(tarjeta);
    const { producto, accion, id } = registro;
    const cantidad = carrito.cantidadDe(id);
    const agotado = !Number(producto.stock);

    if (registro.cantidad === cantidad && registro.agotado === agotado && accion.firstChild) return;
    registro.cantidad = cantidad;
    registro.agotado = agotado;

    const accionConFoco = accion.contains(document.activeElement)
      ? document.activeElement.getAttribute("data-accion")
      : null;
    let nuevo;

    if (agotado) {
      nuevo = el("button", { class: "btn card__add", type: "button", disabled: true, text: "Agotado" });
    } else if (cantidad === 0) {
      nuevo = el(
        "button",
        {
          class: "btn btn--ghost card__add",
          type: "button",
          "data-accion": "agregar",
          "aria-label": `Añadir ${producto.nombre} al carrito`,
          onclick: () => carrito.agregar(producto),
        },
        carrito.iconoBolsa(),
        "Añadir al carrito"
      );
    } else {
      nuevo = carrito.stepper(id);
    }

    accion.replaceChildren(nuevo);

    if (accionConFoco !== null) {
      const destino =
        accion.querySelector(`[data-accion="${accionConFoco}"]:not(:disabled)`) ||
        accion.querySelector('[data-accion="mas"]:not(:disabled), [data-accion="menos"], [data-accion="agregar"]');
      destino?.focus();
    }
  };

  const tarjetaProducto = (producto, indice = 0) => {
    const media = el("div", { class: `card__media card__media--${COLORES[indice % COLORES.length]}` });

    if (producto.imagen_url) {
      const img = el("img", { src: urlImagen(producto.imagen_url), alt: producto.nombre, loading: "lazy" });
      img.addEventListener("error", () => img.replaceWith(icono(producto.categoria)));
      media.append(img);
    } else {
      media.append(icono(producto.categoria));
    }

    if (!Number(producto.stock)) media.append(el("span", { class: "card__badge", text: "Agotado" }));

    const accion = el("div", { class: "card__accion" });

    const tarjeta = el(
      "article",
      { class: "card" },
      media,
      el(
        "div",
        { class: "card__body" },
        el("h3", { class: "card__name", text: producto.nombre }),
        producto.descripcion ? el("p", { class: "card__desc", text: producto.descripcion }) : null,
        el("p", { class: "card__price", text: formatearPrecio(producto.precio) }),
        accion
      )
    );

    datos.set(tarjeta, { producto, accion, id: carrito.idDe(producto), cantidad: -1, agotado: null });
    pintarAccion(tarjeta);
    return tarjeta;
  };

  document.addEventListener("carrito:cambio", () => {
    document.querySelectorAll(".card").forEach((tarjeta) => {
      if (datos.has(tarjeta)) pintarAccion(tarjeta);
    });
  });

  window.KorAura.tarjetaProducto = tarjetaProducto;
})();
