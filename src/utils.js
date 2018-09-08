const { maxVisibleBtns, maxBtnsInRow } = require('./config');

module.exports = {
  chunk: (arr) => {
    let chunks = [];
    let i = 0;
  
    while (i < arr.length) {
      chunks.push(arr.slice(i, i += maxBtnsInRow));
    }
  
    return chunks;
  },

  createURIparams: (params) => {
    return Object.keys(params)
      .map(k => `${k}=${params[k]}`)
      .join('&');
  },

  createNavigation: (offset, total) => {
    const nextBtn = {
      text: 'Seuraavat',
      callback_data: 'next',
    };

    const prevBtn = {
      text: 'Edelliset',
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
