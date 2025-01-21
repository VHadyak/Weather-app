import SunCalc from "suncalc"; // Library for calculating sun's position
import { format } from "date-fns";
import { displayDailyData } from "./dom";

const userInput = document.getElementById("search-input");
const btnRequest = document.getElementById("search-btn");

const API_KEY = "9545QA2MGPWNHSND234UFU28K"; // Public Visual Crossing API key

let weatherDataCache = null;
let storedLocation = "";

// Get weather data from API
export async function fetchWeatherData() {
  const location = storedLocation;
  if (location.trim() === "") return;

  // If data is already cached, return it to avoid making another API call
  if (weatherDataCache) return weatherDataCache;

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
    console.log("JSON Data:", data);
    // Cache the data to prevent future API calls (especially when switching daily/hourly forecasts)
    weatherDataCache = organizeData(data);
    return weatherDataCache;
  } catch (err) {
    console.log("Error fetching weather data!", err.message);
  }
}

// Process and structure raw data from API into objects (metric)
function organizeData(data) {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Arr of the following 6 days with weather data (excluding Today's day, only for 'daily' forecast)
  const weekForecast = data.days.slice(1, 7);
  const currentConditions = data.currentConditions;

  const currentDate = new Date();

  const tzoffset = data.tzoffset;
  const utcTime = currentDate.getUTCHours(); // Get the current hour in UTC (24-hour format)

  let tzTime = utcTime + tzoffset; // Get time (in number format) of the target location based on timezone offset
  const hoursLeftToday = 24 - tzTime;

  /* If local time greater than 24 or less than 0, 
  then readjust local time back to 24-hour range */
  if (tzTime >= 24) {
    tzTime -= 24;
  } else if (tzTime < 0) {
    tzTime += 24;
  }

  // Get date of the target location based on its timezone
  const adjustedDate = new Date(currentDate);
  adjustedDate.setHours(currentDate.getHours() + tzoffset);
  const formattedDate = format(adjustedDate, "yyyy-MM-dd");

  const latitude = data.latitude;
  const longitude = data.longitude;

  const today = data.days[0];
  const tomorrow = format(adjustedDate.setDate(adjustedDate.getDate() + 1), "yyyy-MM-dd");

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

    // Use this for background transition change based on time of day
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
          const hourTime = new Date(`${formattedDate}T${hour.datetime}`).getHours();
          return hourTime >= tzTime; // Return hours starting from the current hour
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
          isToday && new Date(`${formattedDate}T${hour.datetime}`).getHours() === tzTime ? "Now" : hour.datetime,
        temperature: hour.temp,
        condition: hour.conditions,
      })),
    };
  });
  return { currentData, weekForecastData, hourlyForecastData };
}

export function initFetch() {
  btnRequest.addEventListener("click", async (e) => {
    e.preventDefault();

    const location = userInput.value.trim();

    if (location !== "") {
      storedLocation = location; // Store the location
      weatherDataCache = null; // Clear previous cache

      await displayDailyData(); // Fetch and display the daily data
    }

    userInput.value = "";
  });
}
