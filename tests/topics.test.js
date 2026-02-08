const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Topics API', () => {
    let token;
    const testUser = {
        firstname: 'Topic',
        lastname: 'Tester',
        username: `topicuser_${Date.now()}`,
        password: 'password123',
        course: 'Testing'
    };

    before(async () => {
        // Register user
        await request(baseUrl).post('/api/registration').send(testUser);
        // Login to get token
        const res = await request(baseUrl).post('/api/login').send({
            username: testUser.username,
            password: testUser.password
        });
        token = res.body.token;
    });

    const testTopic = {
        title: 'Test Topic Title',
        content: 'This is a test topic content.',
        kurs: 'TIA'
    };

    it('should create a new topic', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send(testTopic);
        
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('title', testTopic.title);
        expect(res.body).to.have.property('content', testTopic.content);
        expect(res.body).to.have.property('_id');
        expect(res.body).to.have.property('createdAt');
    });

    it('should return error if title is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Missing title', kurs: 'TIA' });
        
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Titel, Inhalt und Kurs sind Pflichtfelder');
    });

    it('should return error if content is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Missing content', kurs: 'TIA' });
        
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Titel, Inhalt und Kurs sind Pflichtfelder');
    });

    it('should return error if kurs is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Missing kurs', content: 'Missing kurs' });
        
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Titel, Inhalt und Kurs sind Pflichtfelder');
    });

    it('should get all topics', async () => {
        const res = await request(baseUrl)
            .get('/api/topics');
        
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
        
        // Check if the topic we created in the first test is present
        const found = res.body.find(t => t.title === testTopic.title && t.content === testTopic.content && t.kurs === testTopic.kurs);
        expect(found).to.not.be.undefined;
    });

    it('should filter topics by kurs', async () => {
        // Create another topic with a different kurs
        await request(baseUrl)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'TIS Topic', content: 'TIS content', kurs: 'TIS' });

        // Filter by TIA
        const resTIA = await request(baseUrl).get('/api/topics?kurs=TIA');
        expect(resTIA.status).to.equal(200);
        expect(resTIA.body.every(t => t.kurs === 'TIA')).to.be.true;
        expect(resTIA.body.some(t => t.title === testTopic.title)).to.be.true;

        // Filter by TIS
        const resTIS = await request(baseUrl).get('/api/topics?kurs=TIS');
        expect(resTIS.status).to.equal(200);
        expect(resTIS.body.every(t => t.kurs === 'TIS')).to.be.true;
        expect(resTIS.body.some(t => t.title === 'TIS Topic')).to.be.true;
    });
});
