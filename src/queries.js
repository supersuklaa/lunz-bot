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
      const current = ctx.scene.state.places
        .find(p => p.name === ctx.update.callback_query.data);

      ctx.scene.state.current = current;

      const keyboard = await kbBuilder.optRow(ctx);

      const text = `<b>${current.name}</b> <i>${current.time}</i>\n${current.dish}`;
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
    } catch (err) {
      console.log(`Menu message editing failed: ${err}`);
    }

    return ctx.answerCbQuery(null);
  },

  sendLocation: async (ctx) => {
    try {
      const { lat, lng } = await search.via.text(ctx.scene.state.current.address);
      const reply = await ctx.telegram.sendLocation(ctx.from.id, lat, lng);

      ctx.scene.state.map = reply.message_id;

      const keyboard = await kbBuilder.optRow(ctx);

      await ctx.telegram.editMessageReplyMarkup(
        ctx.update.callback_query.from.id,
        ctx.scene.state.message_id,
        null,
        { inline_keyboard: keyboard },
      );
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

        const keyboard = await kbBuilder.optRow(ctx);

        await ctx.telegram.editMessageReplyMarkup(
          ctx.update.callback_query.from.id,
          ctx.scene.state.message_id,
          null,
          { inline_keyboard: keyboard },
        );
      } catch (err) {
        console.log(`Deleting map message failed: ${err}`);
      }
    }
  },

  toggleFavorite: async (ctx) => {
    const query = ctx.update.callback_query;
    const { places, offset, current } = ctx.scene.state;

    const add = query.data === 'favoriteAdd';

    try {
      if (add) {
        await db.favorite.add(query.from.id, current.name);
      } else {
        await db.favorite.remove(query.from.id, current.name);
      }

      const keyboard = await kbBuilder.optRow(ctx);

      await ctx.telegram.editMessageReplyMarkup(
        query.from.id,
        query.message.message_id,
        null,
        { inline_keyboard: keyboard },
      );

      const currentBtnIsVisible = places
        .slice(offset, offset + maxVisibleBtns)
        .find(p => p.name === current.name);

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

  sendBrowser: async (ctx) => {
    try {
      const { places } = ctx.scene.state;

      if (places.length < 1) {
        return ctx.reply('Ei löytynyt lounasta tällä sijainnilla juuri nyt! Kannattaa vielä kokeilla keskeisemmällä sijainnilla jos mahdollista 🙂');
      }

      const buttons = await kbBuilder.places(places, ctx.from.id);

      const navigation = kbBuilder.nav(places.length);
      const keyboard = navigation
        ? buttons.concat([navigation])
        : buttons;

      const reply = await ctx.reply(
        `Osoitteen ${ctx.state.location.formattedAddress} lähistöltä löytyi:`, {
          reply_markup: { inline_keyboard: keyboard },
        },
      );

      ctx.scene.state.markup_id = reply.message_id;
    } catch (err) {
      console.log(`Sending first message with places failed: ${err}`);
    }

    return null;
  },
};
