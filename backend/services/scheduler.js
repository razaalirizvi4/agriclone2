const weatherService = require('./weather.service');

async function scheduleWeatherUpdate() {
  try {
    console.log('Updating weather data...');
    await weatherService.updateWeatherData();
    console.log('Weather data updated successfully.');
  } catch (error) {
    console.error('Error updating weather data:', error);
  } finally {
    // Schedule the next run after 2 hours (in milliseconds)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    console.log('Next weather update scheduled in 2 hours.');
    setTimeout(scheduleWeatherUpdate, TWO_HOURS);
  }
}

// Start the first update cycle when server starts
scheduleWeatherUpdate();
