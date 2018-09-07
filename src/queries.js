const { chunk, createNavigation } = require('./utils');
const { maxVisibleBtns } = require('./config');
const search = require('./search');

module.exports =  {
  editMarkup: async (ctx) => {
    const query = ctx.update.callback_query.data;
    const { buttons, chat_id, markup_id, offset, places } = ctx.scene.state;

    const newOffset = query === 'next'
      ? offset + maxVisibleBtns
      : offset - maxVisibleBtns;

    const navigation = createNavigation(newOffset, places.length);

    try {
      const keyboard = chunk(buttons.slice(newOffset, newOffset + maxVisibleBtns));

      await ctx.telegram.editMessageReplyMarkup(
        chat_id,
        markup_id,
        null,
        { inline_keyboard: keyboard.concat([navigation]) }
      );

      ctx.scene.state.offset = newOffset;

      return ctx.answerCbQuery(null);
    } catch (err) {
      console.log('Markup editing failed');
    }
  },

  chooseMenu: async (ctx, place) => {
    try {
      const text = `<b>${place.name}</b> <i>${place.time}</i>\n${place.dish}`;
      const extra = {
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard: [[{
            text: 'Sijainti',
            callback_data: 'location',
          }]]
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
};
