const { chunk, favsFor } = require('./utils');
const { maxVisibleBtns } = require('./config');

module.exports = {
  optRow: async (ctx) => {
    const btns = [];

    const favs = await favsFor(ctx.from.id);

    const { current, map } = ctx.scene.state;

    if (current.address) {
      if (map) {
        btns.push({
          text: 'Sulje sijainti',
          callback_data: 'hideLocation',
        });
      } else {
        btns.push({
          text: 'Sijainti',
          callback_data: 'showLocation',
        });
      }
    }

    if (favs.includes(current.name)) {
      btns.push({
        text: 'Poista suosikeista',
        callback_data: 'favoriteRemove',
      });
    } else {
      btns.push({
        text: 'Lisää suosikkeihin',
        callback_data: 'favoriteAdd',
      });
    }

    return [btns];
  },

  places: async (places, user, offset = 0) => {
    const favs = await favsFor(user);

    const buttons = places
      .slice(offset, offset + maxVisibleBtns)
      .map(p => ({
        text: favs.includes(p.name) ? `⭐️ ${p.name}` : p.name,
        callback_data: p.name,
      }));

    return chunk(buttons);
  },

  nav: (total, offset = 0) => {
    const nextBtn = {
      text: 'Seuraavat ➡️',
      callback_data: 'next',
    };

    const prevBtn = {
      text: '⬅️ Edelliset',
      callback_data: 'prev',
    };

    if (total <= maxVisibleBtns) {
      return null;
    }

    if (offset < maxVisibleBtns) {
      return [nextBtn];
    }

    if (offset + maxVisibleBtns >= total) {
      return [prevBtn];
    }

    return [prevBtn, nextBtn];
  },
};
