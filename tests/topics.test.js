const request = require('supertest');
const {expect} = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Topics API', () => {
    let token;
    let createdTopicId;

    const unique = Math.random().toString(36).slice(2, 8);
    const testUser = {
        firstname: 'Topic',
        lastname: 'Tester',
        username: `tp_${unique}`,
        password: 'Password123',
        course: 'TIA'
    };

    before(async () => {
        const regRes = await request(baseUrl)
            .post('/api/registration')
            .set('X-Test-Run', '1')
            .send(testUser);

        const loginRes = await request(baseUrl)
            .post('/api/login')
            .set('X-Test-Run', '1')
            .send({
                username: testUser.username,
                password: testUser.password
            });

        token = loginRes.body?.data?.accessToken;

        if (!token) {
            console.log('DEBUG topics before-hook registration:', regRes.status, JSON.stringify(regRes.body));
            console.log('DEBUG topics before-hook login:', loginRes.status, JSON.stringify(loginRes.body));
        }

        expect(token, 'Expected accessToken from /api/login').to.be.a('string');
    });

    const testTopic = {
        title: `Test Topic Title ${unique}`,
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
        expect(res.body.data).to.have.property('id');
        expect(res.body.data).to.have.property('createdAt');

        createdTopicId = res.body.data.id;
    });

    it('should add a comment to a topic and expose it in GET /api/topics', async () => {
        expect(createdTopicId, 'Expected created topic id from createTopic test').to.not.be.undefined;

        const commentRes = await request(baseUrl)
            .post(`/api/topics/${createdTopicId}/comments`)
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({content: 'Mein erster Kommentar'});

        expect(commentRes.status).to.equal(201);
        expect(commentRes.body).to.have.property('success', true);
        expect(commentRes.body?.data?.comments).to.be.an('array');
        expect(commentRes.body.data.comments.length).to.be.greaterThan(0);

        const latest = commentRes.body.data.comments[commentRes.body.data.comments.length - 1];
        expect(latest).to.have.property('content', 'Mein erster Kommentar');

        const listRes = await request(baseUrl).get('/api/topics');
        expect(listRes.status).to.equal(200);

        const found = listRes.body.data.find(t => String(t.id) === String(createdTopicId));
        expect(found, 'Expected created topic in GET /api/topics list').to.not.be.undefined;
        expect(found.comments).to.be.an('array');
        expect(found.comments.some(c => c.content === 'Mein erster Kommentar')).to.be.true;
    });

    it('should return error if title is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({content: 'Missing title but long enough', kurs: 'TIA'});

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validierungsfehler');
    });

    it('should return error if content is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({title: 'Missing content', kurs: 'TIA'});

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validierungsfehler');
    });

    it('should return error if kurs is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({title: 'Missing kurs', content: 'Missing kurs but long enough'});

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

        const found = res.body.data.find(t => String(t.id) === String(createdTopicId));
        expect(found).to.not.be.undefined;
        expect(found.kurs).to.equal(testTopic.kurs);
        expect(found.title).to.equal(testTopic.title);
        expect(found.content).to.equal(testTopic.content);
    });

    it('should filter topics by kurs', async () => {
        const tiaTitle = `Filter TIA Topic Title ${unique}`;
        const tisTitle = `Filter TIS Topic Title ${unique}`;

        const createTIA = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({title: tiaTitle, content: 'This is a test topic content.', kurs: 'TIA'});
        if (createTIA.status !== 201) {
            console.log('DEBUG createTIA:', createTIA.status, JSON.stringify(createTIA.body));
        }
        expect(createTIA.status).to.equal(201);

        const createTIS = await request(baseUrl)
            .post('/api/topics')
            .set('X-Test-Run', '1')
            .set('Authorization', `Bearer ${token}`)
            .send({title: tisTitle, content: 'TIS content long enough', kurs: 'TIS'});
        if (createTIS.status !== 201) {
            console.log('DEBUG createTIS:', createTIS.status, JSON.stringify(createTIS.body));
        }
        expect(createTIS.status).to.equal(201);

        const resTIA = await request(baseUrl).get('/api/topics?kurs=TIA&limit=500');
        expect(resTIA.status).to.equal(200);
        expect(resTIA.body).to.have.property('success', true);
        expect(resTIA.body.data).to.be.an('array');
        expect(resTIA.body.data.some(t => t.title === tiaTitle && t.kurs === 'TIA')).to.be.true;

        const resTIS = await request(baseUrl).get('/api/topics?kurs=TIS&limit=500');
        expect(resTIS.status).to.equal(200);
        expect(resTIS.body).to.have.property('success', true);
        expect(resTIS.body.data).to.be.an('array');
        expect(resTIS.body.data.some(t => t.title === tisTitle && t.kurs === 'TIS')).to.be.true;
    });
});
