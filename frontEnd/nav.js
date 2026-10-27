(() => {
  "use strict";

  const { enlaceWhatsApp } = window.KorAura;

  const header = document.getElementById("header");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("menu");
  const mobileQuery = window.matchMedia("(max-width: 860px)");

  const setMenu = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (!e.target.closest("#menu") && !e.target.closest("#navToggle")) setMenu(false);
  });

  mobileQuery.addEventListener("change", (e) => {
    if (!e.matches) setMenu(false);
  });

  const enlacesInternos = [...menu.querySelectorAll('a[href^="#"]')];
  const secciones = enlacesInternos
    .map((a) => ({ a, seccion: document.querySelector(a.getAttribute("href")) }))
    .filter((par) => par.seccion);

  const actualizar = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);

    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    const linea = window.innerHeight * 0.4;
    let activa = null;

    secciones.forEach((par) => {
      if (par.seccion.getBoundingClientRect().top <= linea) activa = par;
    });
    if (alFinal && secciones.length) activa = secciones[secciones.length - 1];

    secciones.forEach((par) => par.a.classList.toggle("is-active", par === activa));
  };

  let pendiente = false;
  const programar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      actualizar();
    });
  };

  actualizar();
  window.addEventListener("scroll", programar, { passive: true });
  window.addEventListener("resize", programar);

  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = enlaceWhatsApp(a.dataset.producto);
  });

  const ubicacion = window.KORAURA_CONFIG?.ubicacion;
  const mapa = document.getElementById("mapa");
  if (ubicacion && mapa) {
    const consulta = encodeURIComponent(ubicacion.consulta);
    const marco = document.createElement("iframe");
    marco.src = `https://www.google.com/maps?q=${consulta}&z=16&output=embed`;
    marco.title = `Mapa de ${ubicacion.nombre}`;
    marco.loading = "lazy";
    marco.referrerPolicy = "no-referrer-when-downgrade";
    mapa.append(marco);

    document.querySelectorAll('[data-ubicacion="direccion"]').forEach((n) => {
      n.textContent = ubicacion.nombre;
    });
    document.querySelectorAll('[data-ubicacion="enlace"]').forEach((a) => {
      a.href = `https://www.google.com/maps/search/?api=1&query=${consulta}`;
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
