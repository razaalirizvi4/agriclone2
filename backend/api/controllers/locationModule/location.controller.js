
const locationService = require('../../../services/location.service');

/**
 * Create a new location
 * - If user is an owner, automatically set owner.id to their user_id
 * - If user is an admin, they can set any owner
 */
exports.createLocation = async (req, res) => {
  try {
    const locationData = { ...req.body };
    
    // If user is an owner (not admin), automatically set owner.id to their user_id
    if (req.isOwner) {
      locationData.owner = {
        ...locationData.owner,
        id: req.user._id,
        email: req.user.email || locationData.owner?.email,
        name: req.user.name || locationData.owner?.name,
      };
    }
    
    const location = await locationService.createLocation(locationData);
    res.status(201).send(location);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to create location', error });
  }
};

/**
 * Get all locations
 * - Admin: Returns all locations
 * - Owner: Returns only locations where owner.id matches their user_id
 */
exports.getLocations = async (req, res) => {
  try {
    const locations = await locationService.getLocations({ ...req.query, accessFilter: req.accessFilter });
    res.status(200).send(locations);
  } catch (error) {
    res.status(500).send({ message: error.message || 'Failed to fetch locations', error });
  }
};

/**
 * Get a single location by ID
 * - Admin: Can access any location
 * - Owner: Can only access locations where owner.id matches their user_id
 */
exports.getLocationById = async (req, res) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    
    if (!location) {
      return res.status(404).send({ message: 'Location not found' });
    }
    
    // Check if owner has access (if not admin)
    if (req.isOwner) {
      const locationOwnerId = location.owner?.id?.toString();
      const userId = req.user._id.toString();
      
      if (locationOwnerId !== userId) {
        return res.status(403).send({ message: 'Access denied. You can only view your own locations.' });
      }
    }
    
    res.status(200).send(location);
  } catch (error) {
    res.status(500).send({ message: error.message || 'Failed to fetch location', error });
  }
};

/**
 * Update a location
 * - Admin: Can update any location
 * - Owner: Can only update locations where owner.id matches their user_id
 */
exports.updateLocation = async (req, res) => {
  try {
    // First check if location exists and user has access
    const existingLocation = await locationService.getLocationById(req.params.id);
    
    if (!existingLocation) {
      return res.status(404).send({ message: 'Location not found' });
    }
    
    // Check if owner has access (if not admin)
    if (req.isOwner) {
      const locationOwnerId = existingLocation.owner?.id?.toString();
      const userId = req.user._id.toString();
      
      if (locationOwnerId !== userId) {
        return res.status(403).send({ message: 'Access denied. You can only update your own locations.' });
      }
      
      // Prevent owners from changing the owner.id
      if (req.body.owner && req.body.owner.id) {
        delete req.body.owner.id;
      }
    }
    
    const location = await locationService.updateLocation(req.params.id, req.body);
    res.status(200).send(location);
  } catch (error) {
    res.status(400).send({ message: error.message || 'Failed to update location', error });
  }
};

/**
 * Delete a location
 * - Admin: Can delete any location
 * - Owner: Can only delete locations where owner.id matches their user_id
 */
exports.deleteLocation = async (req, res) => {
  try {
    // First check if location exists and user has access
    const existingLocation = await locationService.getLocationById(req.params.id);
    
    if (!existingLocation) {
      return res.status(404).send({ message: 'Location not found' });
    }
    
    // Check if owner has access (if not admin)
    if (req.isOwner) {
      const locationOwnerId = existingLocation.owner?.id?.toString();
      const userId = req.user._id.toString();
      
      if (locationOwnerId !== userId) {
        return res.status(403).send({ message: 'Access denied. You can only delete your own locations.' });
      }
    }
    
    const location = await locationService.deleteLocation(req.params.id);
    res.status(200).send(location);
  } catch (error) {
    res.status(500).send({ message: error.message || 'Failed to delete location', error });
  }
};

const { apiResponse } = require('../../../utils/apiResponse');

exports.farmWizard = async (req, res) => {
  try {
    const locations = req.body;
    const result = await locationService.farmSetup(locations);
    res.status(200).send(result)
  } catch (error) {
    res.status(500).send({message: error.message || 'Farm setup failed', error})
  }
};
