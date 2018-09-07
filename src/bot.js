
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage

const cheerio = require('cheerio');
const rp = require('request-promise');
const tough = require('tough-cookie');
const { urls } = require('./config');

const chunk2 = (arr) => {
  let chunks = [];
  let i = 0;

  while (i < arr.length) {
    chunks.push(arr.slice(i, i += 2));
  }

  return chunks;
}

const crawl = (ctx, locdata) => {
  const address = locdata.formattedAddress;
  let cookie = new tough.Cookie({
    key: 'location_v2',
    value: encodeURI(JSON.stringify(locdata)),
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
    $('p.dish > a').remove();

    $('div.menu.item').each(function(i, item) {
      places[i] = {
        name: $(this).find('.item-header > h3').text(),
        time: $(this).find('.details > p.lunch').text(),
        dish: $(this).find('p.dish').map(function() {
          return $(this).text().trim();
        }).get().join(', '),
      };
    });

    const buttons = places
      .filter(f => f.dish.length > 0)
      .map(f => ({
        text: f.name,
        callback_data: f.name,
      }));

    const keyboard = chunk2(buttons.slice(0, 4)).concat([[{
      text: '»',
      callback_data: 'next',
    }]]);

    const reply = await ctx.reply(
      `Osoitteesta ${address} löytyi esim:`, {
        reply_markup: { inline_keyboard: keyboard }
      }
    );

    return ctx.scene.enter('getPlaceData', {
      places: places.filter(f => f.dish.length > 0),
      markup_id: reply.message_id,
      chat_id: reply.chat.id,
      buttons,
      offset: 0,
    });

  });
};

module.exports = (bot) => {

  // Create scene manager
  const stage = new Stage()

  const greeter = new Scene('getPlaceData')
  greeter.on('callback_query', async (ctx) => {
    cb = ctx.update.callback_query;
    if (ctx.scene.state.current_place === cb.data) {
      return ctx.answerCbQuery(null);
    }

    const { buttons, chat_id, markup_id, offset, places } = ctx.scene.state;

    if (cb.data === 'next' || cb.data === 'prev') {
      const o = cb.data === 'next' ? offset+4 : offset-4;
      try {
        let navRow = [{
            text: '«',
            callback_data: 'prev',
          },{
            text: '»',
            callback_data: 'next',
          },
        ];
        if (o - 4 < 0) {
          navRow = [{
            text: '»',
            callback_data: 'next',
          }];
        } else if (o + 4 > places.length) {
          navRow = [{
            text: '«',
            callback_data: 'prev',
          }];
        }
        const keyboard = chunk2(buttons.slice(o, o+4));
        await ctx.telegram.editMessageReplyMarkup(
          chat_id,
          markup_id,
          null,
          { inline_keyboard: keyboard.concat([navRow]) }
        );
        ctx.scene.state.offset = o;
      } catch (err) {
        console.log(err);
      }
    }

    const place = places.find(f => f.name === cb.data);
    if (!place) {
      return ctx.answerCbQuery(null);
    }
    const text = `<b>${place.name}</b> <i>${place.time}</i>\n${place.dish}`;
    try {
      const reply = ctx.scene.state.message_id
      ?
        await ctx.telegram.editMessageText(
          ctx.scene.state.chat_id,
          ctx.scene.state.message_id,
          null,
          text,
          { parse_mode: 'html' },
        )
      :
        await ctx.reply(text, { parse_mode: 'html' })
      ;
      ctx.scene.state.message_id = reply.message_id;
      ctx.scene.state.current_place = cb.data;
    } catch (err) {
      console.log(err);
    }
    ctx.answerCbQuery(null);
  })

  // Scene registration
  stage.register(greeter)

  bot.use(session());
  bot.use(stage.middleware());

  bot.command('/start', (ctx) => {
    leave();
    ctx.reply('Etsitkö lounasta? Kerro sijaintisi, tai hae sijaintia kirjoittamalla minulle.', {
      reply_markup: {
        keyboard: [[{
          text: 'Käytä sijaintiani',
          request_location: true,
        }],
        ],
        resize_keyboard: true,
      }
    });
  })

  bot.on('location', (ctx) => {
    leave();
    const { latitude, longitude } = ctx.message.location;
    
    const queryParams = {
      size: '1',
      'point.lat': latitude,
      'point.lon': longitude,
    };

    const query = Object.keys(queryParams)
      .map(k => `${k}=${queryParams[k]}`)
      .join('&');

    rp(`${urls.transit}/reverse?${query}`)
      .then((res) => {
        const { features } = JSON.parse(res);

        const { name, postalcode, locality } = features[0].properties;

        crawl(ctx, {
          lat: features[0].geometry.coordinates[1],
          lng: features[0].geometry.coordinates[0],
          formattedAddress: `${name}, ${postalcode} ${locality}`,
        });
      })
  });

  bot.on('message', (ctx) => {
    leave();
    const queryParams = {
      size: '1',
      text: encodeURI(ctx.message.text),
    };

    const query = Object.keys(queryParams)
      .map(k => `${k}=${queryParams[k]}`)
      .join('&');

    rp(`${urls.transit}/search?${query}`)
      .then((res) => {
        const { features } = JSON.parse(res);

        if (features.length < 1) {
          return ctx.reply('Hakusi ei palauttanut osoitetta.');
        }

        crawl(ctx, {
          lat: features[0].geometry.coordinates[1],
          lng: features[0].geometry.coordinates[0],
          formattedAddress: features[0].properties.label,
        });
      })
  });

  return bot;
};
