const Telegraf = require('telegraf');
const config = require('./config');
const createBot = require('./bot');

const start = async () => {
  const options = { telegram: { webhookReply: false } };
  const bot = await createBot(new (Telegraf)(config.tg.token, options));

  // Setup webhook if production
  if (config.env.prod && config.tg.webhook) {
    const webhook = `${config.tg.webhook}/bot${config.tg.token}`;
    await bot.telegram.setWebhook(webhook);
    await bot.startWebhook(`/bot${config.tg.token}`, null, config.tg.port);
    console.log(`Webhook listening at ${webhook}`);

  // Do polling in development
  } else {
    await bot.telegram.deleteWebhook();
    await bot.startPolling();
    console.log('Polling started for updates');
  }
};

start();
