const { maxBtnsInRow } = require('./config');

module.exports = {
  chunk: (arr) => {
    const chunks = [];
    let i = 0;

    while (i < arr.length) {
      chunks.push(arr.slice(i, i += maxBtnsInRow));
    }

    return chunks;
  },

  createURIparams: (params) => {
    const esc = encodeURI;

    return Object.keys(params)
      .map(k => `${esc(k)}=${esc(params[k])}`)
      .join('&');
  },
};
