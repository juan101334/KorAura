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

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (document.body.dataset.pagina === "inicio" && "IntersectionObserver" in window) {
    const links = [...menu.querySelectorAll('a[href^="#"]')];
    const secciones = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    secciones.forEach((s) => observer.observe(s));
  }

  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = enlaceWhatsApp(a.dataset.producto);
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
