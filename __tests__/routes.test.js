require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('routes', () => {
  let token;

  const newGuitar = {
    id: 4,
    strings: 4,
    color: 'red',
    brand_id: 2,
    owner_id: 2,
  };

  beforeAll(async done => {
    execSync('npm run setup-db');

    client.connect();

    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'jon@user.com',
        password: '1234'
      });
    
    token = signInData.body.token;

    return done();
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns a new guitar when creating new guitar', async(done) => {

    const data = await fakeRequest(app)
      .post('/api/guitars')
      .send(newGuitar)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(newGuitar);

    done();
  });

  test('returns all guitars for the user when hitting GET /guitars', async(done) => {
    const expected = [
      {
        brand_name: 'Taylor',
        color: 'red',
        id: 4,
        owner_id: 2,
        strings: 4,
      },
    ];

    const data = await fakeRequest(app)
      .get('/api/guitars')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('returns a single guitar for the user when hitting GET /guitars/:id', async(done) => {
    const expected = {
      brand_name: 'Taylor',
      color: 'red',
      id: 4,
      owner_id: 2,
      strings: 4,
    };

    const data = await fakeRequest(app)
      .get('/api/guitars/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('updates a single guitar for the user when hitting PUT /guitars/:id', async(done) => {
    const newGuitar = {
      brand_id: 1,
      color: 'cool red',
      id: 4,
      owner_id: 2,
      strings: 6,
    };

    const expectedAllGuitars = [{
      brand_name: 'Gibson',      
      color: 'cool red',
      id: 4,
      owner_id: 2,
      strings: 6,
    }];

    const data = await fakeRequest(app)
      .put('/api/guitars/4')
      .send(newGuitar)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    const allGuitars = await fakeRequest(app)
      .get('/api/guitars')
      .send(newGuitar)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(newGuitar);
    expect(allGuitars.body).toEqual(expectedAllGuitars);

    done();
  });

  test('delete a single guitar for the user when hitting DELETE /guitars/:id', async(done) => {
    await fakeRequest(app)
      .delete('/api/guitars/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    const data = await fakeRequest(app)
      .get('/api/guitars/')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual([]);

    done();
  });
});
