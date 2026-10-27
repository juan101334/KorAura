(() => {
  "use strict";

  const { sesion, pedir, subirFoto, urlImagen, formatearPrecio, el } = window.KorAura;
  const $ = (id) => document.getElementById(id);

  if (!sesion.token()) {
    location.replace("login.html");
    return;
  }

  const cerrarSesion = () => {
    sesion.cerrar();
    location.replace("login.html");
  };
  $("logoutBtn").addEventListener("click", cerrarSesion);

  const api = async (ruta, opciones) => {
    try {
      return await pedir(ruta, opciones);
    } catch (error) {
      if (error.status === 401) cerrarSesion();
      throw error;
    }
  };

  const mostrarError = (caja, texto) => {
    caja.textContent = texto;
    caja.hidden = !texto;
  };

  let temporizadorToast;
  const avisar = (texto) => {
    const toast = $("toast");
    toast.textContent = texto;
    toast.hidden = false;
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => (toast.hidden = true), 2800);
  };

  let perfil = null;

  const pestañas = [
    { boton: $("tabProductos"), panel: $("panelProductos"), hash: "#productos" },
    { boton: $("tabAdmins"), panel: $("panelAdmins"), hash: "#administradores", alAbrir: () => cargarAdmins() },
  ];

  const abrirPestaña = (elegida) => {
    pestañas.forEach((p) => {
      const activa = p === elegida;
      p.boton.setAttribute("aria-selected", String(activa));
      p.panel.hidden = !activa;
    });
    history.replaceState(null, "", elegida.hash);
    elegida.alAbrir?.();
  };

  pestañas.forEach((p) => p.boton.addEventListener("click", () => abrirPestaña(p)));

  let productos = [];
  const tbody = $("productosBody");
  const buscar = $("buscar");
  const filtroCategoria = $("filtroCategoria");
  const errorProductos = $("productosError");

  const miniatura = (producto, clase) => {
    const caja = el("div", { class: clase });
    const inicial = el("span", { text: (producto.nombre || "?").trim().charAt(0).toUpperCase() });
    caja.append(inicial);
    if (producto.imagen_url) {
      const img = el("img", { src: urlImagen(producto.imagen_url), alt: "", loading: "lazy" });
      img.addEventListener("error", () => img.remove());
      caja.append(img);
    }
    return caja;
  };

  const actualizarResumen = () => {
    $("statTotal").textContent = productos.length;
    $("statVisibles").textContent = productos.filter((p) => p.disponible).length;
    $("statSinStock").textContent = productos.filter((p) => !p.stock).length;

    const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es")
    );
    const elegida = filtroCategoria.value;
    filtroCategoria.replaceChildren(
      el("option", { value: "", text: "Todas las categorías" }),
      ...categorias.map((c) => el("option", { value: c, text: c }))
    );
    filtroCategoria.value = categorias.includes(elegida) ? elegida : "";

    const sugeridas = new Set(["Bolsos", "Billeteras", "Correas", "Accesorios", ...categorias]);
    $("categoriasSugeridas").replaceChildren(...[...sugeridas].map((c) => el("option", { value: c })));
  };

  const filaProducto = (producto) => {
    const interruptor = el("input", {
      type: "checkbox",
      checked: producto.disponible,
      "aria-label": `Mostrar ${producto.nombre} en la tienda`,
      onchange: (e) => cambiarDisponible(producto, e.target),
    });

    return el(
      "tr",
      {},
      el(
        "td",
        { "data-label": "Producto" },
        el(
          "div",
          { class: "prod" },
          miniatura(producto, "prod__img"),
          el(
            "div",
            { class: "prod__info" },
            el("span", { class: "prod__name", text: producto.nombre }),
            producto.descripcion ? el("span", { class: "prod__desc", text: producto.descripcion }) : null
          )
        )
      ),
      el("td", { "data-label": "Categoría" }, el("span", { class: "tag", text: producto.categoria })),
      el("td", { class: "num", "data-label": "Precio", text: formatearPrecio(producto.precio) }),
      el(
        "td",
        { class: "num", "data-label": "Stock" },
        el("span", { class: producto.stock ? "" : "stock-cero", text: producto.stock ?? 0 })
      ),
      el(
        "td",
        { "data-label": "En tienda" },
        el("label", { class: "switch switch--sm" }, interruptor, el("span", { class: "switch__track", "aria-hidden": "true" }))
      ),
      el(
        "td",
        { class: "acciones" },
        el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Editar", onclick: () => abrirFormulario(producto) }),
        el("button", { class: "btn btn--danger-ghost btn--sm", type: "button", text: "Eliminar", onclick: () => confirmarBorrado(producto) })
      )
    );
  };

  const pintarProductos = () => {
    const texto = buscar.value.trim().toLowerCase();
    const categoria = filtroCategoria.value;
    const visibles = productos.filter(
      (p) => (!texto || p.nombre.toLowerCase().includes(texto)) && (!categoria || p.categoria === categoria)
    );

    tbody.replaceChildren(...visibles.map(filaProducto));

    const vacio = visibles.length === 0;
    $("productosVacio").hidden = !vacio;
    if (vacio) {
      const hayFiltro = productos.length > 0;
      $("vacioTitulo").textContent = hayFiltro ? "Ningún producto coincide" : "Aún no hay productos";
      $("vacioTexto").textContent = hayFiltro
        ? "Prueba con otra búsqueda o categoría."
        : "Crea el primero con el botón “Nuevo producto”.";
    }
  };

  const cargarProductos = async () => {
    try {
      productos = await api("/productos/admin");
      mostrarError(errorProductos, "");
    } catch (error) {
      mostrarError(errorProductos, error.message);
    }
    actualizarResumen();
    pintarProductos();
  };

  buscar.addEventListener("input", pintarProductos);
  filtroCategoria.addEventListener("change", pintarProductos);

  const cambiarDisponible = async (producto, casilla) => {
    casilla.disabled = true;
    try {
      const actualizado = await api(`/productos/${producto._id}`, {
        metodo: "PUT",
        datos: { disponible: casilla.checked },
      });
      Object.assign(producto, actualizado);
      actualizarResumen();
      avisar(actualizado.disponible ? "Ahora se ve en la tienda" : "Se ocultó de la tienda");
    } catch (error) {
      casilla.checked = !casilla.checked;
      avisar(error.message);
    } finally {
      casilla.disabled = false;
    }
  };

  const dialogo = $("productoDialog");
  const form = $("productoForm");
  const errorForm = $("productoError");
  const guardarBtn = $("guardarBtn");
  const imgPreview = $("imgPreview");
  const inputFoto = $("pFoto");
  const fotoZona = $("fotoZona");
  const quitarFoto = $("quitarFoto");
  const fotoAyuda = $("fotoAyuda");
  const AYUDA_FOTO = "JPG, PNG o WEBP de hasta 5 MB. También puedes arrastrarla aquí.";
  const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_FOTO = 5 * 1024 * 1024;

  let editando = null;
  let fotoNueva = null;
  let urlLocal = "";
  let imagenActual = "";

  const soltarUrlLocal = () => {
    if (urlLocal) URL.revokeObjectURL(urlLocal);
    urlLocal = "";
  };

  const pintarVistaPrevia = () => {
    const nombre = form.nombre.value || "?";
    const caja = el("div", { class: "foto__img" }, el("span", { text: nombre.trim().charAt(0).toUpperCase() || "?" }));
    const fuente = fotoNueva ? urlLocal : urlImagen(imagenActual.trim());
    if (fuente) {
      const img = el("img", { src: fuente, alt: "" });
      img.addEventListener("error", () => img.remove());
      caja.append(img);
    }
    imgPreview.replaceChildren(caja);
    quitarFoto.hidden = !fuente;
    fotoAyuda.textContent = fotoNueva ? `Lista para subir: ${fotoNueva.name}` : AYUDA_FOTO;
  };

  const elegirFoto = (archivo) => {
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type)) {
      mostrarError(errorForm, "La foto debe ser JPG, PNG, WEBP o GIF.");
      return;
    }
    if (archivo.size > MAX_FOTO) {
      mostrarError(errorForm, "La foto pesa más de 5 MB. Elige una más liviana.");
      return;
    }
    mostrarError(errorForm, "");
    soltarUrlLocal();
    fotoNueva = archivo;
    urlLocal = URL.createObjectURL(archivo);
    form.imagen_url.value = "";
    $("fotoEnlace").open = false;
    pintarVistaPrevia();
  };

  inputFoto.addEventListener("change", () => {
    elegirFoto(inputFoto.files[0]);
    inputFoto.value = "";
  });

  quitarFoto.addEventListener("click", () => {
    soltarUrlLocal();
    fotoNueva = null;
    imagenActual = "";
    form.imagen_url.value = "";
    pintarVistaPrevia();
  });

  ["dragenter", "dragover"].forEach((tipo) =>
    fotoZona.addEventListener(tipo, (e) => {
      e.preventDefault();
      fotoZona.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((tipo) =>
    fotoZona.addEventListener(tipo, (e) => {
      e.preventDefault();
      fotoZona.classList.remove("is-drag");
    })
  );
  fotoZona.addEventListener("drop", (e) => elegirFoto(e.dataTransfer?.files?.[0]));

  form.imagen_url.addEventListener("input", () => {
    soltarUrlLocal();
    fotoNueva = null;
    imagenActual = form.imagen_url.value;
    pintarVistaPrevia();
  });
  form.nombre.addEventListener("input", () => {
    if (!fotoNueva && !imagenActual) pintarVistaPrevia();
  });

  const abrirFormulario = (producto = null) => {
    editando = producto;
    form.reset();
    soltarUrlLocal();
    fotoNueva = null;
    mostrarError(errorForm, "");
    $("productoTitulo").textContent = producto ? "Editar producto" : "Nuevo producto";
    guardarBtn.textContent = producto ? "Guardar cambios" : "Crear producto";

    form.nombre.value = producto?.nombre ?? "";
    form.categoria.value = producto?.categoria ?? "";
    form.precio.value = producto?.precio ?? "";
    form.stock.value = producto?.stock ?? 0;
    form.descripcion.value = producto?.descripcion ?? "";
    form.disponible.checked = producto ? producto.disponible : true;

    imagenActual = producto?.imagen_url ?? "";
    const esEnlace = /^https?:\/\//i.test(imagenActual);
    form.imagen_url.value = esEnlace ? imagenActual : "";
    $("fotoEnlace").open = esEnlace;

    pintarVistaPrevia();
    dialogo.showModal();
    form.nombre.focus();
  };

  $("nuevoBtn").addEventListener("click", () => abrirFormulario());
  dialogo.querySelectorAll("[data-cerrar]").forEach((b) => b.addEventListener("click", () => dialogo.close()));
  dialogo.addEventListener("close", () => {
    soltarUrlLocal();
    fotoNueva = null;
  });

  const leerFormulario = () => ({
    nombre: form.nombre.value.trim(),
    categoria: form.categoria.value.trim(),
    precio: form.precio.value === "" ? undefined : Number(form.precio.value),
    stock: form.stock.value === "" ? 0 : Number(form.stock.value),
    descripcion: form.descripcion.value.trim(),
    imagen_url: imagenActual.trim(),
    disponible: form.disponible.checked,
  });

  const validar = (datos) => {
    if (!datos.nombre) return "Escribe el nombre del producto.";
    if (!datos.categoria) return "Escribe la categoría.";
    if (datos.precio === undefined || Number.isNaN(datos.precio)) return "Escribe el precio.";
    if (datos.precio < 0) return "El precio no puede ser negativo.";
    if (!Number.isInteger(datos.stock) || datos.stock < 0) return "El stock debe ser un número entero desde 0.";
    if (!fotoNueva && datos.imagen_url && !/^(https?:\/\/|\/uploads\/)/i.test(datos.imagen_url))
      return "El enlace de la imagen debe empezar por http:// o https://";
    return "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = leerFormulario();
    const problema = validar(datos);
    if (problema) return mostrarError(errorForm, problema);

    guardarBtn.disabled = true;
    const textoBoton = guardarBtn.textContent;
    try {
      if (fotoNueva) {
        guardarBtn.textContent = "Subiendo foto…";
        datos.imagen_url = await subirFoto(fotoNueva);
        imagenActual = datos.imagen_url;
        soltarUrlLocal();
        fotoNueva = null;
        pintarVistaPrevia();
      }
      guardarBtn.textContent = "Guardando…";
      if (editando) {
        await api(`/productos/${editando._id}`, { metodo: "PUT", datos });
        avisar("Producto actualizado");
      } else {
        await api("/productos", { metodo: "POST", datos });
        avisar("Producto creado");
      }
      dialogo.close();
      await cargarProductos();
    } catch (error) {
      if (error.status === 401) return cerrarSesion();
      mostrarError(errorForm, error.message);
    } finally {
      guardarBtn.disabled = false;
      guardarBtn.textContent = textoBoton;
    }
  });

  const confirmDialog = $("confirmDialog");
  let porBorrar = null;

  const confirmarBorrado = (producto) => {
    porBorrar = producto;
    $("confirmTexto").textContent = `Se eliminará “${producto.nombre}”. Esta acción no se puede deshacer.`;
    confirmDialog.showModal();
  };

  $("confirmNo").addEventListener("click", () => confirmDialog.close());
  $("confirmSi").addEventListener("click", async () => {
    if (!porBorrar) return;
    const boton = $("confirmSi");
    boton.disabled = true;
    try {
      await api(`/productos/${porBorrar._id}`, { metodo: "DELETE" });
      avisar("Producto eliminado");
      confirmDialog.close();
      await cargarProductos();
    } catch (error) {
      avisar(error.message);
    } finally {
      boton.disabled = false;
      porBorrar = null;
    }
  });

  const listaAdmins = $("adminsLista");
  const errorAdmins = $("adminsError");

  const filaAdmin = (u) => {
    const soyYo = perfil && String(u.id) === String(perfil.id);
    const accion = soyYo
      ? el("span", { class: "tag tag--dark", text: "Tú" })
      : el("button", {
          class: `btn btn--sm ${u.activo ? "btn--danger-ghost" : "btn--ghost"}`,
          type: "button",
          text: u.activo ? "Desactivar" : "Activar",
          onclick: (e) => cambiarEstadoAdmin(u, e.target),
        });

    return el(
      "li",
      { class: `admin-item${u.activo ? "" : " is-off"}` },
      el(
        "div",
        { class: "admin-item__info" },
        el("span", { class: "admin-item__name", text: u.nombre }),
        el("span", { class: "admin-item__email", text: u.email })
      ),
      el("span", { class: `estado ${u.activo ? "estado--on" : "estado--off"}`, text: u.activo ? "Activo" : "Inactivo" }),
      accion
    );
  };

  const cargarAdmins = async () => {
    try {
      const usuarios = await api("/usuarios");
      listaAdmins.replaceChildren(...usuarios.map(filaAdmin));
      mostrarError(errorAdmins, "");
    } catch (error) {
      mostrarError(errorAdmins, error.message);
    }
  };

  const cambiarEstadoAdmin = async (u, boton) => {
    boton.disabled = true;
    try {
      await api(`/usuarios/${u.id}/estado`, { metodo: "PATCH", datos: { activo: !u.activo } });
      avisar(u.activo ? `${u.nombre} ya no puede entrar` : `${u.nombre} puede entrar de nuevo`);
      await cargarAdmins();
    } catch (error) {
      boton.disabled = false;
      mostrarError(errorAdmins, error.message);
    }
  };

  const regForm = $("registroForm");
  const regError = $("registroError");
  const regBtn = $("registroBtn");
  const PASSWORD_VALIDA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarError(regError, "");

    const nombre = regForm.nombre.value.trim();
    const email = regForm.email.value.trim();
    const password = regForm.password.value;

    if (!nombre || !email || !password) return mostrarError(regError, "Completa todos los campos.");
    if (!PASSWORD_VALIDA.test(password)) return mostrarError(regError, "La contraseña debe tener mínimo 8 caracteres, con letras y números.");
    if (password !== regForm.password2.value) return mostrarError(regError, "Las contraseñas no coinciden.");

    regBtn.disabled = true;
    try {
      await api("/auth/registro", { metodo: "POST", datos: { nombre, email, password } });
      regForm.reset();
      avisar(`${nombre} ya puede iniciar sesión`);
      await cargarAdmins();
    } catch (error) {
      mostrarError(regError, error.message);
    } finally {
      regBtn.disabled = false;
    }
  });

  const iniciar = async () => {
    try {
      perfil = await api("/auth/perfil");
    } catch {
      cerrarSesion();
      return;
    }

    $("userName").textContent = perfil.nombre;
    $("userEmail").textContent = perfil.email;
    $("userRole").textContent = perfil.rol;
    document.body.classList.remove("is-loading");

    const inicial = pestañas.find((p) => p.hash === location.hash) || pestañas[0];
    abrirPestaña(inicial);
    cargarProductos();
  };

  iniciar();
})();
