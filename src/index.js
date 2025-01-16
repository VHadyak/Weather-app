import "normalize.css";
import "./styles/styles.css";

import { initFetch } from "./modules/weatherData.js";
import { swiperController } from "./modules/swiper.js";

swiperController();
initFetch();
