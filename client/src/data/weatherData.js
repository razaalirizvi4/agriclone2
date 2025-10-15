// client/src/data/weatherData.js

const getNextDays = (count = 4) => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + i);
    const dayName = nextDay.toLocaleDateString("en-US", { weekday: "long" });

    if (i === 0) days.push("Today");
    else days.push(dayName);
  }

  return days;
};

const dayNames = getNextDays();


export const weatherData = {
  current: {
    temperature: 28,
    high: 30,
    low: 22,
    condition: "Sunny",
    humidity: 65,
    icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  },
  forecast: [
    {
      day: dayNames[1],
      condition: "Cloudy",
      high: 27,
      low: 20,
    },
    {
      day: dayNames[2],
      condition: "Rainy",
      high: 25,
      low: 19,
    },
    {
      day: dayNames[3] || "Next Day",
      condition: "Sunny",
      high: 29,
      low: 21,
    },
  ],
};