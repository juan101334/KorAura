import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { conectar, limpiar, desconectar, crearAdmin } from './configuracion.js';

before(conectar);
after(desconectar);
beforeEach(limpiar);

describe('Login', () => {
  it('entra con correo y contraseña correctos', async () => {
    await crearAdmin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@koraura.com', password: 'Clave12345' });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it('no entra con una contraseña incorrecta', async () => {
    await crearAdmin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@koraura.com', password: 'otraClave' });

    assert.equal(res.status, 401);
  });

  it('no deja ver el perfil sin iniciar sesión', async () => {
    const res = await request(app).get('/api/auth/perfil');

    assert.equal(res.status, 401);
  });
});

describe('Registro de administradores', () => {
  it('el primer administrador se puede registrar sin iniciar sesión', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Laura', email: 'laura@koraura.com', password: 'Clave12345' });

    assert.equal(res.status, 201);
    assert.equal(res.body.usuario.rol, 'admin');
  });

  it('si ya hay un administrador, nadie más se registra sin iniciar sesión', async () => {
    await crearAdmin();

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Intruso', email: 'intruso@correo.com', password: 'Clave12345' });

    assert.equal(res.status, 401);
  });

  it('un administrador desactivado ya no puede entrar', async () => {
    const { token } = await crearAdmin();
    const { usuario: otro } = await crearAdmin('otro@koraura.com');

    await request(app)
      .patch(`/api/usuarios/${otro._id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otro@koraura.com', password: 'Clave12345' });

    assert.equal(res.status, 401);
  });
});