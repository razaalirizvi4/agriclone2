// src/pages/WizardPage.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import locationService from "../services/location.service";

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

  // Handle farm details form submission
  const handleFarmDetailsSubmit = (farmDetails) => {
    const ownerFromSession = getSessionOwner();
    // Prepare initial farm data for API
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

    setWizardData((prev) => ({
      ...prev,
      farmDetails,
      numberOfFields: parseInt(farmDetails.numberOfFields) || 1, // Store numberOfFields from form
      farmBoundaries: initialFarmData, // Store the API data structure
    }));
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

  // Handle adding new field geometry
  const handleAddField = (fieldGeometry, area) => {
    const fieldId = `field-${Date.now()}`;
    const newField = {
      type: "Feature",
      properties: {
        id: fieldId,
        type: "field",
        name: `Field ${wizardData.fieldsData.features.length + 1}`,
        area: `${area} acres`,
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
          area: `${area} acres`,
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

      const attributes = {
        ...feature.properties?.attributes,
        ...filteredAttributes,
        area: area || feature.properties?.area || "",
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
      console.log("Submitting wizard payload", payload);

      const response = await locationService.farmWizard(payload);

      setWizardData((prev) => ({
        ...prev,
        savedLocations: response.data,
      }));

      alert("Farm registration completed successfully!");
    } catch (error) {
      console.error("Failed to complete farm wizard", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Farm registration failed. Please try again.";
      alert(message);
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
    setWizardData((prev) => ({
      ...prev,
      farmBoundaries: featureCollection,
    }));

    return featureCollection;
  };

  // farm division utility
  const handleFieldDivisionComplete = (completeData) => {
    const { farmBoundaries, fieldsData, fieldsInfo, numberOfFields } =
      completeData;

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

    setWizardData((prev) => ({
      ...prev,
      farmBoundaries: farmData,
      fieldsData,
      fieldsInfo,
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
