const client = require('../lib/client');
const { getEmoji } = require('../lib/emoji.js');

// async/await needs to run in a function
run();

async function run() {

  try {
    // initiate connecting to db
    await client.connect();

    // run a query to create tables
    // SCHEMA DEFINITION
    await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL,
                    hash VARCHAR(512) NOT NULL
                );
                CREATE TABLE brands (
                  id SERIAL PRIMARY KEY NOT NULL,
                  name VARCHAR(256) NOT NULL,
                );
                CREATE TABLE guitars (
                    id SERIAL PRIMARY KEY NOT NULL,
                    strings INTEGER NOT NULL,
                    color VARCHAR(256) NOT NULL,
                    owner_id INTEGER NOT NULL REFERENCES users(id),
                    brand_id INTEGER NOT NULL REFERENCES brands(id)
                );
        `);
    console.log('create tables complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    // problem? let's see the error...
    console.log(err);
  }
  finally {
    // success or failure, need to close the db connection
    client.end();
  }

}
