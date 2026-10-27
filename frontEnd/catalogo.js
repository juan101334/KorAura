(() => {
  "use strict";

  const { pedir, el, tarjetaProducto, normalizar } = window.KorAura;
  const $ = (id) => document.getElementById(id);

  const grid = $("catalogGrid");
  const formulario = $("catalogForm");
  const buscar = $("catalogBuscar");
  const orden = $("catalogOrden");
  const chips = $("catalogCategorias");
  const contador = $("catalogContador");
  const limpiar = $("catalogLimpiar");
  const vacio = $("catalogVacio");
  const vacioTitulo = $("catalogVacioTitulo");
  const vacioTexto = $("catalogVacioTexto");
  const vacioLimpiar = $("catalogVacioLimpiar");

  const ORDENAR = {
    recientes: null,
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
  };

  let catalogo = [];
  let categoria = "";
  let temporizador;

  const cantidadTexto = (n) => `${n} ${n === 1 ? "producto" : "productos"}`;

  const leerUrl = () => {
    const params = new URLSearchParams(location.search);
    const ordenUrl = params.get("orden");
    buscar.value = params.get("q") || "";
    categoria = params.get("categoria") || "";
    orden.value = Object.hasOwn(ORDENAR, ordenUrl) ? ordenUrl : "recientes";
  };

  const escribirUrl = () => {
    const params = new URLSearchParams();
    const texto = buscar.value.trim();
    if (texto) params.set("q", texto);
    if (categoria) params.set("categoria", categoria);
    if (orden.value !== "recientes") params.set("orden", orden.value);
    const consulta = params.toString();
    try {
      history.replaceState(null, "", `${location.pathname}${consulta ? `?${consulta}` : ""}`);
    } catch {
      return;
    }
  };

  const marcarCategoria = () => {
    chips.querySelectorAll(".chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.categoria === categoria));
    });
  };

  const elegirCategoria = (valor) => {
    categoria = valor;
    marcarCategoria();
    pintar();
  };

  const pintarCategorias = () => {
    const conteo = new Map();
    catalogo.forEach(({ producto }) => {
      if (producto.categoria) conteo.set(producto.categoria, (conteo.get(producto.categoria) || 0) + 1);
    });
    const nombres = [...conteo.keys()].sort((a, b) => a.localeCompare(b, "es"));
    if (categoria && !conteo.has(categoria)) categoria = "";

    const crearChip = (valor, texto, cantidad) =>
      el(
        "button",
        {
          class: "chip",
          type: "button",
          "aria-pressed": String(categoria === valor),
          dataset: { categoria: valor },
          onclick: () => elegirCategoria(valor),
        },
        texto,
        el("span", { class: "chip__count", text: cantidad })
      );

    chips.replaceChildren(
      crearChip("", "Todas", catalogo.length),
      ...nombres.map((nombre) => crearChip(nombre, nombre, conteo.get(nombre)))
    );
  };

  const filtrados = () => {
    const terminos = normalizar(buscar.value).split(/\s+/).filter(Boolean);
    const lista = catalogo
      .filter(({ producto, texto }) => (!categoria || producto.categoria === categoria) && terminos.every((t) => texto.includes(t)))
      .map(({ producto }) => producto);
    const comparar = ORDENAR[orden.value];
    return comparar ? lista.sort(comparar) : lista;
  };

  function pintar() {
    const lista = filtrados();
    const hayFiltro = Boolean(buscar.value.trim() || categoria);

    grid.setAttribute("aria-busy", "false");
    grid.replaceChildren(...lista.map((producto, indice) => tarjetaProducto(producto, indice)));
    grid.hidden = lista.length === 0;
    vacio.hidden = lista.length !== 0;
    limpiar.hidden = !hayFiltro;
    vacioLimpiar.hidden = !hayFiltro;

    if (catalogo.length === 0) {
      vacioTitulo.textContent = "Muy pronto tendremos productos nuevos";
      vacioTexto.textContent = "Escríbenos por WhatsApp y te contamos qué hay disponible.";
      contador.textContent = "";
    } else {
      vacioTitulo.textContent = "Ningún producto coincide";
      vacioTexto.textContent = "Prueba con otra palabra o quita los filtros para ver todo el catálogo.";
      contador.textContent = hayFiltro
        ? `Mostrando ${lista.length} de ${cantidadTexto(catalogo.length)}`
        : cantidadTexto(catalogo.length);
    }

    escribirUrl();
  }

  const reiniciar = () => {
    buscar.value = "";
    categoria = "";
    marcarCategoria();
    pintar();
    buscar.focus();
  };

  async function cargar() {
    grid.hidden = false;
    vacio.hidden = true;
    grid.setAttribute("aria-busy", "true");
    contador.textContent = "Cargando productos…";
    grid.replaceChildren(el("p", { class: "grid__empty", text: "Cargando productos…" }));

    try {
      const datos = await pedir("/productos", { conToken: false });
      catalogo = (Array.isArray(datos) ? datos : []).map((producto) => ({
        producto,
        texto: normalizar(`${producto.nombre} ${producto.descripcion || ""} ${producto.categoria || ""}`),
      }));
      pintarCategorias();
      pintar();
    } catch (error) {
      grid.setAttribute("aria-busy", "false");
      contador.textContent = "";
      grid.replaceChildren(
        el(
          "div",
          { class: "grid__empty" },
          el("p", { text: error.message }),
          el("button", { class: "btn btn--ghost", type: "button", text: "Reintentar", onclick: cargar })
        )
      );
    }
  }

  formulario.addEventListener("submit", (e) => e.preventDefault());

  buscar.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(pintar, 120);
  });

  orden.addEventListener("change", pintar);
  limpiar.addEventListener("click", reiniciar);
  vacioLimpiar.addEventListener("click", reiniciar);

  leerUrl();
  cargar();
})();
