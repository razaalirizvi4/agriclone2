// src/utils/wizardPayloadBuilder.js

/**
 * Builds the farm payload for API submission
 * @param {Object} wizardData - The wizard state data
 * @param {Function} getSessionOwner - Function to get the current session owner
 * @returns {Object} Farm payload object
 * @throws {Error} If farm information is incomplete
 */
export const buildFarmPayload = (wizardData, getSessionOwner) => {
  if (!wizardData.farmBoundaries) {
    throw new Error("Farm information is incomplete.");
  }

  const owner = getSessionOwner() || wizardData.farmBoundaries.owner || null;

  const attributes = {
    ...wizardData.farmBoundaries.attributes,
  };

  if (!attributes.geoJsonCords && wizardData.farmBoundaries.geoJsonCords) {
    attributes.geoJsonCords = wizardData.farmBoundaries.geoJsonCords;
  }

  return {
    ...wizardData.farmBoundaries,
    type: wizardData.farmBoundaries.type || "Farm",
    owner,
    attributes,
  };
};

/**
 * Builds field payloads for API submission
 * Converts wizard field data structure to API format
 * @param {Object} wizardData - The wizard state data
 * @param {Object} farmPayload - The farm payload (needed for parentId)
 * @param {Function} getSessionOwner - Function to get the current session owner
 * @returns {Array} Array of field payload objects
 * @throws {Error} If no fields exist
 */
export const buildFieldPayloads = (wizardData, farmPayload, getSessionOwner) => {
  const features = wizardData.fieldsData?.features || [];
  const sessionOwner = getSessionOwner();

  if (!features.length) {
    throw new Error("Please create at least one field before submitting.");
  }

  return features.map((feature, index) => {
    const fieldInfo =
      wizardData.fieldsInfo.find(
        (info) => info.id === feature.properties?.id
      ) || {};

    const {
      id,
      _id,
      name,
      area,
      fieldEventsInfo,
      parentId,
      ...fieldAttributes
    } = fieldInfo;

    const filteredAttributes = Object.keys(fieldAttributes).reduce(
      (acc, key) => {
        if (
          ![
            "attributes",
            "geoJsonCords",
            "geometry",
            "owner",
            "type",
            "typeId",
          ].includes(key) &&
          fieldAttributes[key] !== undefined &&
          fieldAttributes[key] !== null
        ) {
          acc[key] = fieldAttributes[key];
        }
        return acc;
      },
      {}
    );

    // Ensure crop_id is included in attributes (it might be in fieldInfo directly or in attributes)
    const crop_id = fieldInfo.crop_id || fieldInfo.attributes?.crop_id || filteredAttributes.crop_id;
    
    const attributes = {
      ...feature.properties?.attributes,
      ...filteredAttributes,
      area: area || feature.properties?.area || "",
      ...(crop_id && { crop_id }), // Include crop_id if it exists
      geoJsonCords: {
        type: "FeatureCollection",
        features: [
          {
            type: feature.type,
            properties: { ...feature.properties },
            geometry: feature.geometry,
          },
        ],
      },
    };
    

    const fieldPayload = {
      type: "Field",
      name: name || feature.properties?.name || `Field ${index + 1}`,
      parentId: parentId || farmPayload?._id || null,
      owner: sessionOwner || farmPayload?.owner || null,
      attributes,
    };

    if (fieldEventsInfo) {
      fieldPayload.fieldEventsInfo = fieldEventsInfo;
    }

    if (_id) {
      fieldPayload._id = _id;
    }

    return fieldPayload;
  });
};

/**
 * Builds the complete wizard payload (farm + fields)
 * @param {Object} wizardData - The wizard state data
 * @param {Function} getSessionOwner - Function to get the current session owner
 * @returns {Array} Array containing farm payload followed by field payloads
 */
export const buildWizardPayload = (wizardData, getSessionOwner) => {
  const farmPayload = buildFarmPayload(wizardData, getSessionOwner);
  const fieldPayloads = buildFieldPayloads(wizardData, farmPayload, getSessionOwner);

  return [farmPayload, ...fieldPayloads];
};

