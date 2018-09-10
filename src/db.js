const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.db);

const createQuery = async (text, values) => {
  const query = await pool.query(text, values)
    .then(res => res.rows)
    .catch(e => console.log(e.stack));

  return query;
};

module.exports = {
  favorite: {
    add: async (user, place) => {
      const text = 'INSERT INTO favorites(user_id, place) VALUES($1, $2) RETURNING *';
      const query = await createQuery(text, [user, place]);

      return query;
    },

    remove: async (user, place) => {
      const text = 'DELETE FROM favorites WHERE user_id = $1 AND place = $2 RETURNING *';
      const query = await createQuery(text, [user, place]);

      return query;
    },

    find: async (opt) => {
      const keyStr = Object.keys(opt).map((k, i) => `${k} = $${1 + i}`).join(' AND ');
      const text = `SELECT * FROM favorites WHERE ${keyStr}`;
      const values = Object.values(opt);

      const result = await createQuery(text, values);

      return result.map(f => f.place);
    },
  },
};
