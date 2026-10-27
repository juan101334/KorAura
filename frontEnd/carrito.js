(() => {
  "use strict";

  const { el, formatearPrecio, urlImagen, enlaceWhatsAppTexto } = window.KorAura;

  const CLAVE = "koraura_carrito";
  const MAXIMO_POR_PRODUCTO = 20;
  const SVG = "http://www.w3.org/2000/svg";

  const idDe = (producto) => String(producto._id ?? producto.id ?? producto.nombre);
  const tope = (item) => Math.max(0, Math.min(Number(item.stock) || 0, MAXIMO_POR_PRODUCTO));
  const precioTexto = (valor) => formatearPrecio(valor).replace(/\u00a0/g, " ");
  const textoUnidades = (n) => `${n} ${n === 1 ? "producto" : "productos"}`;

  const leer = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE));
      if (!Array.isArray(datos)) return [];
      return datos
        .filter((i) => i && i.id)
        .map((i) => ({
          id: String(i.id),
          nombre: String(i.nombre || ""),
          precio: Number(i.precio) || 0,
          stock: Number(i.stock) || 0,
          imagen_url: String(i.imagen_url || ""),
          cantidad: Math.floor(Number(i.cantidad)) || 0,
        }))
        .filter((i) => i.cantidad > 0 && i.nombre);
    } catch {
      return [];
    }
  };

  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      return;
    }
  };

  let items = leer();
  let avisos = [];
  let foco = null;
  let unidadesAnteriores = items.reduce((suma, i) => suma + i.cantidad, 0);

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

  const iconoBolsa = () =>
    svg(
      "0 0 24 24",
      { fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" },
      ["path", { d: "M5 8h14l-1 12H6z" }],
      ["path", { d: "M9 8V6.500a3 3 0 0 1 6 0V8" }]
    );

  const iconoWhatsApp = () =>
    svg("0 0 24 24", { width: "18", height: "18", fill: "currentColor" }, ["use", { href: "#wa-path" }]);

  const anuncio = el("div", { class: "sr-only", role: "status", "aria-live": "polite" });
  const anunciar = (texto) => {
    anuncio.textContent = "";
    setTimeout(() => {
      anuncio.textContent = texto;
    }, 50);
  };

  const unidades = () => items.reduce((suma, i) => suma + i.cantidad, 0);
  const total = () => items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  const cantidadDe = (id) => items.find((i) => i.id === String(id))?.cantidad ?? 0;

  const mensaje = () =>
    [
      "Hola, quiero hacer este pedido en KorAura:",
      "",
      ...items.map(
        (i) => `- ${i.cantidad} x ${i.nombre} (${precioTexto(i.precio)} c/u) = ${precioTexto(i.precio * i.cantidad)}`
      ),
      "",
      `Total: ${precioTexto(total())}`,
      "",
      "¿Me confirman disponibilidad y envío?",
    ].join("\n");

  const botonCarrito = document.getElementById("cartBtn");
  const insigniaCarrito = document.getElementById("cartCount");

  const pintarBoton = (cantidad) => {
    if (!botonCarrito || !insigniaCarrito) return;
    botonCarrito.setAttribute(
      "aria-label",
      cantidad ? `Abrir carrito, ${textoUnidades(cantidad)}` : "Abrir carrito"
    );
    insigniaCarrito.hidden = cantidad === 0;
    insigniaCarrito.textContent = cantidad > 99 ? "99+" : String(cantidad);
    if (cantidad > unidadesAnteriores) {
      insigniaCarrito.classList.remove("is-bump");
      void insigniaCarrito.offsetWidth;
      insigniaCarrito.classList.add("is-bump");
    }
    unidadesAnteriores = cantidad;
  };

  const stepper = (id) => {
    const item = items.find((i) => i.id === String(id));
    if (!item) return null;
    return el(
      "div",
      { class: "stepper", role: "group", "aria-label": `Cantidad de ${item.nombre}` },
      el(
        "button",
        {
          class: "stepper__btn",
          type: "button",
          "aria-label": `Quitar una unidad de ${item.nombre}`,
          "data-id": item.id,
          "data-accion": "menos",
          onclick: () => cambiar(item.id, -1, "menos"),
        },
        "−"
      ),
      el("span", { class: "stepper__valor", text: String(item.cantidad) }),
      el(
        "button",
        {
          class: "stepper__btn",
          type: "button",
          "aria-label": `Añadir una unidad de ${item.nombre}`,
          "data-id": item.id,
          "data-accion": "mas",
          disabled: item.cantidad >= tope(item),
          onclick: () => cambiar(item.id, 1, "mas"),
        },
        "+"
      )
    );
  };

  const cuerpoLista = el("ul", { class: "cart__lista" });
  const vacio = el(
    "div",
    { class: "cart__vacio" },
    el("p", { class: "cart__vacio-titulo", text: "Tu carrito está vacío" }),
    el("p", { class: "cart__vacio-texto", text: "Añade productos del catálogo y envía tu pedido por WhatsApp." }),
    el("a", {
      class: "btn btn--ghost",
      href: "catalogo.html",
      text: "Ver catálogo",
      onclick: (e) => {
        if (/catalogo(\.html)?$/.test(location.pathname)) {
          e.preventDefault();
          cerrar();
        }
      },
    })
  );
  const avisoEl = el("p", { class: "cart__aviso", role: "status", hidden: true });
  const resumenEl = el("span", { class: "cart__resumen" });
  const totalEl = el("strong", { class: "cart__total-valor" });
  const enviar = el(
    "a",
    { class: "btn btn--primary cart__enviar", href: "#", target: "_blank", rel: "noopener" },
    iconoWhatsApp(),
    "Enviar pedido por WhatsApp"
  );

  const pie = el(
    "footer",
    { class: "cart__pie" },
    el("p", { class: "cart__total" }, el("span", { text: "Total" }), totalEl),
    el("p", { class: "cart__nota", text: "Confirmamos disponibilidad y envío por WhatsApp." }),
    enviar,
    el("button", { class: "cart__vaciar", type: "button", text: "Vaciar carrito", onclick: () => vaciar() })
  );

  const dialogo = el(
    "dialog",
    { class: "cart", id: "cartDialog", "aria-labelledby": "cartTitulo" },
    el(
      "header",
      { class: "cart__head" },
      el("h2", { class: "cart__titulo", id: "cartTitulo" }, "Tu carrito", resumenEl),
      el("button", { class: "cart__cerrar", type: "button", "aria-label": "Cerrar carrito", onclick: () => cerrar() }, "×")
    ),
    avisoEl,
    el("div", { class: "cart__cuerpo" }, cuerpoLista, vacio),
    pie
  );

  const fila = (item) => {
    const foto = el("div", { class: "cart__foto" });
    if (item.imagen_url) {
      const img = el("img", { src: urlImagen(item.imagen_url), alt: "", loading: "lazy" });
      img.addEventListener("error", () => img.replaceWith(iconoBolsa()));
      foto.append(img);
    } else {
      foto.append(iconoBolsa());
    }

    return el(
      "li",
      { class: "cart__item" },
      foto,
      el(
        "div",
        { class: "cart__info" },
        el("p", { class: "cart__nombre", text: item.nombre }),
        el("p", { class: "cart__unit", text: formatearPrecio(item.precio) }),
        stepper(item.id)
      ),
      el(
        "div",
        { class: "cart__lado" },
        el("p", { class: "cart__sub", text: formatearPrecio(item.precio * item.cantidad) }),
        el(
          "button",
          {
            class: "cart__quitar",
            type: "button",
            "aria-label": `Quitar ${item.nombre} del carrito`,
            "data-id": item.id,
            "data-accion": "quitar",
            text: "Quitar",
            onclick: () => quitar(item.id, "quitar"),
          }
        )
      )
    );
  };

  const restaurarFoco = () => {
    if (!foco || !dialogo.open) {
      foco = null;
      return;
    }
    const { id, accion } = foco;
    foco = null;
    const mismoId = `[data-id="${CSS.escape(id)}"]`;
    const destino =
      dialogo.querySelector(`${mismoId}[data-accion="${accion}"]:not(:disabled)`) ||
      dialogo.querySelector(`${mismoId}:not(:disabled)`) ||
      dialogo.querySelector(".cart__quitar") ||
      dialogo.querySelector(".cart__cerrar");
    destino?.focus();
  };

  function pintar() {
    const cantidad = unidades();
    cuerpoLista.replaceChildren(...items.map(fila));
    cuerpoLista.hidden = items.length === 0;
    vacio.hidden = items.length > 0;
    pie.hidden = items.length === 0;
    resumenEl.textContent = cantidad ? textoUnidades(cantidad) : "";
    totalEl.textContent = formatearPrecio(total());
    enviar.href = items.length ? enlaceWhatsAppTexto(mensaje()) : "#";
    pintarBoton(cantidad);
    restaurarFoco();
  }

  function notificar() {
    guardar();
    pintar();
    document.dispatchEvent(new CustomEvent("carrito:cambio"));
  }

  function cambiar(id, delta, accion) {
    const item = items.find((i) => i.id === String(id));
    if (!item) return;
    const nueva = Math.min(item.cantidad + delta, tope(item));
    if (dialogo.open && accion) foco = { id: item.id, accion };
    if (nueva <= 0) {
      items = items.filter((i) => i !== item);
      anunciar(`${item.nombre} quitado del carrito`);
    } else {
      item.cantidad = nueva;
      anunciar(`${item.nombre}: ${nueva} en el carrito`);
    }
    notificar();
  }

  function agregar(producto) {
    const id = idDe(producto);
    const datos = {
      id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      stock: Number(producto.stock) || 0,
      imagen_url: producto.imagen_url || "",
    };
    const existente = items.find((i) => i.id === id);
    if (existente) Object.assign(existente, datos);
    else items.push({ ...datos, cantidad: 0 });
    cambiar(id, 1);
  }

  function quitar(id, accion) {
    const item = items.find((i) => i.id === String(id));
    if (!item) return;
    if (dialogo.open && accion) foco = { id: item.id, accion };
    items = items.filter((i) => i !== item);
    anunciar(`${item.nombre} quitado del carrito`);
    notificar();
  }

  function vaciar() {
    items = [];
    anunciar("Carrito vacío");
    notificar();
    dialogo.querySelector(".cart__cerrar")?.focus();
  }

  function sincronizar(productos) {
    const porId = new Map(productos.map((p) => [idDe(p), p]));
    const quitados = [];
    items = items.filter((item) => {
      const actual = porId.get(item.id);
      if (!actual || !Number(actual.stock)) {
        quitados.push(item.nombre);
        return false;
      }
      item.nombre = actual.nombre;
      item.precio = Number(actual.precio) || 0;
      item.stock = Number(actual.stock) || 0;
      item.imagen_url = actual.imagen_url || "";
      item.cantidad = Math.min(item.cantidad, tope(item));
      return true;
    });
    avisos = quitados;
    notificar();
  }

  function abrir() {
    avisoEl.textContent = avisos.length
      ? `Quitamos del carrito lo que ya no está disponible: ${avisos.join(", ")}.`
      : "";
    avisoEl.hidden = avisos.length === 0;
    avisos = [];
    pintar();
    if (!dialogo.open) dialogo.showModal();
  }

  function cerrar() {
    if (dialogo.open) dialogo.close();
  }

  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) cerrar();
  });

  botonCarrito?.addEventListener("click", abrir);

  window.addEventListener("storage", (e) => {
    if (e.key !== CLAVE) return;
    items = leer();
    pintar();
    document.dispatchEvent(new CustomEvent("carrito:cambio"));
  });

  document.body.append(dialogo, anuncio);
  pintar();

  window.KorAura.carrito = { idDe, agregar, cambiar, quitar, cantidadDe, sincronizar, abrir, stepper, iconoBolsa };
})();
