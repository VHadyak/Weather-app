import { hourlyIsActive } from "./dom";

const swiperDailyWrapper = document.querySelector(".daily-card-list");
const swiperHourlyWrapper = document.querySelector(".hourly-card-list");
const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
const visibleCards = 5; // Shows visible cards

let currentIndex = 0;

const swipeCard = (wrapper, selector) => {
  const cardWidth = document.querySelector(`.${selector}`).offsetWidth; // Get width of the card
  const gap = 40; // Gap between cards
  const offset = currentIndex * (cardWidth + gap); // Calculate by how much the card needs to move

  wrapper.style.transform = `translateX(${-offset}px)`;
};

const getTotalCards = (selector) => document.querySelectorAll(selector).length;

function forecastState() {
  const wrapper = hourlyIsActive ? swiperHourlyWrapper : swiperDailyWrapper;
  const selector = hourlyIsActive ? "hourly-card" : "daily-card";
  return { wrapper, selector };
}

// Reset to the first card while switching forecasts
export const resetSwiperState = () => {
  currentIndex = 0;
  const { wrapper, selector } = forecastState();

  // Reset position to the first card
  swipeCard(wrapper, selector);
};

// Checks the set of cards if moving to the next set or to the previous set is allowed
export default function swiperController() {
  nextBtn.addEventListener("click", () => {
    const { wrapper, selector } = forecastState();
    const totalCards = hourlyIsActive ? getTotalCards(".hourly-card") : getTotalCards(".daily-card");

    if (currentIndex < totalCards - visibleCards) {
      currentIndex++;
      swipeCard(wrapper, selector);
    }
  });

  prevBtn.addEventListener("click", () => {
    const { wrapper, selector } = forecastState();
    if (currentIndex > 0) {
      currentIndex--;
      swipeCard(wrapper, selector);
    }
  });
}
