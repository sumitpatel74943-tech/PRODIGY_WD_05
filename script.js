const apiKey = "f00c38e0279b7bc85480c3fe775d518c";
const weatherURL = "https://api.openweathermap.org/data/2.5/weather";
const forecastURL = "https://api.openweathermap.org/data/2.5/forecast";

let unit = "metric";
let currentCity = "Mumbai";
let clockInterval = null;

// Country full name
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/* ================= INIT ================= */
$(document).ready(() => {
  weatherFn(currentCity);
});

/* ================= SEARCH ================= */
$("#search-btn").click(() => {
  const city = $("#city-input").val().trim();
  if (!city) return alert("Enter city name");
  currentCity = city;
  weatherFn(city);
});

/* ================= UNIT TOGGLE ================= */
$("#unit-toggle").click(() => {
  unit = unit === "metric" ? "imperial" : "metric";
  $("#unit-toggle").text(unit === "metric" ? "°C" : "°F");
  weatherFn(currentCity);
});

/* ================= LIVE LOCAL CLOCK ================= */
function startClock(timezoneSeconds) {
  clearInterval(clockInterval);

  function updateClock() {
    const nowUTC =
      Date.now() + new Date().getTimezoneOffset() * 60000;
    const cityNow = new Date(nowUTC + timezoneSeconds * 1000);

    $("#date").text(
      moment(cityNow).format("dddd, MMMM D • hh:mm:ss A")
    );
  }

  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

/* ================= BACKGROUND (DAY/NIGHT/RAIN/SNOW) ================= */
function setBackground(weather, data) {
  const nowUTCsec =
    Math.floor(Date.now() / 1000) +
    new Date().getTimezoneOffset() * 60;

  const cityNow = nowUTCsec + data.timezone;

  const isDay =
    cityNow >= data.sys.sunrise &&
    cityNow < data.sys.sunset;

  let img = "Day.jpg";
  if (weather.includes("rain")) img = "Rainy.jpg";
  else if (weather.includes("snow")) img = "Snow.jpg";
  else if (!isDay) img = "night.jpg";

  document.body.style.backgroundImage = `url("${img}")`;
}

/* ================= RAIN EFFECT ================= */
function toggleRain(show) {
  const rain = $("#rain");
  rain.empty();

  if (!show) {
    rain.hide();
    return;
  }

  rain.show();
  for (let i = 0; i < 60; i++) {
    rain.append(`
      <div class="drop" style="
        left:${Math.random() * window.innerWidth}px;
        animation-duration:${0.6 + Math.random()}s;">
      </div>
    `);
  }
}

/* ================= TEMP GRADIENT ================= */
function setTempGradient(temp) {
  const el = document.getElementById("temperature");
  if (temp <= 10)
    el.style.backgroundImage =
      "linear-gradient(#00c6ff,#0072ff)";
  else if (temp <= 25)
    el.style.backgroundImage =
      "linear-gradient(#43e97b,#38f9d7)";
  else
    el.style.backgroundImage =
      "linear-gradient(#f85032,#e73827)";
}

/* ================= MAIN WEATHER ================= */
async function weatherFn(city) {
  $("#loader").show();

  const res = await fetch(
    `${weatherURL}?q=${city}&appid=${apiKey}&units=${unit}`
  );
  const data = await res.json();

  if (!res.ok) {
    $("#loader").hide();
    alert("City not found");
    return;
  }

  const weather = data.weather[0].main.toLowerCase();

  setBackground(weather, data);
  toggleRain(weather.includes("rain"));
  setTempGradient(data.main.temp);
  startClock(data.timezone);

  $("#weather-info").show();
  $("#city-name").text(data.name);
  $("#country-name").text(countryNames.of(data.sys.country));
  $("#temperature").text(`${Math.round(data.main.temp)}°`);
  $("#description").text(data.weather[0].description);
  $("#wind-speed").text(`Wind: ${data.wind.speed} m/s`);

  $("#weather-icon").attr(
    "src",
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
  );

  getFiveDayForecast(city);
  $("#loader").hide();
}

/* ================= 5-DAY FORECAST ONLY ================= */
async function getFiveDayForecast(city) {
  const res = await fetch(
    `${forecastURL}?q=${city}&appid=${apiKey}&units=${unit}`
  );
  const data = await res.json();

  $("#forecast-cards").empty();

  data.list
    .filter(item => item.dt_txt.includes("12:00:00"))
    .forEach(day => {
      $("#forecast-cards").append(`
        <div class="forecast-card">
          <p><strong>${moment(day.dt_txt).format("ddd")}</strong></p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
          <p>${Math.round(day.main.temp)}°</p>
        </div>
      `);
    });
}
