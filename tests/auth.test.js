const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Authentication API', () => {
    const testUser = {
        firstname: 'Test',
        lastname: 'User',
        username: `testuser_${Date.now()}`,
        password: 'password123',
        course: 'Web Engineering'
    };

    it('should register a new user', async () => {
        const res = await request(baseUrl)
            .post('/api/registration')
            .send(testUser);
        
        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('Registrierung erfolgreich');
        expect(res.body.user).to.have.property('username', testUser.username);
    });

    it('should login with valid credentials', async () => {
        const res = await request(baseUrl)
            .post('/api/login')
            .send({
                username: testUser.username,
                password: testUser.password
            });
        
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('Login erfolgreich');
        expect(res.body.user).to.have.property('username', testUser.username);
    });

    it('should fail login with wrong credentials', async () => {
        const res = await request(baseUrl)
            .post('/api/login')
            .send({
                username: testUser.username,
                password: 'wrongpassword'
            });
        
        expect(res.status).to.equal(401);
        expect(res.body.message).to.equal('Falsche Anmeldedaten');
    });
});
