const client = require('../lib/client');
// import our seed data:
const guitars = require('./guitars.js');
const usersData = require('./users.js');
const brandsData = require('./brands.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      brandsData.map(brand => {
        return client.query(`
                      INSERT INTO brands (name)
                      VALUES ($1);
                    `,
        [brand.name]);
      })
    );

    await Promise.all(
      guitars.map(guitar => {
        return client.query(`
                    INSERT INTO guitars (strings, color, owner_id, brand_id)
                    VALUES ($1, $2, $3, $4);
                `,
        [guitar.strings, guitar.color, user.id, guitar.brand_id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
