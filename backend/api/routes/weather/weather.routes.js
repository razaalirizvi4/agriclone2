const express = require('express');
const router = express.Router();
const weatherController = require('../../controllers/weather/weather.controller.js');

router.get('/:farmId', weatherController.getWeather);
router.post('/refresh/:farmId', weatherController.refreshWeather);

module.exports = router;
