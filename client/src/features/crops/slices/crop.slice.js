
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cropService from "../../../services/crop.service";

export const getCrops = createAsyncThunk('crops/getAll', async () => {
  const response = await cropService.getCrops();
  return response.data;
});

export const createCrop = createAsyncThunk('crops/create', async (cropData) => {
  const response = await cropService.createCrop(cropData);
  return response.data;
});

export const updateCrop = createAsyncThunk('crops/update', async ({ id, cropData }) => {
  const response = await cropService.updateCrop(id, cropData);
  return response.data;
});

export const deleteCrop = createAsyncThunk('crops/delete', async (id) => {
  await cropService.deleteCrop(id);
  return id;
});

const cropSlice = createSlice({
  name: 'crops',
  initialState: {
    crops: [],
    status: 'idle',
    error: null,
    crop_id: "",
  },
  reducers: {
    setSelectedCropId: (state, action) => {
      state.crop_id = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCrops.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getCrops.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.crops = action.payload;
      })
      .addCase(getCrops.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createCrop.fulfilled, (state, action) => {
        state.crops.push(action.payload);
      })
      .addCase(updateCrop.fulfilled, (state, action) => {
        const index = state.crops.findIndex(crop => crop._id === action.payload._id);
        if (index !== -1) {
          state.crops[index] = action.payload;
        }
      })
      .addCase(deleteCrop.fulfilled, (state, action) => {
        state.crops = state.crops.filter(crop => crop._id !== action.payload);
      });
  },
});

export const { setSelectedCropId } = cropSlice.actions;
export default cropSlice.reducer;
