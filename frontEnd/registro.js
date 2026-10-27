(() => {
  "use strict";

  const { sesion, pedir } = window.KorAura;

  const form = document.getElementById("registroForm");
  const yaExiste = document.getElementById("yaExiste");
  const errorBox = document.getElementById("registroError");
  const btn = document.getElementById("registroBtn");
  const PASSWORD_VALIDA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  const mostrarError = (texto) => {
    errorBox.textContent = texto;
    errorBox.hidden = false;
  };

  const revisar = async () => {
    try {
      const { necesitaPrimerAdmin } = await pedir("/auth/estado", { conToken: false });
      form.hidden = !necesitaPrimerAdmin;
      yaExiste.hidden = necesitaPrimerAdmin;
    } catch (error) {
      form.hidden = false;
      mostrarError(error.message);
    }
  };
  revisar();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!nombre || !email || !password) return mostrarError("Completa todos los campos.");
    if (!PASSWORD_VALIDA.test(password)) return mostrarError("La contraseña debe tener mínimo 8 caracteres, con letras y números.");
    if (password !== form.password2.value) return mostrarError("Las contraseñas no coinciden.");

    btn.disabled = true;
    btn.textContent = "Creando…";

    try {
      const data = await pedir("/auth/registro", { metodo: "POST", datos: { nombre, email, password }, conToken: false });
      if (data.token) {
        sesion.guardar(data.token, data.usuario?.nombre);
        location.replace("admin.html");
      } else {
        location.replace("login.html");
      }
    } catch (error) {
      if (error.status === 401) {
        form.hidden = true;
        yaExiste.hidden = false;
      } else {
        mostrarError(error.message);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Crear cuenta";
    }
  });
})();
