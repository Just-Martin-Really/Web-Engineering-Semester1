const request = require('supertest');
const { expect } = require('chai');
const baseUrl = 'http://localhost:3001';

describe('Authentication API', () => {
    // Username must be 3-20 characters.
    // Use a short unique suffix to avoid exceeding max length.
    const unique = Math.random().toString(36).slice(2, 8);
    const testUser = {
        firstname: 'Test',
        lastname: 'User',
        username: `tu_${unique}`,
        password: 'Password123',
        course: 'TIA'
    };

    it('should register a new user', async () => {
        const res = await request(baseUrl)
            .post('/api/registration')
            .set('X-Test-Run', '1')
            .send(testUser);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('success', true);
        expect(res.body.message).to.equal('Registrierung erfolgreich');

        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('user');
        expect(res.body.data.user).to.have.property('username', testUser.username.toLowerCase());
        expect(res.body.data).to.have.property('accessToken');
        expect(res.body.data).to.have.property('refreshToken');
    });

    it('should login with valid credentials', async () => {
        const res = await request(baseUrl)
            .post('/api/login')
            .set('X-Test-Run', '1')
            .send({
                username: testUser.username,
                password: testUser.password
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.message).to.equal('Login erfolgreich');

        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('accessToken');
        expect(res.body.data).to.have.property('refreshToken');
        expect(res.body.data).to.have.property('user');
        expect(res.body.data.user).to.have.property('username', testUser.username.toLowerCase());
    });

    it('should fail login with wrong credentials', async () => {
        const res = await request(baseUrl)
            .post('/api/login')
            .set('X-Test-Run', '1')
            .send({
                username: testUser.username,
                password: 'WrongPassword123'
            });

        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message');
    });
});
