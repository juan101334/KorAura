import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import Producto from '../src/models/Producto.js';
import { conectar, limpiar, desconectar, crearAdmin } from './configuracion.js';

before(conectar);
after(desconectar);
beforeEach(limpiar);

const bolso = { nombre: 'Bolso Eko', precio: 120000, categoria: 'Bolsos', stock: 15 };

describe('Productos', () => {
  it('la tienda solo muestra los productos disponibles', async () => {
    await Producto.create(bolso);
    await Producto.create({ ...bolso, nombre: 'Bolso oculto', disponible: false });

    const res = await request(app).get('/api/productos');

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].nombre, 'Bolso Eko');
  });

  it('no deja crear productos sin iniciar sesión', async () => {
    const res = await request(app).post('/api/productos').send(bolso);

    assert.equal(res.status, 401);
  });

  it('el administrador puede crear un producto', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send(bolso);

    assert.equal(res.status, 201);
    assert.equal(res.body.nombre, 'Bolso Eko');
  });

  it('no deja crear un producto sin nombre', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...bolso, nombre: '' });

    assert.equal(res.status, 400);
  });

  it('no deja poner un precio negativo', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...bolso, precio: -5000 });

    assert.equal(res.status, 400);
  });

  it('el administrador puede editar el precio', async () => {
    const { token } = await crearAdmin();
    const producto = await Producto.create(bolso);

    const res = await request(app)
      .put(`/api/productos/${producto._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ precio: 99000 });

    assert.equal(res.status, 200);
    assert.equal(res.body.precio, 99000);
  });

  it('el administrador puede eliminar un producto', async () => {
    const { token } = await crearAdmin();
    const producto = await Producto.create(bolso);

    const res = await request(app)
      .delete(`/api/productos/${producto._id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(await Producto.countDocuments(), 0);
  });
});