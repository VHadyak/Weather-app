import { resetSwiperState } from "./swiper";
import { fetchWeatherData } from "./weatherData";

export const ulList = document.querySelector("ul");
export const autocompleteContainer = document.querySelector(".autocomplete-container");

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
const conditionIcon = document.querySelector("#condition-icon");
const feelsLike = document.querySelector("#feels-like");

const contentWrapper = document.querySelector(".content-wrapper");
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

const weatherConditions = ["Clear", "Partly Cloudy"]; // Apply night weather icons only for 'Clear' and 'Partly Cloudy' conditions

// Update weather details for the selected card
function updateWeatherDetails(dayData) {
  let direction;
  const directionNum = dayData.windDirection;

  // Set wind's direction
  if (directionNum >= 0 && directionNum < 22.5) {
    direction = "N";
  } else if (directionNum >= 22.5 && directionNum < 67.5) {
    direction = "NE";
  } else if (directionNum >= 67.5 && directionNum < 112.5) {
    direction = "E";
  } else if (directionNum >= 112.5 && directionNum < 157.5) {
    direction = "SE";
  } else if (directionNum >= 157.5 && directionNum < 202.5) {
    direction = "S";
  } else if (directionNum >= 202.5 && directionNum < 247.5) {
    direction = "SW";
  } else if (directionNum >= 247.5 && directionNum < 292.5) {
    direction = "W";
  } else if (directionNum >= 292.5 && directionNum < 337.5) {
    direction = "NW";
  } else if (directionNum >= 337.5 && directionNum < 360) {
    direction = "N";
  }

  sunrise.textContent = dayData.sunrise;
  sunset.textContent = dayData.sunset;
  windSpeed.textContent = `${dayData.windSpeed} km/h`;
  pressure.textContent = `${dayData.pressure} hPa`;
  visibility.textContent = `${dayData.visibility} km`;
  humidity.textContent = `${dayData.humidity} %`;
  uvIndex.textContent = `${dayData.uvIndex}`;
  windDirection.textContent = `${dayData.windDirection}° ${direction}`;

  return direction;
}

// Displays weather data after it has been fetched, (show daily forecast by default)
export async function displayWeatherData(forecast, isFetched = true) {
  const weatherData = await fetchWeatherData();

  if (!weatherData || weatherData === undefined) return;

  fetched(isFetched);
  storedWeatherData = weatherData; // Store weather data that was fetched

  if (forecast === "Daily") {
    renderDailyData();
    highlightForecastButton(true);
    hourlyIsActive = false;
  }
}

// If data was fetched, set celsius to true, and hourly forecast display to false;
export function fetched(isFetched) {
  if (isFetched) {
    isCelsius = true;
    hourlyIsActive = false;
    fahrenheitBtn.classList.remove("select");
    celsiusBtn.classList.add("select");
  }
}

// Update style based on sun's elevation (time of day)
function updateCardStyles(cards, addClass, removeClasses) {
  cards.forEach((card) => {
    card.classList.remove(...removeClasses);
    card.classList.add(addClass);
  });
}

// Adjust background based on sun's elevation
function adjustBackground(sunElevation) {
  const cards = document.querySelectorAll(".card");
  const secondaryCards = document.querySelectorAll(".data-item");

  if (sunElevation >= 5) {
    contentWrapper.style.backgroundImage = "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)";
    updateCardStyles([...cards, ...secondaryCards], "day-style", ["evening-style", "night-style"]);
  }
  if (sunElevation > -6 && sunElevation < 5) {
    contentWrapper.style.backgroundImage = "linear-gradient(180deg, rgb(78, 28, 213) 0%, #7654b0 100%)";
    updateCardStyles([...cards, ...secondaryCards], "evening-style", ["day-style", "night-style"]);
  } else if (sunElevation <= -6) {
    contentWrapper.style.backgroundImage = "linear-gradient(to top,rgb(19, 49, 84) 0%, #466680 100%)";
    updateCardStyles([...cards, ...secondaryCards], "night-style", ["day-style", "evening-style"]);
  }
}

// Helper function to check if it's night based on sun's elevation
function isNight(sunElevation) {
  return sunElevation <= -6;
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
function renderSelectedCard(index = 0) {
  const { currentData, weekForecastData } = storedWeatherData;
  let selectedDayData;

  if (index === 0) {
    selectedDayData = currentData;
  } else {
    selectedDayData = weekForecastData[index - 1];
  }
  highLightSelectedCard(index);
  updateWeatherDetails(selectedDayData);
}

// Render a week of forecast
function renderDailyData(degreeChange = false) {
  dailyCardList.style.display = "flex";
  hourlyCardList.style.display = "none";

  highLightSelectedCard(); // Highlight first card after each new fetch

  const { currentData, weekForecastData } = storedWeatherData;

  const dailyCards = document.querySelectorAll(".daily-card");

  // Rest of week data DOM
  dailyCards.forEach((card, index) => {
    const cardTitle = card.querySelector("p.day");
    const dayL = dayLow[index];
    const dayH = dayHigh[index];
    const desc = card.querySelector(".daily-desc");
    const conditionImg = card.querySelector(".daily-icon");

    if (index === 0) {
      // Main data DOM
      if (!degreeChange) {
        locationName.textContent = currentData.location;
        conditionDesc.textContent = currentData.condition;

        conditionIcon.src =
          isNight(currentData.sunElevation) && weatherConditions.includes(currentData.condition)
            ? currentData.conditionImgNight
            : currentData.conditionImg;

        // DOM for today (card)
        cardTitle.textContent = currentData.day;
        desc.textContent = currentData.condition;
        conditionImg.src =
          isNight(currentData.sunElevation) && weatherConditions.includes(currentData.condition)
            ? currentData.conditionImgNight
            : currentData.conditionImg;

        // Secondary data
        updateWeatherDetails(currentData);
        adjustBackground(currentData.sunElevation);
      }

      feelsLike.textContent = `Feels like: ${currentData.feelsLike}°`;
      temperature.textContent = currentData.temperature;
      dayH.textContent = currentData.temperatureHigh;
      dayL.textContent = currentData.temperatureLow;

      degreeSymbol.textContent = "°";
      temperature.appendChild(degreeSymbol);
    } else {
      // Adjust the index of weekData with card index
      // since weekForecastData doesn't account today's day
      const day = weekForecastData[index - 1];

      // DOM for rest of the week
      if (!degreeChange) {
        cardTitle.textContent = day.day;
        desc.textContent = day.condition;
        conditionImg.src = day.conditionImg;
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
}

// Dynamically create hourly cards
function generateHourlyCards() {
  for (let i = 0; i < 24; i++) {
    const hourlyCard = document.createElement("div");
    const time = document.createElement("div");
    const hrIcon = document.createElement("img");
    const hrTemp = document.createElement("div");
    const hrDesc = document.createElement("div");
    const degreeSpan = document.createElement("span");

    hourlyCard.classList.add("hourly-card");
    hourlyCard.classList.add("card");
    time.classList.add("time");
    hrIcon.setAttribute("src", "#");
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
    const conditionImg = card.querySelector(".hourly-icon");

    if (!degreeChange) {
      title.textContent = hour.time;
      desc.textContent = hour.condition;
      conditionImg.src =
        isNight(hour.sunElevation) && weatherConditions.includes(hour.condition)
          ? hour.conditionImgNight
          : hour.conditionImg;
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
}

// Display city suggestions
export function displaySuggestions(place) {
  if (!place) return;

  const item = document.createElement("li");
  item.textContent = place;

  ulList.appendChild(item);
  autocompleteContainer.style.display = "block";
  ulList.style.display = "block";
}

// Highlight the currently selected card
export function highLightSelectedCard(index = 0) {
  const cards = document.querySelectorAll(".card");
  const selectedCard = cards[index];
  cards.forEach((card) => (card.style.border = "1px solid rgba(0, 0, 0, 0.25)"));
  selectedCard.style.border = "2px solid rgb(0, 0, 0)";
}

function highlightForecastButton(isDaily) {
  if (isDaily) {
    hourlyBtn.style.border = "1px solid rgba(0, 0, 0, 0.7)";
    hourlyBtn.style.opacity = "0.7";
    dailyBtn.style.border = "1px solid rgba(0, 0, 0, 1)";
    dailyBtn.style.opacity = "1";
  } else {
    dailyBtn.style.border = "1px solid rgba(0, 0, 0, 0.7)";
    dailyBtn.style.opacity = "0.7";
    hourlyBtn.style.border = "1px solid rgba(0, 0, 0, 1)";
    hourlyBtn.style.opacity = "1";
  }
}

// DOM Event listeners
dailyBtn.addEventListener("click", () => {
  if (hourlyIsActive) {
    fetched(false);
    hourlyIsActive = false;
    renderDailyData();
    resetSwiperState();
    highlightForecastButton(true);
  }
});

hourlyBtn.addEventListener("click", () => {
  if (!hourlyIsActive) {
    fetched(false);
    hourlyIsActive = true;
    renderHourlyData();
    resetSwiperState();
    highlightForecastButton(false);
  }
});

dailyCards.forEach((card, index) => {
  card.addEventListener("click", () => {
    renderSelectedCard(index);
  });
});

celsiusBtn.addEventListener("click", () => {
  if (!isCelsius) {
    isCelsius = true;
    fahrenheitBtn.classList.remove("select");
    celsiusBtn.classList.add("select");
    degreesConverter(true, storedWeatherData); // convert to Celsius

    // Prevent for degree buttons to switch daily/hourly tabs
    return hourlyIsActive ? renderHourlyData(true) : renderDailyData(true);
  }
});

fahrenheitBtn.addEventListener("click", () => {
  if (isCelsius) {
    isCelsius = false;
    celsiusBtn.classList.remove("select");
    fahrenheitBtn.classList.add("select");
    degreesConverter(false, storedWeatherData); // convert to Fahrenheit

    return hourlyIsActive ? renderHourlyData(true) : renderDailyData(true);
  }
});

// Reset swiper state after search
const btnReq = document.querySelector("#search-btn");
btnReq.addEventListener("click", () => {
  resetSwiperState();
});

document.addEventListener("DOMContentLoaded", generateHourlyCards);
