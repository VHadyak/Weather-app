import { resetSwiperState } from "./swiper";
import { fetchWeatherData } from "./weatherData";

export let hourlyIsActive = false; // Forecast toggle state
let isCelsius = true;
let storedWeatherData = null;

const dailyBtn = document.querySelector(".daily-toggle");
const hourlyBtn = document.querySelector(".hourly-toggle");

const celsiusBtn = document.querySelector(".cel");
const fahrenheitBtn = document.querySelector(".fah");

// Main data variables
const locationName = document.querySelector("#location-name");
const temperature = document.querySelector("#degrees");
const degreeSymbol = document.createElement("span");
const conditionDesc = document.querySelector("#condition-desc");
const feelsLike = document.querySelector("#feels-like");
//const timeUpdated = document.querySelector("#time-updated");

const dailyCardList = document.querySelector(".daily-card-list");
const hourlyCardList = document.querySelector(".hourly-card-list");

const dailyCards = document.querySelectorAll(".daily-card");
const dayHigh = document.querySelectorAll(".day-high");
const dayLow = document.querySelectorAll(".day-low");

// Secondary data variables
const sunrise = document.querySelector("#sunriseText");
const sunset = document.querySelector("#sunsetText");
const windSpeed = document.querySelector("#wind-speedText");
const pressure = document.querySelector("#pressureText");
const visibility = document.querySelector("#visibilityText");
const humidity = document.querySelector("#humidityText");
const uvIndex = document.querySelector("#uv-indexText");
const windDirection = document.querySelector("#wind-directionText");

// Update weather details for the selected card
function updateWeatherDetails(dayData) {
  sunrise.textContent = dayData.sunrise;
  sunset.textContent = dayData.sunset;
  windSpeed.textContent = dayData.windSpeed;
  pressure.textContent = dayData.pressure;
  visibility.textContent = dayData.visibility;
  humidity.textContent = dayData.humidity;
  uvIndex.textContent = dayData.uvIndex;
  windDirection.textContent = dayData.windDirection;
}

// Displays weather data after it has been fetched, based on the specific forecast type
export async function displayWeatherData(forecast, index) {
  const weatherData = await fetchWeatherData();

  if (!weatherData) return;
  storedWeatherData = weatherData; // Store weather data that was fetched

  if (forecast === "Daily") {
    renderDailyData();
  } else if (forecast === "Hourly") {
    renderHourlyData();
  } else if (forecast === "Day View") {
    renderSelectedCard(index);
  }
}

// Convert between Celsius/Fahrenheit
function degreesConverter(convertToCelsius, { currentData, weekForecastData, hourlyForecastData }) {
  // Round to 1 decimal place
  const round = (num) => Math.round(num * 10) / 10;

  // Celsius/Fahrenheit conversion
  const convert = (temp) => {
    return convertToCelsius ? round((5 / 9) * (temp - 32)) : round((9 / 5) * temp + 32);
  };

  // Update object property values
  currentData.temperatureHigh = convert(currentData.temperatureHigh);
  currentData.temperatureLow = convert(currentData.temperatureLow);
  currentData.temperature = convert(currentData.temperature);
  currentData.feelsLike = convert(currentData.feelsLike);

  weekForecastData.forEach((day) => {
    day.temperatureHigh = convert(day.temperatureHigh);
    day.temperatureLow = convert(day.temperatureLow);
  });

  hourlyForecastData.forEach((day) => {
    day.hours.forEach((hour) => {
      hour.temperature = convert(hour.temperature);
    });
  });
}

// Render individual card's weather data based on user's selection
function renderSelectedCard(index) {
  const { currentData, weekForecastData } = storedWeatherData;
  let selectedDayData;

  if (index === 0) {
    selectedDayData = currentData;
  } else {
    selectedDayData = weekForecastData[index - 1];
  }
  updateWeatherDetails(selectedDayData);
}

// Render a week of forecast
function renderDailyData(degreeChange = false) {
  dailyCardList.style.display = "flex";
  hourlyCardList.style.display = "none";

  const { currentData, weekForecastData } = storedWeatherData;

  //timeUpdated.textContent = `Updated on: ${}`;
  const dailyCards = document.querySelectorAll(".daily-card");

  // Rest of week data DOM
  dailyCards.forEach((card, index) => {
    const cardTitle = card.querySelector("p.day");
    const dayL = dayLow[index];
    const dayH = dayHigh[index];
    const desc = card.querySelector(".daily-desc");

    if (index === 0) {
      // Main data DOM
      if (!degreeChange) {
        locationName.textContent = currentData.location;
        conditionDesc.textContent = currentData.condition;

        // DOM for today
        cardTitle.textContent = currentData.day;
        desc.textContent = currentData.condition;

        // Secondary data
        updateWeatherDetails(currentData);
      }

      feelsLike.textContent = `Feels like: ${currentData.feelsLike}°`;
      temperature.textContent = currentData.temperature;
      dayH.textContent = currentData.temperatureHigh;
      dayL.textContent = currentData.temperatureLow;

      degreeSymbol.textContent = "°";
      temperature.appendChild(degreeSymbol);
    } else {
      // Adjust the index of weekData with card index
      // since weekData doesn't account today's day
      const day = weekForecastData[index - 1];

      // DOM for rest of the week
      if (!degreeChange) {
        cardTitle.textContent = day.day;
        desc.textContent = day.condition;
      }

      dayH.textContent = day.temperatureHigh;
      dayL.textContent = day.temperatureLow;
    }
  });

  // Ensure the degree symbol is appended only once, without duplicating it after each function call
  dayHigh.forEach((high) => {
    high.textContent = high.textContent.replace("°", ""); // Remove any previous degree symbol
    const degreeSym = document.createElement("span");
    degreeSym.textContent = "°";
    high.appendChild(degreeSym);
  });

  dayLow.forEach((low) => {
    low.textContent = low.textContent.replace("°", "");
    const degreeSym = document.createElement("span");
    degreeSym.textContent = "°";
    low.appendChild(degreeSym);
  });

  console.log("current:", currentData);
  console.log("week", weekForecastData);
}

// Dynamically create hourly cards
function generateHourlyCards() {
  for (let i = 0; i < 24; i++) {
    const hourlyCard = document.createElement("div");
    const time = document.createElement("div");
    const hrIcon = document.createElement("div");
    const hrTemp = document.createElement("div");
    const hrDesc = document.createElement("div");
    const degreeSpan = document.createElement("span");

    hourlyCard.classList.add("hourly-card");
    hourlyCard.classList.add("card");
    time.classList.add("time");
    hrIcon.classList.add("hourly-icon");
    hrTemp.classList.add("hourly-temp");
    hrDesc.classList.add("hourly-desc");

    hrTemp.appendChild(degreeSpan);
    hourlyCard.appendChild(time);
    hourlyCard.appendChild(hrIcon);
    hourlyCard.appendChild(hrTemp);
    hourlyCard.appendChild(hrDesc);
    hourlyCardList.appendChild(hourlyCard);
  }
}

// Render hourly forecast
function renderHourlyData(degreeChange = false) {
  dailyCardList.style.display = "none";
  hourlyCardList.style.display = "flex";

  const { currentData, hourlyForecastData } = storedWeatherData;

  const hourlyCards = document.querySelectorAll(".hourly-card");

  // Combine hours of today with tomorrow's hours
  const combineHours = hourlyForecastData.reduce((total, day) => {
    const joinedArr = total.concat(day.hours);
    return joinedArr; // Array of 24 hours
  }, []);

  temperature.textContent = currentData.temperature;
  feelsLike.textContent = `Feels like: ${currentData.feelsLike}°`;
  degreeSymbol.textContent = "°";
  temperature.appendChild(degreeSymbol);

  hourlyCards.forEach((card, index) => {
    const hour = combineHours[index];

    const title = card.querySelector(".time");
    const temp = card.querySelector(".hourly-temp");
    const desc = card.querySelector(".hourly-desc");

    if (!degreeChange) {
      title.textContent = hour.time;
      desc.textContent = hour.condition;
    }
    temp.textContent = hour.temperature;
  });

  const temp = document.querySelectorAll(".hourly-temp");

  // Make sure degree symbols don't append to one another after multiple calls
  temp.forEach((t) => {
    t.textContent = t.textContent.replace("°", "");
    const degreeSym = document.createElement("span");
    degreeSym.textContent = "°";
    t.appendChild(degreeSym);
  });

  console.log("hourly:", hourlyForecastData);
}

// DOM Events
dailyBtn.addEventListener("click", () => {
  if (hourlyIsActive) {
    hourlyIsActive = false;
    displayWeatherData("Daily");
    resetSwiperState();
  }
});

hourlyBtn.addEventListener("click", () => {
  if (!hourlyIsActive) {
    hourlyIsActive = true;
    displayWeatherData("Hourly");
    resetSwiperState();
  }
});

dailyCards.forEach((card, index) => {
  card.addEventListener("click", () => {
    displayWeatherData("Day View", index);
  });
});

celsiusBtn.addEventListener("click", () => {
  if (!isCelsius) {
    isCelsius = true;
    degreesConverter(true, storedWeatherData); //convert to Celsius

    // Prevent for degree buttons to switch daily/hourly tabs
    return hourlyIsActive ? renderHourlyData(true) : renderDailyData(true);
  }
});

fahrenheitBtn.addEventListener("click", () => {
  if (isCelsius) {
    isCelsius = false;
    degreesConverter(false, storedWeatherData); // convert to Fahrenheit

    return hourlyIsActive ? renderHourlyData(true) : renderDailyData(true);
  }
});

// Reset state after search
const btnReq = document.querySelector("#search-btn");
btnReq.addEventListener("click", () => {
  hourlyIsActive = false;
  isCelsius = true;
  resetSwiperState();
});

document.addEventListener("DOMContentLoaded", generateHourlyCards);
