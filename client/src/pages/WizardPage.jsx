// src/pages/WizardPage.js
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import locationService from "../services/location.service";
import * as turf from "@turf/turf";
import {
  loadFarmForEdit,
  prepareWizardDataForEdit,
  isEditMode,
  hasExistingFields,
  storeFarmGeoJsonCoords,
  moveFieldsIntoFarmBoundary,
} from "../utils/wizardEditMode";
import { buildWizardPayload } from "../utils/wizardPayloadBuilder";
import './wizard.css'
import { toast } from "react-toastify";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Retrieves the current session owner from localStorage
 * @returns {Object|null} Owner object with id, email, and name, or null if not found
 */
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WizardPage = () => {
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================
  const location = useLocation();
  const farmId = location.state?.farmId || null;
  
  // Helper function to get localStorage key for wizard data
  const getWizardStorageKey = () => {
    const owner = getSessionOwner();
    return owner?.id ? `wizardData_${owner.id}` : 'wizardData';
  };

  // Helper function to load wizard data from localStorage
  const loadWizardDataFromStorage = () => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const stored = localStorage.getItem(getWizardStorageKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load wizard data from storage:", error);
    }
    return null;
  };

  // Helper function to save wizard data to localStorage
  const saveWizardDataToStorage = (data) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(getWizardStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save wizard data to storage:", error);
    }
  };

  // Initialize state - try to restore from localStorage if not in edit mode
  const initialWizardData = (() => {
    if (farmId) {
      // Edit mode - don't restore from storage
      return {
        farmDetails: null,
        farmLocation: null,
        farmArea: "0 acres",
        farmBoundaries: null,
        numberOfFields: null,
        fieldsData: { type: "FeatureCollection", features: [] },
        fieldsInfo: [],
        selectedFieldId: null
      };
    }
    // New wizard - try to restore from storage
    const stored = loadWizardDataFromStorage();
    if (stored) {
      return stored;
    }
    return {
      farmDetails: null,
      farmLocation: null,
      farmArea: "0 acres",
      farmBoundaries: null,
      numberOfFields: null,
      fieldsData: { type: "FeatureCollection", features: [] },
      fieldsInfo: [],
      selectedFieldId: null
    };
  })();
  
  const [wizardData, setWizardData] = useState(initialWizardData);
  const [isSavingWizard, setIsSavingWizard] = useState(false);

  // Save wizard data to localStorage whenever it changes (but not in edit mode)
  useEffect(() => {
    if (!farmId && wizardData) {
      saveWizardDataToStorage(wizardData);
    }
  }, [wizardData, farmId]);

  // ============================================================================
  // DATA LOADING (Edit Mode)
  // ============================================================================

  /**
   * Loads farm and field data when editing an existing farm
   * Edit mode functionality has been moved to utils/wizardEditMode.js
   */
  useEffect(() => {
    const loadFarmData = async () => {
      const result = await loadFarmForEdit(farmId);
      if (result) {
        const { farm, farmFields } = result;
        setWizardData((prev) => prepareWizardDataForEdit(farm, farmFields, prev));
      }
    };

    if (farmId) {
      loadFarmData();
    }
  }, [farmId]);

  // ============================================================================
  // FARM HANDLERS
  // ============================================================================

  /**
   * Handles farm details form submission
   * Preserves existing data in edit mode, creates new structure for new farms
   * @param {Object} farmDetails - Form data from FarmDetailsForm
   */
  const handleFarmDetailsSubmit = (farmDetails) => {
    const ownerFromSession = getSessionOwner();
    
    setWizardData((prev) => {
      // Check if we're in edit mode (has existing farmBoundaries with _id)
      const editMode = isEditMode(prev);
      
      if (editMode) {
        // Preserve existing farmBoundaries structure and _id when editing
        // Extract area and size from farmDetails to prevent them from overwriting map-calculated values
        const { area: areaFromForm, size: sizeFromForm, ...otherFarmDetails } = farmDetails;
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
              ...otherFarmDetails, // Merge form details into attributes (excluding area/size)
              // ALWAYS preserve area from map updates - never use area from form in edit mode
              area: prev.farmBoundaries.attributes?.area || prev.farmArea || "0 acres",
              // Preserve existing size, or use from form if it doesn't exist yet
              size: prev.farmBoundaries.attributes?.size ?? sizeFromForm,
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

  /**
   * Updates farm location coordinates
   * @param {Object} location - Location coordinates object
   */
  const handleLocationUpdate = (location) => {
    setWizardData((prev) => ({
      ...prev,
      farmLocation: location,
    }));
  };

  /**
   * Updates farm area when boundary is drawn/modified
   * Also stores farm geoJSON coordinates and moves fields if in edit mode
   * @param {string} area - Area string (e.g., "25.5 acres")
   * @param {Object} centerCoordinates - Center coordinates {lat, lng}
   * @param {Object} feature - GeoJSON Feature object representing the farm boundary
   */
  const updateFarmArea = (area, centerCoordinates = null, feature = null) => {
    setWizardData((prev) => {
      const editMode = isEditMode(prev);
      const existingFields = hasExistingFields(prev);
      
      // If we have a feature, store the geoJSON coordinates
      let updatedData = prev;
      if (feature && editMode) {
        // IMPORTANT: Get old farm boundary BEFORE storing the new one
        const oldFarmGeoJson = prev.farmBoundaries?.attributes?.geoJsonCords;
        const oldFarmFeature = oldFarmGeoJson?.features?.[0];
        
        // Store farm geoJSON coordinates (propagates through field wizard page)
        updatedData = storeFarmGeoJsonCoords(prev, feature, area, centerCoordinates);
        
        // If fields exist, automatically move them into the new farm boundary
        // Pass the old boundary so it can calculate the transformation
        if (existingFields && oldFarmFeature) {
          updatedData = moveFieldsIntoFarmBoundary(updatedData, feature, oldFarmFeature);
        }
      } else if (feature) {
        // For new farms, just store the coordinates
        updatedData = storeFarmGeoJsonCoords(prev, feature, area, centerCoordinates);
      } else {
        // Fallback: just update area if no feature provided
        updatedData = {
          ...prev,
          farmArea: area,
        };
      }
      
      return updatedData;
    });
  };

  // ============================================================================
  // FIELD HANDLERS
  // ============================================================================

  /**
   * Handles field selection in the UI
   * @param {string} fieldId - ID of the selected field
   */
  const handleFieldSelect = (fieldId) => {
    setWizardData((prev) => ({
      ...prev,
      selectedFieldId: fieldId,
    }));
  };

  /**
   * Updates field information (attributes, crop, etc.)
   * Updates both fieldsInfo array and fieldsData FeatureCollection
   * @param {string} fieldId - ID of the field to update
   * @param {Object} fieldData - Field data to merge
   */
  const handleFieldInfoUpdate = (fieldId, fieldData) => {
    setWizardData((prev) => {
      const existingFieldIndex = prev.fieldsInfo.findIndex(
        (f) => f.id === fieldId
      );
      let updatedFieldsInfo;
      let updatedFieldsData = prev.fieldsData;

      // Update existing field or add new one
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

  /**
   * Updates field geometry (polygon shape) and area
   * @param {string} fieldId - ID of the field to update
   * @param {Object} geometry - GeoJSON geometry object
   * @param {string} area - Updated area string
   */
  const handleFieldGeometryUpdate = (fieldId, geometry, area) => {
    setWizardData((prev) => {
      if (!prev.fieldsData?.features?.length) {
        return prev;
      }

      const updatedFieldsData = {
        ...prev.fieldsData,
        features: prev.fieldsData.features.map((feature) =>
          feature.properties?.id === fieldId
            ? {
                ...feature,
                geometry,
                properties: {
                  ...feature.properties,
                  area: area || feature.properties?.area,
                },
              }
            : feature
        ),
      };

      const updatedFieldsInfo = prev.fieldsInfo.map((info) =>
        info.id === fieldId ? { ...info, area: area || info.area } : info
      );

      return {
        ...prev,
        fieldsData: updatedFieldsData,
        fieldsInfo: updatedFieldsInfo,
      };
    });
  };

  /**
   * Replaces the farm boundary from an imported GeoJSON feature
   * Calculates area/center and keeps downstream state in sync
   * @param {Object} farmFeature - GeoJSON Feature for the farm boundary
   */
  const handleFarmBoundaryImport = (farmFeature) => {
    if (!farmFeature?.geometry) {
      console.warn("handleFarmBoundaryImport: Missing geometry");
      return;
    }

    try {
      const areaAcres = turf.area(farmFeature) / 4046.8564224;
      const roundedArea = Math.max(0, Math.round(areaAcres * 100) / 100);
      const areaLabel = `${roundedArea.toFixed(2)} acres`;
      const centerPoint = turf.center(farmFeature);
      const centerCoordinates = {
        lat: centerPoint.geometry.coordinates[1],
        lng: centerPoint.geometry.coordinates[0],
      };

      const normalizedFeature = {
        ...farmFeature,
        properties: {
          ...(farmFeature.properties || {}),
          type: "farm",
          id:
            farmFeature.properties?.id ||
            farmFeature.id ||
            wizardData.farmBoundaries?._id ||
            "farm-boundary",
          name:
            wizardData.farmDetails?.name ||
            farmFeature.properties?.name ||
            "Farm",
          area: areaLabel,
        },
      };

      setWizardData((prev) =>
        storeFarmGeoJsonCoords(prev, normalizedFeature, areaLabel, centerCoordinates)
      );
    } catch (error) {
      console.error("Failed to import farm boundary:", error);
      toast.error("Could not import the farm boundary. Please check the file format.");
    }
  };

  /**
   * Replaces fields data from an imported GeoJSON FeatureCollection
   * @param {Object} fieldsData - FeatureCollection containing fields
   * @param {Array} fieldsInfo - Optional array of field info objects
   */
  const handleFieldsImport = (fieldsData, fieldsInfo = []) => {
    if (!fieldsData?.features?.length) {
      console.warn("handleFieldsImport: No field features provided");
      return;
    }

    setWizardData((prev) => ({
      ...prev,
      fieldsData,
      fieldsInfo: fieldsInfo.length ? fieldsInfo : prev.fieldsInfo,
      selectedFieldId:
        fieldsInfo?.[0]?.id ||
        fieldsData.features?.[0]?.properties?.id ||
        prev.selectedFieldId,
    }));
  };

  // ============================================================================
  // WIZARD COMPLETION
  // ============================================================================

  /**
   * Handles wizard completion and API submission
   * Saves farm and fields data, marks wizard as completed
   * Payload building functions have been moved to utils/wizardPayloadBuilder.js
   * @returns {Promise<Object>} API response
   */
  const handleWizardComplete = async () => {
    if (isSavingWizard) {
      return;
    }

    try {
      const payload = buildWizardPayload(wizardData, getSessionOwner);

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
        // Clear wizard data from storage since it's been saved
        localStorage.removeItem(getWizardStorageKey());
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
      toast.error(message);
      throw error; // Re-throw so ReviewPage can handle it
    } finally {
      setIsSavingWizard(false);
    }
  };

  // ============================================================================
  // GEOMETRY UTILITIES
  // ============================================================================

  /**
   * Creates a default square polygon based on center coordinates and size
   * Used for initial farm boundary creation
   * @param {Array<number>} center - [longitude, latitude] center coordinates
   * @param {number} sizeInAcres - Size of the square in acres
   * @returns {Object} GeoJSON Feature object with square polygon
   */
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

  /**
   * Creates default square and updates wizard state
   * Handles edit mode by preserving existing farmBoundaries structure
   * @param {Array<number>} center - [longitude, latitude] center coordinates
   * @param {number} sizeInAcres - Size of the square in acres
   * @returns {Object} FeatureCollection with the square feature
   */
  const handleCreateDefaultSquare = (center, sizeInAcres) => {
    const defaultSquare = createDefaultSquare(center, sizeInAcres);

    const featureCollection = {
      type: "FeatureCollection",
      features: [defaultSquare],
    };

    // Update wizard data with the default square
    setWizardData((prev) => {
      const editMode = isEditMode(prev);
      
      if (editMode) {
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

  // ============================================================================
  // FIELD DIVISION HANDLER
  // ============================================================================

  /**
   * Handles field division completion from FarmDrawPage
   * Preserves existing fields in edit mode, creates new fields for new farms
   * @param {Object} completeData - Object containing farmBoundaries, fieldsData, fieldsInfo, numberOfFields, centerCoordinates
   */
  const handleFieldDivisionComplete = (completeData) => {
    const { farmBoundaries, fieldsData, fieldsInfo, numberOfFields } =
      completeData;

    setWizardData((prev) => {
      // Check if we're in edit mode and already have fields
      const editMode = isEditMode(prev);
      const existingFields = hasExistingFields(prev);

      // If editing and fields already exist, merge regenerated geometries while preserving existing data
      if (editMode && existingFields) {
        const existingCount = prev.fieldsData?.features?.length || 0;
        const desiredCount =
          numberOfFields || prev.numberOfFields || existingCount;
        const incomingFeatures = fieldsData?.features || [];
        const incomingInfo = fieldsInfo || [];

        // Guard: if generation did not produce enough fields, keep previous state
        if (incomingFeatures.length < desiredCount) {
          console.warn(
            "Incoming generated fields less than desired; keeping previous fields"
          );
          return prev;
        }

        // Merge: use regenerated geometries for all fields, preserve existing metadata for first N
        const mergedFeatures = incomingFeatures.map((incomingFeature, idx) => {
          if (idx < existingCount) {
            const existingFeature = prev.fieldsData.features[idx];
            const mergedProperties = {
              ...incomingFeature.properties,
              ...existingFeature.properties,
              id: existingFeature.properties?.id,
              name: existingFeature.properties?.name,
              area:
                incomingFeature.properties?.area ||
                existingFeature.properties?.area,
            };
            return {
              ...incomingFeature,
              properties: mergedProperties,
            };
          }
          return incomingFeature; // New fields stay with generated defaults (blank data)
        });

        // Merge fieldsInfo: keep existing entries, append new ones for new fields
        const mergedInfo = [];
        for (let i = 0; i < desiredCount; i += 1) {
          if (i < existingCount && prev.fieldsInfo[i]) {
            const incoming = incomingInfo[i] || {};
            mergedInfo.push({
              ...incoming,
              ...prev.fieldsInfo[i],
              id: prev.fieldsInfo[i].id,
              name: prev.fieldsInfo[i].name,
              area: incoming.area || prev.fieldsInfo[i].area,
            });
          } else if (incomingInfo[i]) {
            mergedInfo.push(incomingInfo[i]);
          }
        }

        console.log(
          "Edit mode: Regenerated geometries, preserved existing field data, added new blank fields",
          { existingCount, desiredCount }
        );

        return {
          ...prev,
          // Update farmBoundaries but preserve _id
          farmBoundaries: {
            ...prev.farmBoundaries,
            attributes: {
              ...prev.farmBoundaries.attributes,
              geoJsonCords:
                farmBoundaries ||
                prev.farmBoundaries.attributes?.geoJsonCords,
              // Use prev.farmArea (from state) instead of wizardData.farmArea (from closure)
              area:
                prev.farmArea ||
                prev.farmBoundaries.attributes?.area,
              lat:
                completeData.centerCoordinates?.lat ||
                prev.farmBoundaries.attributes?.lat ||
                0,
              lon:
                completeData.centerCoordinates?.lng ||
                prev.farmBoundaries.attributes?.lon ||
                0,
            },
          },
          fieldsData: {
            ...prev.fieldsData,
            features: mergedFeatures,
          },
          fieldsInfo: mergedInfo,
          numberOfFields: desiredCount,
          selectedFieldId:
            prev.selectedFieldId ||
            mergedFeatures[0]?.properties?.id ||
            null,
        };
      }

      // New farm or regenerating fields - use the new data
      const farmDetails = prev.farmDetails || {};
      const farmData = {
        type: "Farm",
        name: farmDetails.name || "Unnamed Farm",
        owner: getSessionOwner(),
        attributes: {
          // Dynamic form attributes (e.g. address, size, numberOfFields, etc.)
          ...farmDetails,
          // Core attributes used by map / weather
          // Use prev.farmArea (from state) instead of wizardData.farmArea (from closure)
          area: prev.farmArea || prev.farmBoundaries?.attributes?.area || "0 acres",
          lat: completeData.centerCoordinates?.lat || 0,
          lon: completeData.centerCoordinates?.lng || 0,
          geoJsonCords: farmBoundaries,
          crop_id: null,
          lifecycle: "Active",
        },
      };

      // Preserve _id if editing
      if (editMode && prev.farmBoundaries?._id) {
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
  };

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================

  return (
    <Outlet context={{
      wizardData,
      onFarmDetailsSubmit: handleFarmDetailsSubmit,
      onLocationUpdate: handleLocationUpdate,
      updateFarmArea: updateFarmArea,
      onFieldSelect: handleFieldSelect,
      onFieldInfoUpdate: handleFieldInfoUpdate,
      onWizardComplete: handleWizardComplete,
      onCreateDefaultSquare: handleCreateDefaultSquare,
      onFieldDivisionComplete: handleFieldDivisionComplete,
      onFieldGeometryUpdate: handleFieldGeometryUpdate,
      onImportFarmBoundary: handleFarmBoundaryImport,
      onImportFieldsData: handleFieldsImport,
      isSavingWizard
    }} />
  );
};

export default WizardPage;
