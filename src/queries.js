const { maxVisibleBtns } = require('./config');
const search = require('./search');
const db = require('./db');
const kbBuilder = require('./keyboard');

module.exports = {
  navigateMenus: async (ctx) => {
    const query = ctx.update.callback_query;
    const { offset, places } = ctx.scene.state;

    const newOffset = query.data === 'next'
      ? offset + maxVisibleBtns
      : offset - maxVisibleBtns;

    if (newOffset < 0 || newOffset >= places.length) {
      // This is possible if user clicks a button repeatedly
      return ctx.answerCbQuery(null);
    }

    const buttons = await kbBuilder.places(places, ctx.from.id, newOffset);
    const navigation = kbBuilder.nav(places.length, newOffset);

    try {
      const keyboard = navigation
        ? buttons.concat([navigation])
        : buttons;

      await ctx.telegram.editMessageReplyMarkup(
        ctx.from.id,
        ctx.scene.state.markup_id,
        null,
        { inline_keyboard: keyboard },
      );

      ctx.scene.state.offset = newOffset;
    } catch (err) {
      console.log(`Markup editing failed: ${err}`);
    }

    return ctx.answerCbQuery(null);
  },

  chooseMenu: async (ctx) => {
    try {
      const place = ctx.scene.state.places
        .find(p => p.name === ctx.update.callback_query.data);

      const favs = await db.favorite.find({ user_id: ctx.from.id });

      const keyboard = await kbBuilder.tools({
        address: place.address,
        favorite: favs.includes(place.name) ? 'remove' : 'add',
      });

      const text = `<b>${place.name}</b> <i>${place.time}</i>\n${place.dish}`;
      const extra = {
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      };

      const reply = ctx.scene.state.message_id
        ? await ctx.telegram.editMessageText(
          ctx.from.id,
          ctx.scene.state.message_id,
          null,
          text,
          extra,
        )
        : await ctx.reply(text, extra);

      ctx.scene.state.message_id = reply.message_id;
      ctx.scene.state.current_place = place.name;
    } catch (err) {
      console.log(`Menu message editing failed: ${err}`);
    }

    return ctx.answerCbQuery(null);
  },

  sendLocation: async (ctx) => {
    try {
      const current = ctx.scene.state.current_place;
      const place = ctx.scene.state.places.find(p => p.name === current);

      const { lat, lng } = await search.address(place.address);

      const reply = await ctx.telegram.sendLocation(ctx.from.id, lat, lng);

      ctx.scene.state.map = reply.message_id;
    } catch (err) {
      console.log(`Sending location failed: ${err}`);
    }

    return ctx.answerCbQuery(null);
  },

  deleteLocation: async (ctx) => {
    if (ctx.scene.state.map) {
      try {
        await ctx.telegram.deleteMessage(ctx.from.id, ctx.scene.state.map);
        ctx.scene.state.map = null;
      } catch (err) {
        console.log(`Deleting map message failed: ${err}`);
      }
    }
  },

  toggleFavorite: async (ctx) => {
    const query = ctx.update.callback_query;
    const place = ctx.scene.state.current_place;
    const { places, offset } = ctx.scene.state;

    const add = query.data === 'favoriteAdd';

    try {
      if (add) {
        await db.favorite.add(query.from.id, place);
      } else {
        await db.favorite.remove(query.from.id, place);
      }
      const { address } = places.find(p => p.name === place);

      const keyboard = await kbBuilder.tools({
        address,
        favorite: add ? 'remove' : 'add',
      });

      await ctx.telegram.editMessageReplyMarkup(
        query.from.id,
        query.message.message_id,
        null,
        { inline_keyboard: keyboard },
      );

      const currentBtnIsVisible = places
        .slice(offset, offset + maxVisibleBtns)
        .find(p => p.name === place);

      if (currentBtnIsVisible) { // toggle star emoji in place name
        const buttons = await kbBuilder.places(places, ctx.from.id, offset);
        const navigation = kbBuilder.nav(places.length, offset);

        const menuKeyboard = navigation
          ? buttons.concat([navigation])
          : buttons;

        await ctx.telegram.editMessageReplyMarkup(
          ctx.from.id,
          ctx.scene.state.markup_id,
          null,
          { inline_keyboard: menuKeyboard },
        );
      }

      return ctx.answerCbQuery(add ? 'Lisätty' : 'Poistettu');
    } catch (err) {
      if (add) {
        console.log(`Adding favorite to db failed: ${err}`);
      } else {
        console.log(`Removing favorite from db failed: ${err}`);
      }
    }

    return ctx.answerCbQuery(null);
  },
};
