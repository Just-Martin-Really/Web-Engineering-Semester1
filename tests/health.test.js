const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const baseUrl = 'http://localhost:3001';

describe('API Health Check', () => {
  it('should return 200 OK for /health', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('status', 'OK');
    expect(res.body).to.have.property('timestamp');
  });
});

describe('Kubernetes probes', () => {
  it('GET /healthz should return 200 with status ok (no dependency checks)', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'ok');
    expect(res.body).to.have.property('uptime');
    expect(res.body).to.have.property('timestamp');
  });

  it('GET /readyz should return 200 with status ready when the database is reachable', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'ready');
    expect(res.body).to.have.property('timestamp');
  });

  it('GET /healthz should not set a session cookie', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers).to.not.have.property('set-cookie');
  });
});
