const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

const fakeUser = {
  id: 1,
  email: 'jon@arbuckle.net',
  hash: '42r8c24',
};

// c_READ_ud
app.get('/guitars', async(req, res) => {
  const data = await client.query(`
      SELECT g.id, strings, color, b.name AS brand_name 
          FROM guitars AS g
          JOIN brands AS b
          ON g.brand_id = b.id
      `);
  
  res.json(data.rows);
});

// c_READ_ud
app.get('/brands', async(req, res) => {
  const data = await client.query(`
      SELECT * FROM brands`);
  
  res.json(data.rows);
});

// c_READ_ud
app.get('/guitars/:id', async(req, res) => {
  const guitarId = req.params.id;

  const data = await client.query(`
      SELECT g.id, strings, color, b.name AS brand_name 
          FROM guitars AS g
          JOIN brands AS b
          ON g.brand_id=b.id
          WHERE g.id=$1
  `, [guitarId]);

  res.json(data.rows[0]);
});

// cru_DELETE_
app.delete('/guitars/:id', async(req, res) => {
  const guitarId = req.params.id;

  const data = await client.query('DELETE FROM guitars WHERE guitars.id=$1;', [guitarId]);

  res.json(data.rows[0]);
});

// cr_UPDATE_d
app.put('/guitars/:id', async(req, res) => {
  const guitarId = req.params.id;

  try {
    const updatedGuitar = {
      color: req.body.color,
      strings: req.body.strings,
      brand_id: req.body.brand_id
    };
  
    const data = await client.query(`
      UPDATE guitars
        SET color=$1, strings=$2, brand_id=$3
        WHERE guitars.id = $4
        RETURNING *
  `, [updatedGuitar.color, updatedGuitar.strings, updatedGuitar.brand_id, guitarId]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }});

// _CREATE_rud
app.post('/guitars', async(req, res) => {
  try {
    const realNewGuitar = {
      color: req.body.color,
      strings: req.body.strings,
      brand_id: req.body.brand_id
    };
  
    const data = await client.query(`
    INSERT INTO guitars(color, strings, owner_id, brand_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
  `, [realNewGuitar.color, realNewGuitar.strings, fakeUser.id, realNewGuitar.brand_id]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
