const cron = require('node-cron');
const weatherService = require('./weather.service');

// Schedule a job to run every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Updating weather data...');
  await weatherService.updateWeatherData();
  console.log('Weather data updated.');
});
