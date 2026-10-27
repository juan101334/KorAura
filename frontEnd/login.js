(() => {
  "use strict";

  const { sesion, pedir } = window.KorAura;

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");
  const pwToggle = document.getElementById("pwToggle");
  const errorBox = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  const avisoPrimerAdmin = document.getElementById("primerAdmin");

  const mostrarError = (texto) => {
    errorBox.textContent = texto;
    errorBox.hidden = false;
  };

  const sesionExistente = async () => {
    if (!sesion.token()) return;
    try {
      await pedir("/auth/perfil");
      location.replace("admin.html");
    } catch (error) {
      if (error.status) sesion.cerrar();
    }
  };

  const revisarPrimerAdmin = async () => {
    try {
      const { necesitaPrimerAdmin } = await pedir("/auth/estado", { conToken: false });
      avisoPrimerAdmin.hidden = !necesitaPrimerAdmin;
    } catch {
      avisoPrimerAdmin.hidden = true;
    }
  };

  sesionExistente();
  revisarPrimerAdmin();

  pwToggle.addEventListener("click", () => {
    const visible = passInput.type === "text";
    passInput.type = visible ? "password" : "text";
    pwToggle.textContent = visible ? "Mostrar" : "Ocultar";
    pwToggle.setAttribute("aria-pressed", String(!visible));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
      mostrarError("Escribe tu correo y tu contraseña.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Entrando…";

    try {
      const data = await pedir("/auth/login", { metodo: "POST", datos: { email, password }, conToken: false });
      sesion.guardar(data.token, data.usuario?.nombre);
      location.replace("admin.html");
    } catch (error) {
      mostrarError(error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Ingresar";
    }
  });
})();
