// src/pages/WizardPage.js
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import locationService from "../services/location.service";
import './wizard.css'

const getSessionOwner = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser);
    const id =
      parsedUser?._id ||
      parsedUser?.id ||
      parsedUser?.userId ||
      parsedUser?.user?._id;

    const owner = {
      email: parsedUser?.email || parsedUser?.user?.email || "",
      name: parsedUser?.name || parsedUser?.user?.name || "Farm Owner",
    };

    if (id && typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      owner.id = id;
    }

    return owner;
  } catch {
    return null;
  }
};

const WizardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const farmId = location.state?.farmId || null;
  const [wizardData, setWizardData] = useState({
    farmDetails: null,
    farmLocation: null,
    farmArea: "0 acres",
    farmBoundaries: null,
    numberOfFields: null,
    fieldsData: { type: "FeatureCollection", features: [] },
    fieldsInfo: [],
    selectedFieldId: null
  });
  const [isSavingWizard, setIsSavingWizard] = useState(false);

  // If we came from "Edit Farm in Wizard", prefill farm details for editing
  useEffect(() => {
    const loadFarmForEdit = async () => {
      if (!farmId) return;
      try {
        const res = await locationService.getLocations();
        const all = res.data || [];
        const farm = all.find((loc) => loc._id === farmId);
        if (!farm) return;

        const farmAttributes = farm.attributes || {};
        const farmFields = all.filter(
          (loc) => String(loc.parentId) === String(farmId) && loc.type === "Field"
        );
        const farmFieldsCount = farmFields.length;

        // Convert farmFields to fieldsData (FeatureCollection format)
        // Match the structure used by processFarmDivision (line 121-132 in fieldDivision.js)
        const fieldsDataFeatures = farmFields.map((field) => {
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
              farm: farm.name || "Farm",
              crop_id: fieldAttributes.crop_id || null,
            },
            geometry: geometry,
          };
        }).filter((feature) => feature !== null); // Filter out null entries

        // Convert farmFields to fieldsInfo array
        // Match the structure used by createFieldsInfo (line 248-253 in fieldDivision.js)
        const fieldsInfo = farmFields.map((field) => {
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

        setWizardData((prev) => {
          const existingDetails = prev.farmDetails || {};
          console.log("Existing details attributes:", existingDetails);
          console.log("Loaded farm fields:", farmFields);
          console.log("Converted fieldsData features:", fieldsDataFeatures);
          console.log("Converted fieldsInfo:", fieldsInfo);

          return {
            ...prev,
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
                  prev.numberOfFields ||
                  (prev.fieldsInfo?.length || 1)),
              // Also keep numeric numberOfFields in wizard state for later steps
              numberOfFields:
                prev.numberOfFields ||
                farmAttributes.numberOfFields ||
                farmAttributes.fields ||
                farmFieldsCount ||
                (prev.fieldsInfo?.length || 1),
            },
            farmArea: farmAttributes.area || prev.farmArea,
            farmBoundaries: {
              ...farm,
              type: "Farm",
              attributes: {
                ...farmAttributes,
                geoJsonCords:
                  farmAttributes.geoJsonCords || farmAttributes.geoJsonCords,
              },
            },
            // Populate fields data
            fieldsData: {
              type: "FeatureCollection",
              features: fieldsDataFeatures,
            },
            fieldsInfo: fieldsInfo,
            selectedFieldId: fieldsInfo[0]?.id || prev.selectedFieldId,
          };
        });
      } catch (err) {
        console.error("Failed to load farm for edit", err);
      }
    };

    loadFarmForEdit();
  }, [farmId]);

  // Handle farm details form submission
  const handleFarmDetailsSubmit = (farmDetails) => {
    const ownerFromSession = getSessionOwner();
    
    setWizardData((prev) => {
      // Check if we're in edit mode (has existing farmBoundaries with _id)
      const isEditMode = prev.farmBoundaries?._id;
      
      if (isEditMode) {
        // Preserve existing farmBoundaries structure and _id when editing
        return {
          ...prev,
          farmDetails: {
            ...prev.farmDetails,
            ...farmDetails,
          },
          numberOfFields: parseInt(farmDetails.numberOfFields) || prev.numberOfFields || 1,
          farmBoundaries: {
            ...prev.farmBoundaries,
            name: farmDetails.name || prev.farmBoundaries.name,
            attributes: {
              ...prev.farmBoundaries.attributes,
              ...farmDetails, // Merge form details into attributes
            },
          },
          // Preserve existing fields data when editing
          fieldsData: prev.fieldsData || { type: "FeatureCollection", features: [] },
          fieldsInfo: prev.fieldsInfo || [],
        };
      } else {
        // New farm - create initial structure
        const initialFarmData = {
          type: "Farm",
          name: farmDetails.name || "Unnamed Farm",
          owner: ownerFromSession,
          attributes: {
            area: "0 acres", // Initial area before polygon is created
            lat: 0,
            lon: 0,
            geoJsonCords: {
              type: "FeatureCollection",
              features: [],
            },
            crop_id: null,
            lifecycle: "Active",
          },
        };

        return {
          ...prev,
          farmDetails,
          numberOfFields: parseInt(farmDetails.numberOfFields) || 1,
          farmBoundaries: initialFarmData,
        };
      }
    });
  };

  // Handle farm location coordinates
  const handleLocationUpdate = (location) => {
    setWizardData((prev) => ({
      ...prev,
      farmLocation: location,
    }));
  };

  // Function to update area
  const updateFarmArea = (area) => {
    setWizardData((prev) => ({
      ...prev,
      farmArea: area,
    }));
  };

  // Handle field selection
  const handleFieldSelect = (fieldId) => {
    setWizardData((prev) => ({
      ...prev,
      selectedFieldId: fieldId,
    }));
  };

  // Handle field info updates
  const handleFieldInfoUpdate = (fieldId, fieldData) => {
    setWizardData((prev) => {
      const existingFieldIndex = prev.fieldsInfo.findIndex(
        (f) => f.id === fieldId
      );
      let updatedFieldsInfo;
      let updatedFieldsData = prev.fieldsData;

      if (existingFieldIndex >= 0) {
        updatedFieldsInfo = [...prev.fieldsInfo];
        updatedFieldsInfo[existingFieldIndex] = {
          ...updatedFieldsInfo[existingFieldIndex],
          ...fieldData,
        };
      } else {
        updatedFieldsInfo = [
          ...prev.fieldsInfo,
          {
            id: fieldId,
            name: `Field ${prev.fieldsInfo.length + 1}`,
            area: "0 acres",
            ...fieldData,
          },
        ];
      }

      // Also merge these details into the corresponding feature in fieldsData
      if (prev.fieldsData?.features?.length) {
        updatedFieldsData = {
          ...prev.fieldsData,
          features: prev.fieldsData.features.map((feature) => {
            if (feature.properties?.id !== fieldId) return feature;

            const existingAttributes = feature.properties?.attributes || {};

            return {
              ...feature,
              properties: {
                ...feature.properties,
                attributes: {
                  ...existingAttributes,
                  ...fieldData,
                },
              },
            };
          }),
        };
      }

      return {
        ...prev,
        fieldsInfo: updatedFieldsInfo,
        fieldsData: updatedFieldsData,
      };
    });
  };

  const handleFieldGeometryUpdate = (fieldId, geometry, area) => {
    setWizardData((prev) => {
      if (!prev.fieldsData?.features?.length) {
        return prev;
      }

      const updatedFieldsData = {
        ...prev.fieldsData,
        features: prev.fieldsData.features.map((feature) => {
          if (feature.properties?.id === fieldId) {
            // Store initial area if not already stored
            const initialArea =
              feature.properties?.initialArea || feature.properties?.area;

            return {
              ...feature,
              geometry,
              properties: {
                ...feature.properties,
                area: area || feature.properties?.area,
                initialArea: initialArea, // Preserve initial area
              },
            };
          }
          return feature;
        }),
      };

      const updatedFieldsInfo = prev.fieldsInfo.map((info) => {
        if (info.id === fieldId) {
          // Store initial area if not already stored
          const initialArea = info.initialArea || info.area;
          return {
            ...info,
            area: area || info.area,
            initialArea: initialArea, // Preserve initial area
          };
        }
        return info;
      });

      return {
        ...prev,
        fieldsData: updatedFieldsData,
        fieldsInfo: updatedFieldsInfo,
      };
    });
  };

  // Handle adding new field geometry
  const handleAddField = (fieldGeometry, area) => {
    const fieldId = `field-${Date.now()}`;
    const areaStr = `${area} acres`;
    const newField = {
      type: "Feature",
      properties: {
        id: fieldId,
        type: "field",
        name: `Field ${wizardData.fieldsData.features.length + 1}`,
        area: areaStr,
        initialArea: areaStr, // Store initial area when field is created
        farm: wizardData.farmDetails?.name || "Farm",
      },
      geometry: fieldGeometry,
    };

    setWizardData((prev) => ({
      ...prev,
      fieldsData: {
        ...prev.fieldsData,
        features: [...prev.fieldsData.features, newField],
      },
      fieldsInfo: [
        ...prev.fieldsInfo,
        {
          id: fieldId,
          name: `Field ${prev.fieldsData.features.length + 1}`,
          area: areaStr,
          initialArea: areaStr, // Store initial area when field is created
        },
      ],
      selectedFieldId: fieldId,
    }));

    return fieldId;
  };

  // Handle wizard completion
  const buildFarmPayload = () => {
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

  const buildFieldPayloads = (farmPayload) => {
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

  const buildWizardPayload = () => {
    const farmPayload = buildFarmPayload();
    const fieldPayloads = buildFieldPayloads(farmPayload);

    return [farmPayload, ...fieldPayloads];
  };

  const handleWizardComplete = async () => {
    if (isSavingWizard) {
      return;
    }

    try {
      const payload = buildWizardPayload();

      setIsSavingWizard(true);

      const response = await locationService.farmWizard(payload);

      setWizardData((prev) => ({
        ...prev,
        savedLocations: response.data,
      }));

      // Mark wizard as completed for this user
      const owner = getSessionOwner();
      const ownerId = owner?.id;
      if (ownerId && typeof window !== "undefined") {
        const wizardKey = `farmWizardCompleted_${ownerId}`;
        localStorage.setItem(wizardKey, "true");
      }

      // Return response so ReviewPage can create events
      // NOTE: Don't navigate here - let ReviewPage handle navigation after events are created
      return response;
    } catch (error) {
      console.error("Failed to complete farm wizard:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Farm registration failed. Please try again.";
      alert(message);
      throw error; // Re-throw so ReviewPage can handle it
    } finally {
      setIsSavingWizard(false);
    }
  };

  // Create default square polygon
  const createDefaultSquare = (center, sizeInAcres) => {
    // Convert acres to square meters
    const areaSqMeters = sizeInAcres * 4046.8564224;

    // Calculate side length for a square (in meters)
    const sideLengthMeters = Math.sqrt(areaSqMeters);

    // Convert meters to degrees (approximate)
    const lat = center[1];
    const metersPerDegreeLat = 111320; // meters per degree latitude
    const metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180); // meters per degree longitude

    const deltaLat = sideLengthMeters / (2 * metersPerDegreeLat);
    const deltaLng = sideLengthMeters / (2 * metersPerDegreeLng);

    // Create square coordinates
    const coordinates = [
      [
        [center[0] - deltaLng, center[1] - deltaLat], // southwest
        [center[0] + deltaLng, center[1] - deltaLat], // southeast
        [center[0] + deltaLng, center[1] + deltaLat], // northeast
        [center[0] - deltaLng, center[1] + deltaLat], // northwest
        [center[0] - deltaLng, center[1] - deltaLat], // close polygon
      ],
    ];

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      },
      properties: {
        type: "farm",
        name: "Farm Boundary",
        area: `${sizeInAcres} acres`,
      },
    };
  };

  // Create default square and return feature collection
  const handleCreateDefaultSquare = (center, sizeInAcres) => {
    const defaultSquare = createDefaultSquare(center, sizeInAcres);

    const featureCollection = {
      type: "FeatureCollection",
      features: [defaultSquare],
    };

    // Update wizard data with the default square
    setWizardData((prev) => {
      const isEditMode = prev.farmBoundaries?._id;
      
      if (isEditMode) {
        // Preserve existing farmBoundaries structure and _id when editing
        return {
          ...prev,
          farmBoundaries: {
            ...prev.farmBoundaries,
            attributes: {
              ...prev.farmBoundaries.attributes,
              geoJsonCords: featureCollection,
            },
          },
        };
      } else {
        // New farm - use feature collection directly
        return {
          ...prev,
          farmBoundaries: featureCollection,
        };
      }
    });

    return featureCollection;
  };

  // farm division utility
  const handleFieldDivisionComplete = (completeData) => {
    const { farmBoundaries, fieldsData, fieldsInfo, numberOfFields } =
      completeData;

    // Store initial areas for fields created through division
    const fieldsDataWithInitialAreas = {
      ...fieldsData,
      features: fieldsData.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          initialArea:
            feature.properties?.area || feature.properties?.initialArea,
        },
      })),
    };

    const fieldsInfoWithInitialAreas = fieldsInfo.map((info) => ({
      ...info,
      initialArea: info.area || info.initialArea,
    }));

    // Prepare the final farm data
    const farmData = {
      type: "Farm",
      name: wizardData.farmDetails?.name || "Unnamed Farm",
      owner: getSessionOwner(),
      attributes: {
        area: wizardData.farmArea,
        lat: completeData.centerCoordinates?.lat || 0,
        lon: completeData.centerCoordinates?.lng || 0,
        geoJsonCords: farmBoundaries,
        crop_id: null,
        lifecycle: "Active",
      },
    };
    setWizardData((prev) => {
      // Check if we're in edit mode and already have fields
      const isEditMode = prev.farmBoundaries?._id;
      const hasExistingFields = prev.fieldsData?.features?.length > 0;

      // If editing and fields already exist, preserve them instead of overwriting
      if (isEditMode && hasExistingFields) {
        console.log("Edit mode: Preserving existing fields instead of regenerating");
        return {
          ...prev,
          // Only update farmBoundaries if needed, but preserve _id
          farmBoundaries: {
            ...prev.farmBoundaries,
            attributes: {
              ...prev.farmBoundaries.attributes,
              geoJsonCords: farmBoundaries || prev.farmBoundaries.attributes?.geoJsonCords,
              area: wizardData.farmArea || prev.farmBoundaries.attributes?.area,
              lat: completeData.centerCoordinates?.lat || prev.farmBoundaries.attributes?.lat || 0,
              lon: completeData.centerCoordinates?.lng || prev.farmBoundaries.attributes?.lon || 0,
            },
          },
          // Preserve existing fields data
          fieldsData: prev.fieldsData,
          fieldsInfo: prev.fieldsInfo,
          numberOfFields: prev.numberOfFields || numberOfFields,
          selectedFieldId: prev.selectedFieldId || prev.fieldsData.features[0]?.properties?.id || null,
        };
      }

      // New farm or regenerating fields - use the new data
      const farmDetails = wizardData.farmDetails || {};
      const farmData = {
        type: "Farm",
        name: farmDetails.name || "Unnamed Farm",
        owner: getSessionOwner(),
        attributes: {
          // Dynamic form attributes (e.g. address, size, numberOfFields, etc.)
          ...farmDetails,
          // Core attributes used by map / weather
          area: wizardData.farmArea,
          lat: completeData.centerCoordinates?.lat || 0,
          lon: completeData.centerCoordinates?.lng || 0,
          geoJsonCords: farmBoundaries,
          crop_id: null,
          lifecycle: "Active",
        },
      };

      // Preserve _id if editing
      if (isEditMode && prev.farmBoundaries?._id) {
        farmData._id = prev.farmBoundaries._id;
      }

      return {
        ...prev,
        farmBoundaries: farmData,
        fieldsData,
        fieldsInfo,
        numberOfFields: numberOfFields || prev.numberOfFields,
        selectedFieldId: fieldsData.features[0]?.properties?.id || null,
      };
    });
    setWizardData((prev) => ({
      ...prev,
      farmBoundaries: farmData,
      fieldsData: fieldsDataWithInitialAreas,
      fieldsInfo: fieldsInfoWithInitialAreas,
      numberOfFields: numberOfFields || prev.numberOfFields,
      selectedFieldId: fieldsData.features[0]?.properties?.id || null,
    }));
  };

  return (
    <Outlet context={{
        wizardData,
        onFarmDetailsSubmit: handleFarmDetailsSubmit,
        onLocationUpdate: handleLocationUpdate,
        updateFarmArea: updateFarmArea,
        onFieldSelect: handleFieldSelect,
        onFieldInfoUpdate: handleFieldInfoUpdate,
      onAddField: handleAddField,   // TODO: Remove this
        onWizardComplete: handleWizardComplete,
        onCreateDefaultSquare: handleCreateDefaultSquare,
        onFieldDivisionComplete: handleFieldDivisionComplete,
        onFieldGeometryUpdate: handleFieldGeometryUpdate,
      isSavingWizard
    }} />
  );
};

export default WizardPage;
