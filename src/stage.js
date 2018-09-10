const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const queries = require('./queries');

module.exports = (bot) => {
  const stage = new Stage();
  const browser = new Scene('browse');

  browser.on('callback_query', async (ctx) => {
    switch (ctx.update.callback_query.data) {
      case 'next':
      case 'prev':
        return queries.navigateMenus(ctx);

      case 'favoriteAdd':
      case 'favoriteRemove':
        return queries.toggleFavorite(ctx);

      case 'showLocation':
        queries.deleteLocation(ctx);
        return queries.sendLocation(ctx);

      case 'hideLocation':
        queries.deleteLocation(ctx);
        return ctx.answerCbQuery(null);

      case ctx.scene.state.current.name: // Would lead to unnecessary api calls
        return ctx.answerCbQuery(null);

      default:
        queries.deleteLocation(ctx);
        return queries.chooseMenu(ctx);
    }
  });

  browser.on(['location', 'message'], (ctx, next) => {
    ctx.scene.leave();
    return next();
  });

  stage.register(browser);

  bot.use(session());
  bot.use(stage.middleware());
};
