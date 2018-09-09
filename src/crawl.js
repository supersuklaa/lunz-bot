const cheerio = require('cheerio');
const rp = require('request-promise');
const tough = require('tough-cookie');

const { urls } = require('./config');
const kbBuilder = require('./keyboard');

module.exports = (ctx, location) => {
  let cookie = new tough.Cookie({
    key: 'location_v2',
    value: encodeURI(JSON.stringify(location)),
    domain: 'lounaat.info',
    httpOnly: true,
    maxAge: 600
  });
  
  const cookiejar = rp.jar();
  cookiejar.setCookie(cookie, urls.lounaat);

  rp({
    uri: urls.lounaat,
    transform: body => cheerio.load(body),
    jar: cookiejar,
  }).then(async ($) => {
    const rawPlaces = [];

    $('div.menu.item').each(function(i, item) {
      rawPlaces[i] = {
        name: $(this).find('.item-header > h3').text(),
        time: $(this).find('.details > p.lunch').text(),
        dish: $(this).find('.menu-item p').map(function() {
          return $(this).text().split(' ').filter(t => t.length > 0).join(' ');
        }).get().join('\n'),
        address: $(this).find('.item-footer > .dist').attr('title'),
      };
    });

    const places = rawPlaces 
      .filter(f => f.dish.length > 0 && f.time !== 'ei lounasta');

    if (places.length < 1) {
      return ctx.reply('Ei löytynyt lounasta tällä sijainnilla juuri nyt! Kannattaa vielä kokeilla keskeisemmällä sijainnilla jos mahdollista 🙂');
    }

    const buttons = await kbBuilder.places(places, ctx.from.id);

    const navigation = kbBuilder.nav(0, places.length);
    const keyboard = navigation
      ? buttons.concat([navigation])
      : buttons;

    const reply = await ctx.reply(
      `Osoitteen ${location.formattedAddress} lähistöltä löytyi:`, {
        reply_markup: { inline_keyboard: keyboard }
      }
    );

    return ctx.scene.enter('activeMenus', {
      places,
      markup_id: reply.message_id,
      chat_id: reply.chat.id,
      offset: 0,
    });
  });
};
