const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Topics API', () => {
    let token;

    // Username must be 3-20 characters.
    const unique = Math.random().toString(36).slice(2, 8);
    const testUser = {
        firstname: 'Topic',
        lastname: 'Tester',
        username: `tp_${unique}`,
        password: 'Password123',
        course: 'TIA'
    };

    before(async () => {
        // Register user
        const regRes = await request(baseUrl)
            .post('/api/registration')
            .set('X-Test-Run', '1')
            .send(testUser);

        // Login to get token
        const loginRes = await request(baseUrl)
            .post('/api/login')
            .set('X-Test-Run', '1')
            .send({
                username: testUser.username,
                password: testUser.password
            });

        token = loginRes.body?.data?.accessToken;

        if (!token) {
            // eslint-disable-next-line no-console
            console.log('DEBUG topics before-hook registration:', regRes.status, JSON.stringify(regRes.body));
            // eslint-disable-next-line no-console
            console.log('DEBUG topics before-hook login:', loginRes.status, JSON.stringify(loginRes.body));
        }

        expect(token, 'Expected accessToken from /api/login').to.be.a('string');
    });

    const testTopic = {
        title: 'Test Topic Title',
        content: 'This is a test topic content.',
        kurs: 'TIA'
    };

    it('should create a new topic', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send(testTopic);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('title', testTopic.title);
        expect(res.body.data).to.have.property('content', testTopic.content);
        expect(res.body.data).to.have.property('_id');
        expect(res.body.data).to.have.property('createdAt');
    });

    it('should return error if title is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Missing title but long enough', kurs: 'TIA' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validierungsfehler');
    });

    it('should return error if content is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Missing content', kurs: 'TIA' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validierungsfehler');
    });

    it('should return error if kurs is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Missing kurs', content: 'Missing kurs but long enough' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validierungsfehler');
    });

    it('should get all topics', async () => {
        const res = await request(baseUrl)
            .get('/api/topics');

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.be.an('array');

        const found = res.body.data.find(t => t.title === testTopic.title && t.content === testTopic.content && t.kurs === testTopic.kurs);
        expect(found).to.not.be.undefined;
    });

    it('should filter topics by kurs', async () => {
        // Create another topic with a different kurs
        await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'TIS Topic', content: 'TIS content long enough', kurs: 'TIS' });

        const resTIA = await request(baseUrl).get('/api/topics?kurs=TIA');
        expect(resTIA.status).to.equal(200);
        expect(resTIA.body).to.have.property('success', true);
        expect(resTIA.body.data.every(t => t.kurs === 'TIA')).to.be.true;
        expect(resTIA.body.data.some(t => t.title === testTopic.title)).to.be.true;

        const resTIS = await request(baseUrl).get('/api/topics?kurs=TIS');
        expect(resTIS.status).to.equal(200);
        expect(resTIS.body).to.have.property('success', true);
        expect(resTIS.body.data.every(t => t.kurs === 'TIS')).to.be.true;
        expect(resTIS.body.data.some(t => t.title === 'TIS Topic')).to.be.true;
    });
});
