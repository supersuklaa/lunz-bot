const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const queries = require('./queries');

module.exports = (bot) => {
  const stage = new Stage();
  const organizer = new Scene('activeMenus');

  organizer.on('callback_query', async (ctx) => {
    switch (ctx.update.callback_query.data) {
      case 'next':
      case 'prev':
        return queries.navigateMenus(ctx);

      case 'favoriteAdd':
      case 'favoriteRemove':
        return queries.toggleFavorite(ctx);

      case 'location':
        queries.deleteLocation(ctx);
        return queries.sendLocation(ctx);

      case 'deleteLocation':
        queries.deleteLocation(ctx);
        return ctx.answerCbQuery(null);

      case ctx.scene.state.current_place: // Would lead to unnecessary api calls
        return ctx.answerCbQuery(null);

      default:
        queries.deleteLocation(ctx);
        return queries.chooseMenu(ctx);
    }
  });

  organizer.on(['location', 'message'], (ctx, next) => {
    ctx.scene.leave();
    return next();
  });

  stage.register(organizer);

  bot.use(session());
  bot.use(stage.middleware());
};
