(() => {
  "use strict";

  const { pedir, el, formatearPrecio, urlImagen, enlaceWhatsApp } = window.KorAura;
  const SUGERENCIAS = ["¿Qué bolsos tienen?", "Algo por menos de 70 mil", "Busco algo para la universidad"];

  const historial = [];
  let enviando = false;

  const lista = el("div", { class: "chat__mensajes", role: "log", "aria-live": "polite" });
  const input = el("input", {
    class: "chat__input",
    type: "text",
    maxlength: "500",
    placeholder: "Escribe qué buscas…",
    "aria-label": "Escribe tu pregunta",
    autocomplete: "off",
  });
  const enviarBtn = el("button", { class: "chat__enviar", type: "submit", "aria-label": "Enviar" }, "➤");
  const form = el("form", { class: "chat__form" }, input, enviarBtn);

  const panel = el(
    "section",
    { class: "chat__panel", id: "chatPanel", role: "dialog", "aria-label": "Asistente de compras", hidden: true },
    el(
      "header",
      { class: "chat__head" },
      el(
        "div",
        {},
        el("p", { class: "chat__titulo", text: "Asistente KorAura" }),
        el("p", { class: "chat__sub", text: "Te ayudo a encontrar tu producto" })
      ),
      el("button", { class: "chat__cerrar", type: "button", "aria-label": "Cerrar chat", onclick: () => abrir(false) }, "×")
    ),
    lista,
    form
  );

  const burbuja = el(
    "button",
    {
      class: "chat__burbuja",
      type: "button",
      "aria-label": "Abrir asistente de compras",
      "aria-controls": "chatPanel",
      "aria-expanded": "false",
      title: "¿Te ayudo a encontrar algo?",
      onclick: () => abrir(panel.hidden),
    },
    iconoChat()
  );

  document.body.append(panel, burbuja);

  function iconoChat() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "26");
    svg.setAttribute("height", "26");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12zM8.5 12h.01M12 12h.01M15.5 12h.01");
    svg.append(path);
    return svg;
  }

  function abrir(mostrar) {
    const estabaAbierto = !panel.hidden;
    panel.hidden = !mostrar;
    burbuja.setAttribute("aria-expanded", String(mostrar));
    burbuja.classList.toggle("is-open", mostrar);
    if (mostrar) {
      if (!lista.children.length) saludar();
      input.focus();
    } else if (estabaAbierto) {
      burbuja.focus();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) abrir(false);
  });

  const bajar = () => (lista.scrollTop = lista.scrollHeight);

  const agregarMensaje = (rol, texto) => {
    lista.append(el("p", { class: `chat__msg chat__msg--${rol}`, text: texto }));
    bajar();
  };

  const tarjetaProducto = (p) => {
    const foto = el("div", { class: "chat__prod-img" }, el("span", { text: p.nombre.charAt(0).toUpperCase() }));
    if (p.imagen_url) {
      const img = el("img", { src: urlImagen(p.imagen_url), alt: "", loading: "lazy" });
      img.addEventListener("error", () => img.remove());
      foto.append(img);
    }
    return el(
      "div",
      { class: "chat__prod" },
      foto,
      el(
        "div",
        { class: "chat__prod-info" },
        el("span", { class: "chat__prod-nombre", text: p.nombre }),
        el("span", { class: "chat__prod-precio", text: p.stock ? formatearPrecio(p.precio) : `${formatearPrecio(p.precio)} · Agotado` }),
        el("a", {
          class: "chat__prod-wa",
          href: enlaceWhatsApp(p.nombre),
          target: "_blank",
          rel: "noopener",
          text: "Pedir por WhatsApp",
        })
      )
    );
  };

  const saludar = () => {
    agregarMensaje("bot", "¡Hola! Cuéntame qué buscas o descríbeme el producto y te recomiendo opciones de la tienda.");
    const chips = el(
      "div",
      { class: "chat__sugerencias" },
      SUGERENCIAS.map((texto) =>
        el("button", { class: "chat__chip", type: "button", text: texto, onclick: () => enviar(texto) })
      )
    );
    lista.append(chips);
  };

  const enviar = async (texto) => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;

    lista.querySelector(".chat__sugerencias")?.remove();
    agregarMensaje("cliente", mensaje);
    input.value = "";
    enviando = true;
    enviarBtn.disabled = true;

    const escribiendo = el("p", { class: "chat__msg chat__msg--bot chat__escribiendo", text: "Escribiendo…" });
    lista.append(escribiendo);
    bajar();

    try {
      const datos = await pedir("/chat", {
        metodo: "POST",
        datos: { mensaje, historial: historial.slice(-6) },
        conToken: false,
      });
      escribiendo.remove();
      agregarMensaje("bot", datos.respuesta);
      if (datos.productos?.length) {
        lista.append(el("div", { class: "chat__productos" }, datos.productos.map(tarjetaProducto)));
        bajar();
      }
      historial.push({ rol: "cliente", texto: mensaje }, { rol: "bot", texto: datos.respuesta });
    } catch (error) {
      escribiendo.remove();
      agregarMensaje("bot", error.message);
    } finally {
      enviando = false;
      enviarBtn.disabled = false;
      input.focus();
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    enviar(input.value);
  });
})();
