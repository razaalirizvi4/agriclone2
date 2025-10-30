
const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationModule/location.controller');
const  authMiddleware  = require('../../middleware/auth.middleware.js');

router.post('/',authMiddleware, locationController.createLocation);
router.get('/',authMiddleware, locationController.getLocations);
router.get('/:id',authMiddleware, locationController.getLocationById);
router.put('/:id',authMiddleware, locationController.updateLocation);
router.delete('/:id',authMiddleware, locationController.deleteLocation);

module.exports = router;
