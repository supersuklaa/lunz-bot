const cheerio = require('cheerio');
const rp = require('request-promise');
const tough = require('tough-cookie');

const { urls } = require('./config');
const { favsFor } = require('./utils');

module.exports = async (ctx) => {
  const cookie = new tough.Cookie({
    key: 'location_v2',
    value: encodeURI(JSON.stringify(ctx.state.location)),
    domain: 'lounaat.info',
    httpOnly: true,
    maxAge: 600,
  });

  const cookiejar = rp.jar();
  cookiejar.setCookie(cookie, urls.lounaat);

  return rp({
    uri: urls.lounaat,
    transform: body => cheerio.load(body),
    jar: cookiejar,
  })
    .then(async ($) => {
      const rawPlaces = [];
      const menuItemSelector = 'div.menu.item';

      $(menuItemSelector).each(function () {
        const p = {
          name: $(this).find('.item-header > h3').text(),
          time: $(this).find('.details > p.lunch').text(),
          dish: $(this).find('.menu-item p').map(function () {
            return $(this).text().split(' ')
              .filter(t => t.length > 0)
              .join(' ');
          }).get()
            .join('\n'),
          address: $(this).find('.item-footer > .dist').attr('title'),
        };

        if (p.dish.length > 0 && p.time !== 'ei lounasta') {
          rawPlaces.push(p);
        }
      });

      const favs = await favsFor(ctx.from.id);

      let places = rawPlaces;

      if (favs.length > 0) {
        places = places.sort((a, b) => favs.indexOf(b.name));
      }

      return ctx.scene.enter('browse', {
        places,
        offset: 0,
        current: {},
      });
    })
    .catch((err) => {
      console.log(`Lounaat.info crawl failed: ${err}`);
    });
};
