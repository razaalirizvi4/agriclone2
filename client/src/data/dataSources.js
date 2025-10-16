import { farmsGeoJSON as farms } from "./farms";
import { weatherData } from "./weatherData";
import {crop} from './crop.js'

export const dataSources = {
  farmsGeoJSON: farms,
  weatherData: weatherData,
  cropData: crop
};
