const search = require('./search');
const start = require('./start');
const stage = require('./stage');

module.exports = (bot) => {
  stage(bot);

  bot.command('/start', start);

  bot.on('location', search.location);

  bot.on('message', search.message);

  return bot;
};
