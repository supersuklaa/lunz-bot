const { chunk } = require('./utils');
const db = require('./db');
const { maxVisibleBtns } = require('./config');

module.exports = {
  tools: async (opt) => {
    const btns = [];

    if (opt.address) {
      btns.push({
        text: 'Sijainti',
        callback_data: 'location',
      });
    }

    if (opt.favorite) {
      if (opt.favorite === 'remove') {
        btns.push({
          text: 'Poista suosikeista',
          callback_data: 'favoriteRemove',
        });
      } else if (opt.favorite === 'add') {
        btns.push({
          text: 'Lisää suosikkeihin',
          callback_data: 'favoriteAdd',
        });
      }
    }

    return [btns];
  },

  places: async (places, user, offset = 0) => {
    const favs = await db.favorite.find({ user_id: user });

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

    if (offset - maxVisibleBtns < 0) {
      return [nextBtn];
    }

    if (offset + maxVisibleBtns >= total) {
      return [prevBtn];
    }

    return [prevBtn, nextBtn];
  },
};
