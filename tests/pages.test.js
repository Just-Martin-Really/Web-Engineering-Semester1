const request = require('supertest');
const { expect } = require('chai');

const app = require('../server');

describe('Page routes (Pug)', () => {
    it('GET / should return 200 and contain home marker', async () => {
        const res = await request(app).get('/');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Fredforum');
    });

    it('GET /register should return 200 and contain registration marker', async () => {
        const res = await request(app).get('/register');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Registrieren');
    });

    it('GET /forum should return 200 and contain forum marker', async () => {
        const res = await request(app).get('/forum');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Forum Beiträge');
    });

    it('GET /does-not-exist should return 404 HTML page', async () => {
        const res = await request(app).get('/does-not-exist');
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/text\/html/);
        expect(res.text).to.include('404');
    });
});

