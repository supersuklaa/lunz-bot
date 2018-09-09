const { maxBtnsInRow } = require('./config');

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
};
