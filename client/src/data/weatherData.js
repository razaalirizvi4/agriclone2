// client/src/data/weatherData.js
export const weatherData = {
  current: {
    temperature: 28,
    condition: "Sunny",
    humidity: 65,
    icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png", // Sun icon
  },
  forecast: [
    {
      day: "Today",
      icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png", // Sun icon
      high: 30,
      low: 22,
    },
    {
      day: "Tomorrow",
      icon: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png", // Cloud icon
      high: 27,
      low: 20,
    },
    {
      day: "Sunday",
      icon: "https://cdn-icons-png.flaticon.com/512/1146/1146860.png", // Rain icon
      high: 25,
      low: 19,
    },
  ],
};
