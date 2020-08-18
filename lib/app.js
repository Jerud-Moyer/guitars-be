const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

// middelware usually adds things to .req
app.use(cors()); // this addes things to the header
app.use(express.json()); // this adds the .body property to .req
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

// c_READ_ud
app.get('/api/guitars', async(req, res) => {
  const userId = req.userId;

  const data = await client.query(`
      SELECT g.id, strings, owner_id, color, b.name AS brand_name 
          FROM guitars AS g
          JOIN brands AS b
          ON g.brand_id = b.id
          WHERE g.owner_id=${userId}
      `);
    
  res.json(data.rows);
});

// c_READ_ud
app.get('/api/brands', async(req, res) => {
  const data = await client.query(`
      SELECT * FROM brands`);

  res.json(data.rows);
});

// c_READ_ud
app.get('/api/guitars/:id', async(req, res) => {
  const guitarId = req.params.id;

  const data = await client.query(`
      SELECT g.id, strings, color, b.name AS brand_name, g.owner_id
          FROM guitars AS g
          JOIN brands AS b
          ON g.brand_id=b.id
          WHERE g.id=$1 AND g.owner_id=$2
  `, [guitarId, req.userId]);

  res.json(data.rows[0]);
});

// cru_DELETE_
app.delete('/api/guitars/:id', async(req, res) => {
  const guitarId = req.params.id;

  const data = await client.query('DELETE FROM guitars WHERE guitars.id=$1 AND guitars.owner_id=$2;', [guitarId, req.userId]);

  res.json(data.rows[0]);
});

// cr_UPDATE_d
app.put('/api/guitars/:id', async(req, res) => {
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
        WHERE guitars.id = $4 AND guitars.owner_id = $5
        RETURNING *
  `, [updatedGuitar.color, updatedGuitar.strings, updatedGuitar.brand_id, guitarId, req.userId]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }});

// _CREATE_rud
app.post('/api/guitars', async(req, res) => {
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
  `, [realNewGuitar.color, realNewGuitar.strings, req.userId, realNewGuitar.brand_id]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.status(404).json({ message: 'No such endpoint!' });
});

app.use(require('./middleware/error'));

module.exports = app;
