import "normalize.css";
import "./styles/styles.css";

import { initFetch } from "./modules/weatherData.js";
import swiper from "./modules/swiper.js";

swiper();
initFetch();
