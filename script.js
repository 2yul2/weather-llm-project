function getCustomIconSrc(icon) {
  switch (icon) {
    case '01d': // 맑은 낮
    case '01n': // 맑은 밤
      return 'images/sun.png';
    case '02d': // 약간 흐림 낮
    case '02n': // 약간 흐림 밤
    case '03d': // 구름 조금
    case '03n':
    case '04d': // 구름 많음
    case '04n':
      return 'images/cloud.png';
    case '09d': // 소나기
    case '09n':
    case '10d': // 비
    case '10n':
    case '11d': // 뇌우
    case '11n':
      return 'images/rain.png';
    case '13d': // 눈
    case '13n':
      return 'images/snow.png';
    case '50d': // 안개, 연기, 바람 등
    case '50n':
      return 'images/wind.png';
    default:
      return `https://openweathermap.org/img/wn/${icon}@2x.png`; // 기본 아이콘
  }
}

const API_KEY = '33fc9866eb4ed63cc2c454eefc621600';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const weatherBox = document.getElementById('weatherInfo');
const errorBox = document.getElementById('errorBox');
const forecastContainer = document.getElementById('forecastContainer');
const recentContainer = document.getElementById('recentContainer');
const unitToggle = document.getElementById('unitToggle');
const aqiBox = document.getElementById('aqiBox');
const aqiValue = document.getElementById('aqiValue');
const aqiDesc = document.getElementById('aqiDesc');
const clothingTip = document.getElementById('clothingTip');

let hourlyChart = null;
let recentSearches = JSON.parse(localStorage.getItem('recentCities')) || [];

// --------------------------------------
// 에러 표시
// --------------------------------------
function handleError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  weatherBox.classList.add('hidden');
  aqiBox.classList.add('hidden');
}

// --------------------------------------
// 미세먼지 지수 텍스트
// --------------------------------------
function getAqiText(aqi) {
  if (aqi === 1) return '좋음 😀';
  if (aqi === 2) return '보통 🙂';
  if (aqi === 3) return '나쁨 😐';
  if (aqi === 4) return '매우 나쁨 😷';
  if (aqi === 5) return '위험 ☠️';
  return '정보 없음';
}

// --------------------------------------
// 미세먼지 API
// --------------------------------------
async function getAirQuality(lat, lon) {
  try {
    const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.list || !data.list.length) return;

    const aqi = data.list[0].main.aqi;

    aqiValue.textContent = `AQI 지수: ${aqi}`;
    aqiDesc.textContent = getAqiText(aqi);

    aqiBox.classList.remove('hidden');
  } catch {
    console.log('AQI 오류');
  }
}

// --------------------------------------
// 차트 렌더링
// --------------------------------------
function renderHourlyChart(list) {
  const hourly = list.slice(0, 8); // 24시간 (3시간 간격)
  const labels = hourly.map((item) => item.dt_txt.split(' ')[1].slice(0, 5));
  const temps = hourly.map((item) => item.main.temp);

  const ctx = document.getElementById('hourlyChart').getContext('2d');

  if (hourlyChart) hourlyChart.destroy();

  hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '온도(°C)',
          data: temps,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  document.querySelector('.chart-container').classList.remove('hidden');
}

// --------------------------------------
// 현재 날씨
// --------------------------------------
async function getWeather(lat, lon, cityName) {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) return handleError(data.message);

    displayWeather(data);
    getForecast(lat, lon);
    getAirQuality(lat, lon);

    updateRecentSearches(cityName);
  } catch {
    handleError('네트워크 오류가 발생했습니다.');
  }
}

function displayWeather(data) {
  const temp = data.main.temp;
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;

  document.getElementById('weatherIcon').src = getCustomIconSrc(icon);

  document.getElementById('temp').textContent = `🌡 온도: ${temp}°C`;
  document.getElementById('description').textContent = `☁ 상태: ${desc}`;
  document.getElementById(
    'humidity'
  ).textContent = `💧 습도: ${data.main.humidity}%`;
  document.getElementById(
    'wind'
  ).textContent = `🌬 풍속: ${data.wind.speed} m/s`;

  const today = new Date();
  document.getElementById(
    'today'
  ).textContent = `📅 날짜: ${today.getFullYear()}.${
    today.getMonth() + 1
  }.${today.getDate()}`;

  clothingTip.textContent = clothingRecommendation(temp);

  weatherBox.classList.remove('hidden');
}

// --------------------------------------
// 옷차림 추천
// --------------------------------------
function clothingRecommendation(t) {
  if (t >= 28) return '👕 엄청 더워요! 반팔, 민소매 추천';
  if (t >= 23) return '👚 따뜻해요! 반팔+가벼운 셔츠';
  if (t >= 17) return '🧥 선선~ 얇은 가디건 추천';
  if (t >= 10) return '🧥 쌀쌀! 자켓, 니트';
  if (t >= 5) return '🧥🧣 코트, 두꺼운 옷 추천';
  return '🧥🧤 매우 추움! 패딩 필수!';
}

// --------------------------------------
// 예보
// --------------------------------------
async function getForecast(lat, lon) {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
  const res = await fetch(url);
  const data = await res.json();

  forecastContainer.innerHTML = '';

  // 3일 예보 (정오)
  const daily = data.list.filter((x) => x.dt_txt.includes('12:00')).slice(0, 3);

  daily.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h4>${d.dt_txt.split(' ')[0]}</h4>
      <img src="${getCustomIconSrc(d.weather[0].icon)}" />
      <p>${d.main.temp}°C</p>
      <p>${d.weather[0].description}</p>
    `;
    forecastContainer.appendChild(card);
  });

  renderHourlyChart(data.list);
}

// --------------------------------------
// 도시 → 좌표 변환
// (한국어 검색 지원)
// --------------------------------------
async function getCoordinates(city) {
  const url = `${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.length) {
    handleError('해당 도시를 찾을 수 없습니다.');
    return null;
  }

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].local_names?.ko || data[0].name,
  };
}

// --------------------------------------
// 최근 검색어
// --------------------------------------
function updateRecentSearches(city) {
  recentSearches = recentSearches.filter((c) => c !== city);
  recentSearches.unshift(city);
  if (recentSearches.length > 5) recentSearches.pop();
  localStorage.setItem('recentCities', JSON.stringify(recentSearches));
  renderRecent();
}

function renderRecent() {
  recentContainer.innerHTML = '';
  recentSearches.forEach((city) => {
    const btn = document.createElement('button');
    btn.textContent = city;
    btn.onclick = () => searchCity(city);
    recentContainer.appendChild(btn);
  });
}

// --------------------------------------
// 검색
// --------------------------------------
async function searchCity(city) {
  const coord = await getCoordinates(city);
  if (!coord) return;
  getWeather(coord.lat, coord.lon, coord.name);
}

// 검색 버튼
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) return alert('도시를 입력하세요!');
  searchCity(city);
});

// Enter
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// 초기 렌더링
renderRecent();
