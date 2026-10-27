import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { conectar, limpiar, desconectar, crearAdmin } from './configuracion.js';

before(conectar);
after(desconectar);
beforeEach(limpiar);

const fotoPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('Fotos de productos', () => {
  it('el administrador puede subir una foto', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos/imagen')
      .set('Authorization', `Bearer ${token}`)
      .attach('imagen', fotoPng, { filename: 'bolso.png', contentType: 'image/png' });

    assert.equal(res.status, 201);
    assert.ok(res.body.url.startsWith('/uploads/'));
  });

  it('no deja subir archivos que no son imágenes', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos/imagen')
      .set('Authorization', `Bearer ${token}`)
      .attach('imagen', Buffer.from('hola'), { filename: 'notas.txt', contentType: 'text/plain' });

    assert.equal(res.status, 400);
  });

  it('no deja subir un archivo que dice ser imagen pero no lo es', async () => {
    const { token } = await crearAdmin();

    const res = await request(app)
      .post('/api/productos/imagen')
      .set('Authorization', `Bearer ${token}`)
      .attach('imagen', Buffer.from('esto no es una imagen'), { filename: 'falsa.png', contentType: 'image/png' });

    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, 'El archivo no es una imagen válida');
  });

  it('no deja subir fotos sin iniciar sesión', async () => {
    const res = await request(app)
      .post('/api/productos/imagen')
      .attach('imagen', fotoPng, { filename: 'bolso.png', contentType: 'image/png' });

    assert.equal(res.status, 401);
  });
});
