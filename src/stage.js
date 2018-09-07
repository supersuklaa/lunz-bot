const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const queries = require('./queries');

module.exports = (bot) => {
  const stage = new Stage();
  const organizer = new Scene('activeMenus');

  organizer.on('callback_query', async (ctx) => {
    const query = ctx.update.callback_query.data;

    if (query === 'next' || query === 'prev') {
      return queries.editMarkup(ctx);
    }

    if (ctx.scene.state.map) {
      ctx.telegram.deleteMessage(
        ctx.scene.state.chat_id,
        ctx.scene.state.map,
      );
      ctx.scene.state.map = null;
    }

    if (query === 'location') {
      return queries.sendLocation(ctx);
    }

    const place = ctx.scene.state.places.find(p => p.name === query);

    if (place && ctx.scene.state.current_place !== query) {
      return queries.chooseMenu(ctx, place);
    }
      
    return ctx.answerCbQuery(null);
  });

  // Scene registration
  stage.register(organizer)

  bot.use(session());
  bot.use(stage.middleware());
};
