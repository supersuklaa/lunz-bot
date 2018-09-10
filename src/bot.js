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
      ctx.state.location = await search.viaLocation(ctx);
    } else {
      ctx.state.location = await search.viaMessage(ctx);
    }

    const { location } = ctx.state;

    if (!location) {
      return null;
    }

    if (location.errMsg) {
      return ctx.reply(location.errMsg);
    }

    await crawl(ctx);

    if (!ctx.scene.state.places) {
      return null;
    }

    return queries.sendBrowser(ctx);
  });

  return bot;
};
