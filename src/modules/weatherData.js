import SunCalc from "suncalc";

const userInput = document.getElementById("search-input");
const btnRequest = document.getElementById("search-btn");

const API_KEY = "9545QA2MGPWNHSND234UFU28K"; // Public Visual Crossing API key

const getLocation = () => userInput.value;

async function getWeatherData() {
  const location = getLocation();
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&elements=datetime%2Cname%2Caddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cpreciptype%2Csnow%2Csnowdepth%2Cwindspeed%2Cwindspeedmean%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Csolarradiation%2Csolarenergy%2Cuvindex%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Csunelevation&key=${API_KEY}&contentType=json`;

  if (location.trim() === "") return;

  try {
    const response = await fetch(url, { mode: "cors" });

    if (!response.ok) {
      throw new Error("Weather data not found!");
    }

    const data = await response.json();

    processWeatherData(data); // Process json data
    console.log(data);
  } catch (err) {
    console.log("Error fetching weather data!", err.message);
  }
}

// Extract API data into object
function processWeatherData(data) {
  // Variables for sun elevation calculation
  const tzOffset = data.tzoffset;
  const currentDate = new Date();
  const localDate = new Date(currentDate.getTime() + tzOffset * 60000);
  const latitude = data.latitude;
  const longitude = data.longitude;

  // Include data from API that should be displayed
  const obj = {
    location: data.resolvedAddress,
    temperature: data.currentConditions.temp, // celsius
    condition: data.currentConditions.conditions,
    feelsLike: data.currentConditions.feelslike,
    humidity: data.currentConditions.humidity, // percentage
    precipitation: data.currentConditions.precip, // millimeters
    sunrise: data.currentConditions.sunrise,
    sunset: data.currentConditions.sunset,
    windSpeed: data.currentConditions.windspeed, // km/h
    visibility: data.currentConditions.visibility, // km

    get sunElevation() {
      const sunPosition = SunCalc.getPosition(localDate, latitude, longitude);
      return (sunPosition.altitude * 180) / Math.PI; // degrees
    },
  };

  // function that takes object, and displays the data
  console.log(obj);
}

function fetchWeatherData() {
  btnRequest.addEventListener("click", (e) => {
    e.preventDefault();
    getWeatherData();
  });
}

export { fetchWeatherData };
