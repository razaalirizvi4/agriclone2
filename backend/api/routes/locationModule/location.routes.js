
const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationModule/location.controller');
const  authMiddleware  = require('../../middleware/auth.middleware.js');
const permission = require('../../middleware/role.middleware.js');

router.post('/',authMiddleware, permission, locationController.createLocation);
router.get('/',authMiddleware, permission, locationController.getLocations);
router.get('/:id',authMiddleware, permission, locationController.getLocationById);
router.put('/:id',authMiddleware, permission, locationController.updateLocation);
router.delete('/:id',authMiddleware, permission, locationController.deleteLocation);
router.post('/farm-wizard', authMiddleware, permission, locationController.farmWizard);


module.exports = router;
