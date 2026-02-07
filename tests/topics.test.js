const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Topics API', () => {
    const testTopic = {
        title: 'Test Topic Title',
        content: 'This is a test topic content.'
    };

    it('should create a new topic', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
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
            .send({ content: 'Missing title' });
        
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'Titel und Inhalt sind Pflichtfelder');
    });

    it('should return error if content is missing', async () => {
        const res = await request(baseUrl)
            .post('/api/topics')
            .send({ title: 'Missing content' });
        
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'Titel und Inhalt sind Pflichtfelder');
    });

    it('should get all topics', async () => {
        const res = await request(baseUrl)
            .get('/api/topics');
        
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
        
        // Check if the topic we created in the first test is present
        const found = res.body.find(t => t.title === testTopic.title && t.content === testTopic.content);
        expect(found).to.not.be.undefined;
    });
});
