const { Client } = require('pg');
const config = require('./config');

module.exports =  {
  favorite: {
    add: async (user, place) => {
      const client = new Client(config.db);
      client.connect();

      const text = 'INSERT INTO favorites(user_id, place) VALUES($1, $2) RETURNING *';

      return client.query(text, [user, place])
        .then(res => res.rows[0])
        .catch(e => console.error(e.stack));
    },

    remove: async (user, place) => {
      const text = `DELETE FROM favorites WHERE user_id = $1 AND place = $2 RETURNING *`;

      const client = new Client(config.db);
      client.connect();

      return client.query(text, [user, place])
        .then(res => res.rows)
        .catch(e => console.error(e.stack));
    },

    find: async (opt) => {
      const keyStr = Object.keys(opt).map((k, i) => `${k} = $${1+i}`).join(' AND ');
      const text = `SELECT * FROM favorites WHERE ${keyStr}`;
      const values = Object.values(opt);

      const client = new Client(config.db);
      client.connect();

      const result = await client.query(text, values)
        .then(res => res.rows)
        .catch(e => console.error(e.stack));
      
      return result.map(f => f.place);
    },
  },
};
