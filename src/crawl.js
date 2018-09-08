const cheerio = require('cheerio');
const rp = require('request-promise');
const tough = require('tough-cookie');

const { urls, maxVisibleBtns } = require('./config');
const { chunk, createNavigation } = require('./utils');

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

    const buttons = places.slice(0, maxVisibleBtns)
      .map(p => ({
        text: p.name,
        callback_data: p.name,
      }));

    const navigation = createNavigation(0, places.length);

    let keyboard = chunk(buttons);

    if (navigation) {
      keyboard = keyboard.concat([navigation]);
    }

    const reply = await ctx.reply(
      `Osoitteen ${location.formattedAddress} lähestöltä löytyi:`, {
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
