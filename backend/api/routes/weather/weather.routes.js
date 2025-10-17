const express = require('express');
const router = express.Router();
const weatherController = require('../../controllers/weather/weather.controller.js');

router.get('/:locationId', weatherController.getWeather);
router.post('/refresh/:locationId', weatherController.refreshWeather);

module.exports = router;
