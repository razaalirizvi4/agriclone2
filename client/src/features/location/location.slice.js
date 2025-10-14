
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import locationService from '../../services/location.service';

export const getLocations = createAsyncThunk('locations/getAll', async () => {
  const response = await locationService.getLocations();
  return response.data;
});

export const createLocation = createAsyncThunk('locations/create', async (locationData) => {
  const response = await locationService.createLocation(locationData);
  return response.data;
});

export const updateLocation = createAsyncThunk('locations/update', async ({ id, locationData }) => {
  const response = await locationService.updateLocation(id, locationData);
  return response.data;
});

export const deleteLocation = createAsyncThunk('locations/delete', async (id) => {
  await locationService.deleteLocation(id);
  return id;
});

const locationSlice = createSlice({
  name: 'locations',
  initialState: {
    locations: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getLocations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.locations = action.payload;
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.locations.push(action.payload);
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        const index = state.locations.findIndex(location => location._id === action.payload._id);
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.locations = state.locations.filter(location => location._id !== action.payload);
      });
  },
});

export default locationSlice.reducer;
