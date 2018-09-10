const rp = require('request-promise');

const { urls } = require('./config');
const { createURIparams } = require('./utils');

module.exports = {
  viaMessage: (ctx) => {
    const query = createURIparams({
      size: '1',
      text: encodeURI(ctx.message.text),
    });

    const url = `${urls.transit}/search?${query}`;

    return rp(url)
      .then((res) => {
        try {
          const { features } = JSON.parse(res);

          if (features.length < 1) {
            return { errMsg: 'Hakusi ei palauttanut ainuttakaan osoitetta.' };
          }

          return {
            lat: features[0].geometry.coordinates[1],
            lng: features[0].geometry.coordinates[0],
            formattedAddress: features[0].properties.label,
          };
        } catch (err) {
          console.log(`Digitransit search query parsing failed: ${err}`);
        }

        return null;
      })
      .catch((err) => {
        console.log(`Digitransit search query to ${url} returned error: ${err}`);
      });
  },

  viaLocation: (ctx) => {
    const { latitude, longitude } = ctx.message.location;

    const query = createURIparams({
      size: '1',
      'point.lat': latitude,
      'point.lon': longitude,
    });

    const url = `${urls.transit}/reverse?${query}`;

    return rp(url)
      .then((res) => {
        try {
          const { features } = JSON.parse(res);

          const { name, postalcode, locality } = features[0].properties;

          return {
            lat: features[0].geometry.coordinates[1],
            lng: features[0].geometry.coordinates[0],
            formattedAddress: `${name}, ${postalcode} ${locality}`,
          };
        } catch (err) {
          console.log(`Digitransit reverse query parsing failed: ${err}`);
        }

        return null;
      })
      .catch((err) => {
        console.log(`Digitransit reverse query to ${url} returned error: ${err}`);
      });
  },

  address: (address) => {
    const query = createURIparams({
      size: '1',
      text: encodeURI(address),
    });

    const url = `${urls.transit}/search?${query}`;

    const reply = rp(url)
      .then((res) => {
        try {
          const { features } = JSON.parse(res);

          return {
            lat: features[0].geometry.coordinates[1],
            lng: features[0].geometry.coordinates[0],
          };
        } catch (err) {
          console.log(`Digitransit search query parsing failed: ${err}`);
        }

        return null;
      })
      .catch((err) => {
        console.log(`Digitransit search query to ${url} returned error: ${err}`);
      });

    return reply;
  },
};
