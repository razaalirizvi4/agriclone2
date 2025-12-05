// src/utils/wizardEditMode.js
import locationService from "../services/location.service";

/**
 * Converts API field data to fieldsData FeatureCollection format
 * Matches the structure used by processFarmDivision
 * @param {Array} farmFields - Array of field objects from API
 * @param {string} farmName - Name of the farm
 * @returns {Array} Array of GeoJSON Feature objects
 */
export const convertFieldsToFieldsData = (farmFields, farmName) => {
  return farmFields.map((field) => {
    const fieldAttributes = field.attributes || {};
    const geoJsonCords = fieldAttributes.geoJsonCords || {};
    const fieldFeature = geoJsonCords.features?.[0] || null;
    
    // Extract geometry from geoJsonCords
    const geometry = fieldFeature?.geometry || null;
    
    if (!geometry) return null; // Skip fields without geometry
    
    // Structure matches processFarmDivision: properties directly on properties object
    // No nested attributes object initially (that's added by handleFieldInfoUpdate)
    return {
      type: "Feature",
      properties: {
        id: field._id, // Use _id as id for matching with fieldsInfo
        type: "field",
        name: field.name || `Field ${field._id}`,
        area: fieldAttributes.area || "0 acres",
        farm: farmName || "Farm",
        crop_id: fieldAttributes.crop_id || null,
      },
      geometry: geometry,
    };
  }).filter((feature) => feature !== null); // Filter out null entries
};

/**
 * Converts API field data to fieldsInfo array format
 * Matches the structure used by createFieldsInfo
 * @param {Array} farmFields - Array of field objects from API
 * @returns {Array} Array of field info objects
 */
export const convertFieldsToFieldsInfo = (farmFields) => {
  return farmFields.map((field) => {
    const fieldAttributes = field.attributes || {};
    // Structure matches createFieldsInfo: flat structure with id, name, area, crop_id
    // Plus _id for API updates and parentId for reference
    return {
      id: field._id, // Must match properties.id in fieldsData features
      _id: field._id, // Keep _id for API updates (used in buildFieldPayloads line 455)
      name: field.name || `Field ${field._id}`,
      area: fieldAttributes.area || "0 acres",
      crop_id: fieldAttributes.crop_id || null,
      parentId: field.parentId,
      // Include all other field attributes at top level (not nested)
      // Exclude geoJsonCords since geometry is already in fieldsData
      ...Object.keys(fieldAttributes).reduce((acc, key) => {
        if (key !== 'geoJsonCords') {
          acc[key] = fieldAttributes[key];
        }
        return acc;
      }, {}),
    };
  });
};

/**
 * Prepares wizard data state for edit mode
 * Merges loaded farm and field data with existing wizard state
 * @param {Object} farm - Farm object from API
 * @param {Array} farmFields - Array of field objects from API
 * @param {Object} prevWizardData - Previous wizard state
 * @returns {Object} Updated wizard data state
 */
export const prepareWizardDataForEdit = (farm, farmFields, prevWizardData) => {
  const farmAttributes = farm.attributes || {};
  const farmFieldsCount = farmFields.length;
  const existingDetails = prevWizardData.farmDetails || {};

  // Convert fields to wizard format
  const fieldsDataFeatures = convertFieldsToFieldsData(farmFields, farm.name);
  const fieldsInfo = convertFieldsToFieldsInfo(farmFields);

  console.log("Existing details attributes:", existingDetails);
  console.log("Loaded farm fields:", farmFields);
  console.log("Converted fieldsData features:", fieldsDataFeatures);
  console.log("Converted fieldsInfo:", fieldsInfo);

  return {
    ...prevWizardData,
    // Prefill all non-mapbox attributes for FarmDetailsForm
    farmDetails: {
      // All attribute fields from backend (e.g. address, size, fields, etc.)
      ...farmAttributes,
      // Preserve any details already in state
      ...existingDetails,
      // Ensure name is taken from main farm document
      name: farm.name || existingDetails.name || "",
      // Common address field fallback
      address:
        farmAttributes.address ||
        existingDetails.address ||
        "",
      // No. of fields input uses key "fields" in FarmDetailsForm schema
      fields:
        farmAttributes.fields ??
        farmAttributes.numberOfFields ??
        (farmFieldsCount ||
          prevWizardData.numberOfFields ||
          (prevWizardData.fieldsInfo?.length || 1)),
      // Also keep numeric numberOfFields in wizard state for later steps
      numberOfFields:
        prevWizardData.numberOfFields ||
        farmAttributes.numberOfFields ||
        farmAttributes.fields ||
        farmFieldsCount ||
        (prevWizardData.fieldsInfo?.length || 1),
    },
    farmArea: farmAttributes.area || prevWizardData.farmArea,
    farmBoundaries: {
      ...farm,
      type: "Farm",
      attributes: {
        ...farmAttributes,
        geoJsonCords: farmAttributes.geoJsonCords || farmAttributes.geoJsonCords,
      },
    },
    // Populate fields data
    fieldsData: {
      type: "FeatureCollection",
      features: fieldsDataFeatures,
    },
    fieldsInfo: fieldsInfo,
    selectedFieldId: fieldsInfo[0]?.id || prevWizardData.selectedFieldId,
  };
};

/**
 * Loads farm and field data for edit mode
 * @param {string} farmId - ID of the farm to load
 * @returns {Promise<Object|null>} Object with farm and farmFields, or null if not found
 */
export const loadFarmForEdit = async (farmId) => {
  if (!farmId) return null;
  
  try {
    const res = await locationService.getLocations();
    const all = res.data || [];
    const farm = all.find((loc) => loc._id === farmId);
    if (!farm) return null;

    const farmFields = all.filter(
      (loc) => String(loc.parentId) === String(farmId) && loc.type === "Field"
    );

    return { farm, farmFields };
  } catch (err) {
    console.error("Failed to load farm for edit", err);
    return null;
  }
};

/**
 * Checks if wizard is in edit mode
 * @param {Object} wizardData - Current wizard state
 * @returns {boolean} True if in edit mode
 */
export const isEditMode = (wizardData) => {
  return !!wizardData.farmBoundaries?._id;
};

/**
 * Checks if wizard has existing fields
 * @param {Object} wizardData - Current wizard state
 * @returns {boolean} True if fields exist
 */
export const hasExistingFields = (wizardData) => {
  return wizardData.fieldsData?.features?.length > 0;
};

