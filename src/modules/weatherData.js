import SunCalc from "suncalc"; // Library for calculating sun's position
import { format } from "date-fns";

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
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Try again later!");
      }
      throw new Error("Weather data not found!");
    }

    const data = await response.json();

    handleWeatherData(data); // Process json data
    console.log("JSON Data:", data);
  } catch (err) {
    console.log("Error fetching weather data!", err.message);
  }
}

// Process and structure raw data from API into objects (metric)
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

  // Arr of the following 6 days with weather data (excluding Today's day, only for 'daily' forecast)
  const weekForecast = data.days.slice(1, 7);
  const currentConditions = data.currentConditions;

  // Variables for calculating sun elevation, and hourly forecast
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd"); // Today's date in string format
  const currentHour = currentDate.getHours();
  const hoursLeftToday = 24 - currentHour;

  const latitude = data.latitude;
  const longitude = data.longitude;
  const today = data.days[0];
  const tomorrow = format(
    currentDate.setDate(currentDate.getDate() + 1),
    "yyyy-MM-dd",
  );

  // DATA FOR TODAY
  const currentData = {
    day: "Today",
    location: data.resolvedAddress,
    temperature: currentConditions.temp, // celsius
    temperatureMax: today.tempmax,
    temperatureMin: today.tempmin,
    condition: currentConditions.conditions,
    feelsLike: currentConditions.feelslike,
    sunrise: currentConditions.sunrise,
    sunset: currentConditions.sunset,
    visibility: currentConditions.visibility, // km
    humidity: currentConditions.humidity, // percentage
    windSpeed: currentConditions.windspeed, // km/h
    windDirection: currentConditions.winddir, //degrees
    pressure: currentConditions.pressure, //mb
    uvIndex: currentConditions.uvindex, // out of 10

    // Use this for background change based on time of day
    get sunElevation() {
      const sunPosition = SunCalc.getPosition(currentDate, latitude, longitude);
      return (sunPosition.altitude * 180) / Math.PI; // Convert from radians to degrees
    },
  };

  // DATA FOR THE NEXT 6 DAYS
  const weekForecastData = weekForecast.map((day) => {
    const date = new Date(day.datetime); // Convert string date into Date object
    return {
      date: day.datetime, // !!! TEMPORARY
      day: daysOfWeek[date.getDay()], // Day of the week
      temperatureMax: day.tempmax,
      temperatureMin: day.tempmin,
      condition: day.conditions,
      feelslike: day.feelslike,
      sunrise: day.sunrise,
      sunset: day.sunset,
      visibility: day.visibility,
      humidity: day.humidity,
      windSpeed: day.windspeed,
      windDirection: day.winddir,
      pressure: day.pressure,
      uvIndex: day.uvindex,
    };
  });

  // DATA FOR THE NEXT 24 HOURS
  const filteredDays = data.days.filter((day) => day.datetime >= formattedDate); // Filter days starting from 'today'
  const weekRange = filteredDays.slice(0, 2); // Hourly forecast for 2 day range (including Today's day and Tomorrow's day)

  const hourlyForecastData = weekRange.map((day) => {
    const isToday = day.datetime === formattedDate;
    const isTomorrow = day.datetime === tomorrow;
    const hours = day.hours;

    // Filter hours for today to include only the ones from the current hour onward
    const filteredHours = isToday
      ? hours.filter((hour) => {
          const hourTime = new Date(
            `${formattedDate}T${hour.datetime}`,
          ).getHours();
          return hourTime >= currentHour; // Return hours starting from the current hour
        })
      : isTomorrow
        ? hours.slice(0, 24 - hoursLeftToday) // Subtract remaining hours of today from tomorrow's hours
        : [];

    return {
      date: day.datetime, // !!! TEMPORARY
      // For each hourly object, only collect 'time of the day', 'temperature' and 'weather condition'
      hours: filteredHours.map((hour) => ({
        time:
          // Set to 'Now' for current time
          isToday &&
          new Date(`${formattedDate}T${hour.datetime}`).getHours() ===
            currentHour
            ? "Now"
            : hour.datetime,
        temperature: hour.temp,
        condition: hour.conditions,
      })),
    };
  });
  return { currentData, weekForecastData, hourlyForecastData };
}

// Destructure processed data into weather data objects for easy access
function handleWeatherData(data) {
  // Get today's weather data, 6-day forecast data
  const { currentData, weekForecastData, hourlyForecastData } =
    organizeData(data);
  //console.log("Today's data", currentData);
  //console.log("Week Forecast", weekForecastData);
  //console.log("Hourly Forecast", hourlyForecastData);
}

function initFetch() {
  btnRequest.addEventListener("click", (e) => {
    e.preventDefault();
    fetchWeatherData();
  });
}

export { initFetch };
