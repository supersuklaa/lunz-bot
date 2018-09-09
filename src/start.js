module.exports = (ctx) => {
  ctx.reply('Etsitkö lounasta? Kerro sijaintisi, tai hae sijaintia kirjoittamalla minulle.', {
    reply_markup: {
      keyboard: [[{
        text: 'Käytä sijaintiani',
        request_location: true,
      }]],
      resize_keyboard: true,
    },
  });
};
