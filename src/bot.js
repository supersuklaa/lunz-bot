export default (bot) => {
  bot.on('location', (ctx) => {
    console.log(ctx.message.location);
  });

  return bot;
};
