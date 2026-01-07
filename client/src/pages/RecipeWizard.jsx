import { useCallback, useEffect, useState } from "react";
import CropCreationCard from "../features/crops/components/CropCreationCard";
import CropRecipePanel from "../features/crops/components/CropRecipePanel";
import cropService from "../services/crop.service";

const RecipeWizard = () => {
  const [crops, setCrops] = useState([]);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [cropsError, setCropsError] = useState(null);

  const fetchCrops = useCallback(async () => {
    setCropsLoading(true);
    setCropsError(null);
    try {
      const { data } = await cropService.getCrops();
      setCrops(Array.isArray(data) ? data : []);
    } catch (err) {
      setCropsError(err?.response?.data?.message || err.message);
    } finally {
      setCropsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  return (
    <div className="recipe-wizard-page">
      <div className="wizard-layout">
        <CropCreationCard onCropCreated={fetchCrops} />
        <CropRecipePanel
          crops={crops}
          loading={cropsLoading}
          error={cropsError}
          onRefreshCrops={fetchCrops}
        />
      </div>
    </div>
  );
};

export default RecipeWizard;

