module.exports = {
  env: {
    prod: process.env.NODE_ENV === 'production',
    dev: process.env.NODE_ENV === 'development',
    test: process.env.NODE_ENV === 'test',
  },
  tg: {
    token: process.env.TELEGRAM_TOKEN || '666069870:AAF4ZfNFA0A17ChrOoE1CbGEywbo5PnW_KI',
    port: parseInt(process.env.PORT, 10) || 6000,
  },
  urls: {
    lounaat: 'https://lounaat.info',
    transit: 'http://api.digitransit.fi/geocoding/v1',
  },
};
