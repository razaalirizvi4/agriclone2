const weatherService = require('./weather.service');

async function scheduleWeatherUpdate() {
  try {
    await weatherService.updateWeatherData();
    console.log('Weather data updated successfully.');
  } catch (error) {
    console.error('Error updating weather data:', error);
  } finally {
    // Schedule the next run after 2 hours (in milliseconds)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    setTimeout(scheduleWeatherUpdate, TWO_HOURS);
  }
}

// Start the first update cycle when server starts
scheduleWeatherUpdate();
