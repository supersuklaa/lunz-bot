const { chunk, createNavigation } = require('./utils');
const { maxVisibleBtns } = require('./config');
const search = require('./search');
const db = require('./db');

module.exports =  {
  navigateMenus: async (ctx) => {
    const query = ctx.update.callback_query;
    const { chat_id, markup_id, offset, places } = ctx.scene.state;

    const newOffset = query.data === 'next'
      ? offset + maxVisibleBtns
      : offset - maxVisibleBtns;

    const favs = await db.favorite
      .find({ user_id: ctx.from.id });

    const buttons = places.slice(newOffset, newOffset + maxVisibleBtns)
      .map(p => ({
        text: favs.includes(name) ? `⭐️ ${name}` : name,
        callback_data: p.name,
      }));

    const navigation = createNavigation(newOffset, places.length);

    try {
      const keyboard = navigation
        ? chunk(buttons).concat([navigation])
        : chunk(buttons);

      await ctx.telegram.editMessageReplyMarkup(
        chat_id,
        markup_id,
        null,
        { inline_keyboard: keyboard }
      );

      ctx.scene.state.offset = newOffset;

      return ctx.answerCbQuery(null);
    } catch (err) {
      console.log('Markup editing failed');
    }
  },

  chooseMenu: async (ctx, place) => {
    const favs = await db.favorite
      .find({ user_id: ctx.from.id })
      
    try {
      const text = `<b>${place.name}</b> <i>${place.time}</i>\n${place.dish}`;
      const extra = {
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Sijainti',
              callback_data: 'location',
            },
            {
              text: favs.includes(place.name)
                ? 'Poista suosikeista'
                : 'Lisää suosikkeihin',
              callback_data: favs.includes(place.name)
                ? 'favoriteRemove'
                : 'favoriteAdd',
            }
          ]]
        },
      };
      const reply = ctx.scene.state.message_id ?
        await ctx.telegram.editMessageText(
          ctx.scene.state.chat_id,
          ctx.scene.state.message_id,
          null,
          text,
          extra,
        ) :
        await ctx.reply(text, extra)
      ;

      ctx.scene.state.message_id = reply.message_id;
      ctx.scene.state.current_place = place.name;

      return ctx.answerCbQuery(null);
    } catch (err) {
      console.log('Menu message editing failed');
    }
  },

  sendLocation: async (ctx) => {
    try {
      const current = ctx.scene.state.current_place;
      const { places, chat_id } = ctx.scene.state;
      const place = places.find(p => p.name === current);
      
      const { lat, lng } = await search.address(place.address);

      const reply = await ctx.telegram.sendLocation(chat_id, lat, lng);

      ctx.scene.state.map = reply.message_id;

      return ctx.answerCbQuery(null);
    } catch (error) {
      console.log('Sending location failed');
    }
  },

  deleteLocation: async (ctx) => {
    try {
      ctx.telegram.deleteMessage(
        ctx.scene.state.chat_id,
        ctx.scene.state.map,
      );
      ctx.scene.state.map = null;
    } catch (error) {
      console.log('Deleting map message failed');
    }
  },
};
