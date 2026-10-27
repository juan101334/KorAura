import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import Producto from '../src/models/Producto.js';
import { conectar, limpiar, desconectar } from './configuracion.js';

before(conectar);
after(desconectar);
beforeEach(limpiar);

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  delete process.env.OPENAI_API_KEY;
});

describe('Chatbot', () => {
  it('no acepta un mensaje vacío', async () => {
    const res = await request(app).post('/api/chat').send({ mensaje: '' });

    assert.equal(res.status, 400);
  });

  it('sin clave de OpenAI busca el producto por palabras', async () => {
    await Producto.create({ nombre: 'Billetera Slim', precio: 69000, categoria: 'Billeteras', stock: 5 });
    await Producto.create({ nombre: 'Cinto Eko', precio: 59000, categoria: 'Correas', stock: 5 });

    const res = await request(app).post('/api/chat').send({ mensaje: 'busco una billetera' });

    assert.equal(res.status, 200);
    assert.equal(res.body.modo, 'local');
    assert.equal(res.body.productos[0].nombre, 'Billetera Slim');
  });

  it('con clave de OpenAI muestra el producto que recomienda la IA', async () => {
    process.env.OPENAI_API_KEY = 'clave-falsa';
    const tote = await Producto.create({ nombre: 'Tote Bag', precio: 159000, categoria: 'Bolsos', stock: 3 });

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ respuesta: 'Te recomiendo el Tote Bag.', productos: [String(tote._id)] }),
              },
            },
          ],
        }),
        { status: 200 }
      );

    const res = await request(app).post('/api/chat').send({ mensaje: 'algo para llevar el portátil' });

    assert.equal(res.status, 200);
    assert.equal(res.body.modo, 'ia');
    assert.equal(res.body.productos[0].nombre, 'Tote Bag');
  });

  it('si OpenAI falla, responde con la búsqueda por palabras', async () => {
    process.env.OPENAI_API_KEY = 'clave-falsa';
    await Producto.create({ nombre: 'Cinto Eko', precio: 59000, categoria: 'Correas', stock: 5 });

    globalThis.fetch = async () => new Response('error', { status: 500 });

    const res = await request(app).post('/api/chat').send({ mensaje: 'quiero un cinto' });

    assert.equal(res.status, 200);
    assert.equal(res.body.modo, 'local');
    assert.equal(res.body.productos[0].nombre, 'Cinto Eko');
  });
});
