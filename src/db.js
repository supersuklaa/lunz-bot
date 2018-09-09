const { Client } = require('pg');
const config = require('./config');

module.exports =  {
  favorite: {
    add: async (ctx) => {
      const query = ctx.update.callback_query;
      const place = ctx.scene.state.current_place;

      const client = new Client(config.db);
      client.connect();

      const text = 'INSERT INTO favorites(user_id, place) VALUES($1, $2) RETURNING *';

      client.query(text, [query.from.id, place])
        .then(res => res.rows[0])
        .catch(e => console.error(e.stack));

      const keyboard = [[
        {
          text: 'Sijainti',
          callback_data: 'location',
        },
        {
          text: 'Poista suosikeista',
          callback_data: 'favoriteRemove',
        }
      ]];

      await ctx.telegram.editMessageReplyMarkup(
        query.from.id,
        query.message.message_id,
        null,
        { inline_keyboard: keyboard }
      );

      return ctx.answerCbQuery('Lisätty');
    },

    remove: async (ctx) => {
      const query = ctx.update.callback_query;
      const place = ctx.scene.state.current_place;
      const text = `DELETE FROM favorites WHERE user_id = $1 AND place = $2 RETURNING *`;

      const client = new Client(config.db);
      client.connect();

      await client.query(text, [query.from.id, place])
        .then(res => res.rows)
        .catch(e => console.error(e.stack));

      const keyboard = [[
        {
          text: 'Sijainti',
          callback_data: 'location',
        },
        {
          text: 'Lisää suosikkeihin',
          callback_data: 'favoriteAdd',
        }
      ]];

      await ctx.telegram.editMessageReplyMarkup(
        query.from.id,
        query.message.message_id,
        null,
        { inline_keyboard: keyboard }
      );

      return ctx.answerCbQuery('Poistettu');
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
