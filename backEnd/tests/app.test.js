import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Servidor', () => {
  it('responde que está activo en /api/health', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.estado, 'ok');
  });

  it('envía cabeceras de seguridad y no revela que usa Express', async () => {
    const res = await request(app).get('/api');

    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  it('responde 404 en JSON para rutas de la API que no existen', async () => {
    const res = await request(app).get('/api/no-existe');

    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, 'Esa ruta no existe');
  });

  it('responde 404 cuando la foto no existe', async () => {
    const res = await request(app).get('/uploads/no-existe.png');

    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, 'Esa foto no existe');
  });

  it('no permite orígenes desconocidos por CORS', async () => {
    const res = await request(app).get('/api').set('Origin', 'https://sitio-desconocido.com');

    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  it('permite el origen local de desarrollo por CORS', async () => {
    const res = await request(app).get('/api').set('Origin', 'http://localhost:5500');

    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5500');
  });

  it('sirve la página del catálogo', async () => {
    const res = await request(app).get('/catalogo');

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /html/);
  });
});
