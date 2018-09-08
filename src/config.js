require('dotenv').config()

module.exports = {
  env: {
    prod: process.env.NODE_ENV === 'production',
    dev: process.env.NODE_ENV === 'development',
    test: process.env.NODE_ENV === 'test',
  },
  tg: {
    token: process.env.TELEGRAM_TOKEN,
    port: parseInt(process.env.PORT, 10) || 6000,
    webhook: process.env.WEBHOOK_DOMAIN,
  },
  urls: {
    lounaat: 'https://lounaat.info',
    transit: 'http://api.digitransit.fi/geocoding/v1',
  },
  maxBtnsInRow: 1,
  maxVisibleBtns: 3,
};
