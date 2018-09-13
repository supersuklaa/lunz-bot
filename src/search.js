const rp = require('request-promise');

const { urls } = require('./config');
const { createURIparams } = require('./utils');

const call = url => rp(url)
  .then((res) => {
    try {
      const { features } = JSON.parse(res);

      if (features.length < 1) {
        return { errMsg: 'Hakusi ei palauttanut ainuttakaan osoitetta.' };
      }

      const { name, postalcode, locality } = features[0].properties;

      return {
        lat: features[0].geometry.coordinates[1],
        lng: features[0].geometry.coordinates[0],
        formattedAddress: `${name}, ${postalcode} ${locality}`,
      };
    } catch (err) {
      console.log(`Parsing result of query to ${url} failed: ${err}`);
    }

    return null;
  })
  .catch((err) => {
    console.log(`Query to ${url} failed: ${err}`);
  });

module.exports = {
  via: {
    text: (text) => {
      const query = createURIparams({ size: '1', text });

      return call(`${urls.transit}/search?${query}`);
    },

    location: (location) => {
      const query = createURIparams({
        size: '1',
        'point.lat': location.latitude,
        'point.lon': location.longitude,
      });

      return call(`${urls.transit}/reverse?${query}`);
    },
  },
};
