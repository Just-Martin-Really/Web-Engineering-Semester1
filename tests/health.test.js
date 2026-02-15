const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('API Health Check', () => {
  it('should return 200 OK for /health', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.status).to.equal(200);
    expect(res.text).to.equal('OK');
  });
});
