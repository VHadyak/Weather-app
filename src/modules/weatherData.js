import SunCalc from "suncalc"; // Library for calculating sun's position

const userInput = document.getElementById("search-input");
const btnRequest = document.getElementById("search-btn");

const API_KEY = "9545QA2MGPWNHSND234UFU28K"; // Public Visual Crossing API key

const getLocation = () => userInput.value;

// Get weather data from API
async function fetchWeatherData() {
  const location = getLocation();
  if (location.trim() === "") return;

  const url =
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}` +
    `?unitGroup=metric&elements=datetime%2Cname%2Caddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cpreciptype%2Csnow%2Csnowdepth%2Cwindspeed%2Cwindspeedmean%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Csolarradiation%2Csolarenergy%2Cuvindex%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Csunelevation` +
    `&key=${API_KEY}&contentType=json`;

  try {
    const response = await fetch(url, { mode: "cors" });

    if (!response.ok) {
      throw new Error("Weather data not found!");
    }

    const data = await response.json();

    handleWeatherData(data); // Process json data
    console.log("JSON Data:", data);
  } catch (err) {
    console.log("Error fetching weather data!", err.message);
  }
}

// Process and structure raw data from API into objects
function organizeData(data) {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Arr of the following 6 days with weather data (excluding Today's day)
  const weekForecast = data.days.slice(1, 7);
  const currentConditions = data.currentConditions;

  // Variables for calculating sun elevation
  const currentDate = new Date();
  const localDate = new Date(currentDate.getTime());
  const latitude = data.latitude;
  const longitude = data.longitude;

  // Data for today
  const currentData = {
    location: data.resolvedAddress,
    day: "Today",
    temperature: currentConditions.temp, // celsius
    condition: currentConditions.conditions,
    feelsLike: currentConditions.feelslike,
    humidity: currentConditions.humidity, // percentage
    precipitation: currentConditions.precip, // millimeters
    sunrise: currentConditions.sunrise,
    sunset: currentConditions.sunset,
    windSpeed: currentConditions.windspeed, // km/h
    visibility: currentConditions.visibility, // km

    get sunElevation() {
      const sunPosition = SunCalc.getPosition(localDate, latitude, longitude);
      return (sunPosition.altitude * 180) / Math.PI; // Convert from radians to degrees
    },
  };

  // Data for the next 6 days
  const weekForecastData = weekForecast.map((day) => {
    const date = new Date(day.datetime); // Convert string date into Date object
    return {
      dayX: day.datetime, // !!!
      day: daysOfWeek[date.getDay()], // Day of the week
      temperatureMax: day.tempmax,
      temperatureMin: day.tempmin,
      condition: day.conditions,
      feelslike: day.feelslike,
      humidity: day.humidity,
      precipitation: day.precip,
      sunrise: day.sunrise,
      sunset: day.sunset,
      windSpeed: day.windspeed,
      visibility: day.visibility,
    };
  });
  return { currentData, weekForecastData };
}

// Destructure processed data into weather data objects for easy access
function handleWeatherData(data) {
  // Get today's weather data, 6-day forecast data
  const { currentData, weekForecastData } = organizeData(data);
  console.log(currentData);
  console.log(weekForecastData);
}

function initFetch() {
  btnRequest.addEventListener("click", (e) => {
    e.preventDefault();
    fetchWeatherData();
  });
}

export { initFetch };
