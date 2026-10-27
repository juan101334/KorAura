import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { conectar, limpiar, desconectar, crearAdmin } from './configuracion.js';

before(conectar);
after(desconectar);
beforeEach(limpiar);

describe('Usuarios', () => {
  it('no deja ver la lista sin iniciar sesión', async () => {
    const res = await request(app).get('/api/usuarios');

    assert.equal(res.status, 401);
  });

  it('el administrador ve la lista sin contraseñas', async () => {
    const { token } = await crearAdmin();

    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].password, undefined);
  });

  it('no deja desactivar la propia cuenta', async () => {
    const { token, usuario } = await crearAdmin();

    const res = await request(app)
      .patch(`/api/usuarios/${usuario._id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });

    assert.equal(res.status, 400);
  });

  it('pide un valor verdadero o falso para el estado', async () => {
    const { token } = await crearAdmin();
    const { usuario: otro } = await crearAdmin('otro@koraura.com');

    const res = await request(app)
      .patch(`/api/usuarios/${otro._id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: 'no' });

    assert.equal(res.status, 400);
  });

  it('responde 404 si el usuario no existe', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .patch('/api/usuarios/507f1f77bcf86cd799439011/estado')
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });

    assert.equal(res.status, 404);
  });

  it('un administrador desactivado no puede usar su sesión', async () => {
    const { token } = await crearAdmin();
    const { usuario: otro, token: tokenOtro } = await crearAdmin('otro@koraura.com');

    await request(app)
      .patch(`/api/usuarios/${otro._id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });

    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenOtro}`);

    assert.equal(res.status, 401);
  });

  it('rechaza una contraseña sin números al registrar un administrador', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/auth/registro')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Nuevo', email: 'nuevo@koraura.com', password: 'sololetras' });

    assert.equal(res.status, 400);
  });
});
