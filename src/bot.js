const search = require('./search');
const start = require('./start');
const stage = require('./stage');
const crawl = require('./crawl');
const queries = require('./queries');

module.exports = (bot) => {
  stage(bot);

  bot.command('/start', start);

  bot.on(['message', 'location'], async (ctx) => {
    if (ctx.message.location) {
      ctx.state.location = await search.via.location(ctx.message.location);
    } else {
      ctx.state.location = await search.via.text(ctx.message.text);
    }

    if (!ctx.state.location) {
      return null;
    }

    if (ctx.state.location.errMsg) {
      return ctx.reply(ctx.state.location.errMsg);
    }

    await crawl(ctx);

    if (!ctx.scene.state.places) {
      return ctx.reply('Lounastietojen haku epäonnistui, pahoittelut.');
    }

    return queries.sendBrowser(ctx);
  });

  return bot;
};
