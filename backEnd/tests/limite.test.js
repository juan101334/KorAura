import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { conectar, desconectar } from './configuracion.js';

before(conectar);
after(desconectar);

describe('Límite de intentos de login', () => {
  it('bloquea el inicio de sesión después de demasiados intentos', async () => {
    let ultima;
    for (let intento = 0; intento < 21; intento += 1) {
      ultima = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nadie@koraura.com', password: 'incorrecta1' });
    }

    assert.equal(ultima.status, 429);
    assert.ok(ultima.headers['retry-after']);
  });
});
