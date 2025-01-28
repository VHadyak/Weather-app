import SunCalc from "suncalc"; // Library for calculating sun's position
import { format, parse, addDays } from "date-fns";

// Import weather icons
import partlyCloudyDay from "../assets/images/partlyCloudyDay.gif";
import rain from "../assets/images/Rain.gif";
import snow from "../assets/images/Snow.gif";
import overcast from "../assets/images/Overcast.gif";
import clearDay from "../assets/images/clearDay.gif";

import { displayWeatherData } from "./dom";

const btnRequest = document.getElementById("search-btn");
const userInput = document.getElementById("search-input");
const timeUpdated = document.querySelector("#time-updated");

const DEFAULT_LOCATION = "New York, USA";
let weatherDataCache = null;
let lastUpdatedTime = null;
let updateInterval;
let storedLocation = "";

// Fetch weather data from API
export async function fetchWeatherData() {
  const API_KEY = "9545QA2MGPWNHSND234UFU28K"; // Visual Crossing Public API key

  const location = storedLocation;
  if (location.trim() === "") return;

  // Assign updated time
  if (timeUpdated) {
    const time = format(new Date(), "HH:mm");
    timeUpdated.textContent = `Updated on: ${time}`;
  }

  const currentTime = new Date();

  // Return cached data if it's less than 10 minutes, else make an API call
  if (weatherDataCache && lastUpdatedTime && currentTime - lastUpdatedTime < 597000) {
    return weatherDataCache;
  }

  const url =
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}` +
    `?unitGroup=metric&elements=datetime%2Cname%2Caddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslike%2Cdew%2Chumidity%2Cwindspeed%2Cwindspeedmean%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Csolarradiation%2Csolarenergy%2Cuvindex%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Csunelevation` +
    `&lang=id&key=${API_KEY}&contentType=json`;

  try {
    const response = await fetch(url, { mode: "cors" });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Try again later!");
      }
      throw new Error("Weather data not found!");
    }

    const data = await response.json();
    weatherDataCache = organizeData(data); /* Cache the data to prevent future unnecessary API calls 
                                            (especially when switching daily/hourly forecasts) */
    console.log(data);
    lastUpdatedTime = currentTime;
    console.log(weatherDataCache.currentData.temperature);
    console.log(weatherDataCache.currentData.windSpeed);
    console.log(weatherDataCache.currentData.windDirection);

    const { locality, country } = await getLocationDetails(data.latitude, data.longitude);

    if (locality && country) {
      weatherDataCache.currentData.location = `${locality}, ${country}`; // Add location to currentData object
    } else {
      weatherDataCache.currentData.location = storedLocation; // Fallback if location API fails
    }
    return weatherDataCache;
  } catch (err) {
    console.log("Error fetching weather data!", err.message);
  }
}

/* Fetch the city and country name from the API, ensuring the location is returned in English,
even if a foreign country is searched. */
export async function getLocationDetails(latitude, longitude) {
  const url = `https://us1.locationiq.com/v1/reverse?key=pk.bdcf91109a5cf61e65c8ee8445174854&lat=${latitude}&lon=${longitude}&format=json&`;

  try {
    const response = await fetch(url, { mode: "cors" });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Try again later!");
      }
      throw new Error("Unable to fetch address location!");
    }

    const data = await response.json();

    const locality = data.address.city;
    const country = data.address.country;

    return { locality, country };
  } catch (err) {
    console.log("Error fetching an address location!", err.message);
  }
}

// Return fallback value if value is undefined or null
function def(val, fallback = "N/A") {
  return val != null ? val : fallback;
}

// Use condition IDs to ensure compatibility with future updates to the Weather API,
// ...condition descriptions may change over time.
const conditionIDs = {
  type_42: {
    condition: "Partly Cloudy",
    imgURL: partlyCloudyDay,
  },
  type_21: {
    condition: "Rain",
    imgURL: rain,
  },
  type_31: {
    condition: "Snow",
    imgURL: snow,
  },
  type_41: {
    condition: "Overcast",
    imgURL: overcast,
  },
  type_43: {
    condition: "Clear",
    imgURL: clearDay,
  },
};

// If there multiple types within a condition property provided by API,
// ... such as ("type_21", "type_31", "type_42") select only the first one on the list
function getFirstCondition(conditions) {
  const conditionArr = conditions.split(",").map((condition) => condition.trim()); // Convert into array of conditions
  const firstCondition = conditionArr[0]; // Select only the first condition

  return conditionIDs[firstCondition];
}

// Process and structure raw data from API into objects (metric)
function organizeData(data) {
  const currentDate = new Date();
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekForecast = data.days.slice(1, 7); // Arr of the following 6 days with weather data (excluding Today's day, only for 'daily' forecast)
  const currentConditions = data.currentConditions;
  const tzoffset = data.tzoffset;
  const timezone = data.timezone;
  const utcTime = currentDate.getUTCHours(); // Get the current hour in UTC (24-hour format)
  let tzTime = utcTime + tzoffset; // Get time (in number format) of the target location based on timezone offset

  /* If local time greater than 24 or less than 0, 
  then readjust local time back to 24-hour range */
  if (tzTime >= 24) {
    tzTime -= 24;
  } else if (tzTime < 0) {
    tzTime += 24;
  }

  const hoursLeftToday = 24 - tzTime;

  // Timezone date
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  });

  const formatted = dateFormat.format(currentDate);
  const datePart = formatted.split(",")[0]; // Extract date part
  const parsedDate = parse(datePart, "M/d/yyyy", new Date()); // Parse the date string into a Date object
  const formattedDate = format(parsedDate, "yyyy-MM-dd"); // Format the date into "yyyy-MM-dd" (current date based on location)
  const tomorrowDate = addDays(parsedDate, 1);
  const tomorrow = format(tomorrowDate, "yyyy-MM-dd");

  // Sun elevation variables
  const latitude = data.latitude;
  const longitude = data.longitude;
  const today = data.days[0];

  const firstCondition = getFirstCondition(currentConditions.conditions);

  // DATA FOR TODAY
  const currentData = {
    day: "Today",
    temperature: currentConditions.temp, // celsius
    temperatureHigh: today.tempmax,
    temperatureLow: today.tempmin,
    condition: firstCondition.condition,
    conditionImg: firstCondition.imgURL,
    feelsLike: currentConditions.feelslike,
    sunrise: currentConditions.sunrise,
    sunset: currentConditions.sunset,
    visibility: def(currentConditions.visibility), // km
    humidity: def(currentConditions.humidity), // percentage
    windSpeed: def(currentConditions.windspeed), // km/h
    windDirection: def(currentConditions.winddir), // degrees
    pressure: def(currentConditions.pressure), // mb
    uvIndex: def(currentConditions.uvindex), // out of 10

    // Use this for background transition change based on time of day
    get sunElevation() {
      const sunPosition = SunCalc.getPosition(currentDate, latitude, longitude);
      return (sunPosition.altitude * 180) / Math.PI; // Convert from radians to degrees
    },
  };

  // DATA FOR THE NEXT 6 DAYS
  const weekForecastData = weekForecast.map((day) => {
    const date = new Date(day.datetime); // Convert string date into Date object
    const firstCondition = getFirstCondition(day.conditions);

    return {
      date: day.datetime,
      day: daysOfWeek[date.getDay()], // Day of the week
      temperatureHigh: day.tempmax,
      temperatureLow: day.tempmin,
      condition: firstCondition.condition,
      conditionImg: firstCondition.imgURL,
      feelslike: day.feelslike,
      sunrise: day.sunrise,
      sunset: day.sunset,
      visibility: def(day.visibility),
      humidity: def(day.humidity),
      windSpeed: def(day.windspeed),
      windDirection: def(day.winddir),
      pressure: def(day.pressure),
      uvIndex: def(day.uvindex),
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
          return hourTime >= tzTime; // Return hours starting from the current hour in local time
        })
      : isTomorrow // Include remaining hours from tomorrow
        ? hours.slice(0, 24 - hoursLeftToday) // Subtract remaining hours of today from tomorrow's hours
        : [];

    return {
      date: day.datetime,
      hours: filteredHours.map((hour) => ({
        time:
          // Set to 'Now' for current time
          isToday && new Date(`${formattedDate}T${hour.datetime}`).getHours() === tzTime ? "Now" : hour.datetime,
        temperature: hour.temp,
        condition: getFirstCondition(hour.conditions).condition,
        conditionImg: getFirstCondition(hour.conditions).imgURL,
      })),
    };
  });
  return { currentData, weekForecastData, hourlyForecastData };
}

export function initFetch() {
  if (updateInterval) clearInterval(updateInterval); // Avoid interval overlap

  updateInterval = setInterval(() => {
    displayWeatherData("Daily");
  }, 600000);

  btnRequest.addEventListener("click", async (e) => {
    e.preventDefault();

    const location = userInput.value.trim();

    if (location !== "") {
      storedLocation = location; // Store the location
      weatherDataCache = null; // Clear previous cache

      await displayWeatherData("Daily"); // Fetch and display the daily data
    }
    userInput.value = "";
  });
}

// Default location when page loads
document.addEventListener("DOMContentLoaded", () => {
  if (!storedLocation) {
    storedLocation = DEFAULT_LOCATION;
  }
  displayWeatherData("Daily");
});
