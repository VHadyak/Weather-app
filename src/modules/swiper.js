const swiperWrapper = document.querySelector(".daily-card-list");
const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
const totalCards = document.querySelectorAll(".daily-card").length;

let currentIndex = 0;
const visibleCards = 5; // Shows cards in total
const gap = 40; // Gap between cards

const updateSwiper = () => {
  const cardWidth = document.querySelector(".daily-card").offsetWidth; // Get width of the card
  const moveCard = currentIndex * (cardWidth + gap); // Calculate how much the card needs to move

  swiperWrapper.style.transform = `translateX(${-moveCard}px)`;
};

// Checks the set of cards if moving to the next set or to the previous set is allowed
export function swiperController() {
  nextBtn.addEventListener("click", () => {
    if (currentIndex < totalCards - visibleCards) {
      currentIndex++;
      updateSwiper();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSwiper();
    }
  });
}
