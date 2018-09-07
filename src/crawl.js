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
    const places = [];

    $('div.menu.item').each(function(i, item) {
      places[i] = {
        name: $(this).find('.item-header > h3').text(),
        time: $(this).find('.details > p.lunch').text(),
        dish: $(this).find('.menu-item p').map(function() {
          return $(this).text().split(' ').filter(t => t.length > 0).join(' ');
        }).get().join('\n'),
        address: $(this).find('.item-footer > .dist').attr('title'),
      };
    });

    const buttons = places
      .filter(f => f.dish.length > 0)
      .map(f => ({
        text: f.name,
        callback_data: f.name,
      }));

    const navigation = createNavigation(0, 1);

    const keyboard = chunk(buttons.slice(0, maxVisibleBtns));

    const reply = await ctx.reply(
      `Osoitteesta ${location.formattedAddress} löytyi esim:`, {
        reply_markup: { inline_keyboard: keyboard.concat([navigation]) }
      }
    );

    return ctx.scene.enter('activeMenus', {
      places: places.filter(f => f.dish.length > 0),
      markup_id: reply.message_id,
      chat_id: reply.chat.id,
      buttons,
      offset: 0,
    });

  });
};
