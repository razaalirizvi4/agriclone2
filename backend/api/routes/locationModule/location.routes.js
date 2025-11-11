
const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationModule/location.controller');
const  authMiddleware  = require('../../middleware/auth.middleware.js');
const roleAccess = require('../../middleware/role.middleware.js');

router.post('/',authMiddleware, roleAccess, locationController.createLocation);
router.get('/',authMiddleware, roleAccess, locationController.getLocations);
router.get('/:id',authMiddleware, roleAccess, locationController.getLocationById);
router.put('/:id',authMiddleware, roleAccess, locationController.updateLocation);
router.delete('/:id',authMiddleware, roleAccess, locationController.deleteLocation);

module.exports = router;
