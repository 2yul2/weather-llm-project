/* ------------------------
    이미지 코드를 커스텀 아이콘 파일로 변환
-------------------------*/
function getCustomIconSrc(icon) {
  switch (icon) {
    case '01d':
    case '01n':
      return 'images/sun.png';

    case '02d':
    case '02n':
    case '03d':
    case '03n':
    case '04d':
    case '04n':
      return 'images/cloud.png';

    case '09d':
    case '09n':
    case '10d':
    case '10n':
    case '11d':
    case '11n':
      return 'images/rain.png';

    case '13d':
    case '13n':
      return 'images/snow.png';

    case '50d':
    case '50n':
      return 'images/wind.png';
  }
}

/* ------------------------
    날씨 코드 + 낮/밤 시간에 따라 배경 변경
-------------------------*/
function updateBackground(weatherCode) {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  let bg = '';

  if (weatherCode === 'sun') {
    bg = isDay ? 'images/sunAfternoon.jpeg' : 'images/sunNight.jpeg';
  } else if (weatherCode === 'cloud') {
    bg = isDay ? 'images/cloudAfternoon.jpeg' : 'images/cloudNight.jpeg';
  } else if (weatherCode === 'rain') {
    bg = isDay ? 'images/rainAfternoon.jpeg' : 'images/rainNight.jpeg';
  } else if (weatherCode === 'snow') {
    bg = isDay ? 'images/snowAfternoon.jpeg' : 'images/snowNight.jpeg';
  } else if (weatherCode === 'wind') {
    bg = isDay ? 'images/windAfternoon.jpeg' : 'images/windNight.jpeg';
  }

  document.body.style.backgroundImage = `url('${bg}')`;
}

/* 날씨 아이콘 → 배경 카테고리 코드 변환 */
function getWeatherCode(icon) {
  if (['01d', '01n'].includes(icon)) return 'sun';
  if (['02d', '02n', '03d', '03n', '04d', '04n'].includes(icon)) return 'cloud';
  if (['09d', '09n', '10d', '10n', '11d', '11n'].includes(icon)) return 'rain';
  if (['13d', '13n'].includes(icon)) return 'snow';
  if (['50d', '50n'].includes(icon)) return 'wind';
  return 'sun';
}

/* ------------------------
    API URL / 요소 선택 등 전역 설정
-------------------------*/
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
let currentTempC = null;
let isCelsius = true;

/* ------------------------
    첫 페이지 로딩 시: 제목 숨김
-------------------------*/
document.querySelectorAll('.subtitle').forEach((el) => {
  el.classList.add('hidden');
});

/* ------------------------
    섭씨/화씨 변환 기능
-------------------------*/
function convertTemp() {
  if (currentTempC === null) return;

  if (isCelsius) {
    const f = (currentTempC * 9) / 5 + 32;
    document.getElementById('temp').textContent = `🌡 온도: ${f.toFixed(1)}°F`;
    unitToggle.textContent = '화씨 → 섭씨';
    isCelsius = false;
  } else {
    document.getElementById('temp').textContent = `🌡 온도: ${currentTempC}°C`;
    unitToggle.textContent = '섭씨 → 화씨';
    isCelsius = true;
  }
}
unitToggle.addEventListener('click', convertTemp);

/* ------------------------
    오류 메시지 표시 + UI 재정리
-------------------------*/
function handleError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');

  weatherBox.classList.add('hidden');
  aqiBox.classList.add('hidden');

  document.querySelectorAll('.subtitle').forEach((el) => {
    el.classList.add('hidden');
  });
}

/* ------------------------
    공기질(AQI) 등급 텍스트 변환
-------------------------*/
function getAqiText(aqi) {
  if (aqi === 1) return '좋음 😀';
  if (aqi === 2) return '보통 🙂';
  if (aqi === 3) return '나쁨 😐';
  if (aqi === 4) return '매우 나쁨 😷';
  if (aqi === 5) return '위험 ☠️';
  return '정보 없음';
}

/* ------------------------
    공기질 데이터 요청
-------------------------*/
async function getAirQuality(lat, lon) {
  try {
    const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.list.length) return;

    const aqi = data.list[0].main.aqi;
    aqiValue.textContent = `AQI 지수: ${aqi}`;
    aqiDesc.textContent = getAqiText(aqi);

    aqiBox.classList.remove('hidden');
  } catch {}
}

/* ------------------------
    현재 날씨 정보 요청
-------------------------*/
async function getWeather(lat, lon, cityName) {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) return handleError(data.message);

    displayWeather(data, cityName);
    getForecast(lat, lon);
    getAirQuality(lat, lon);
    updateRecentSearches(cityName);
  } catch {
    handleError('네트워크 오류가 발생하였습니다.');
  }
}

/* ------------------------
    받아온 날씨 정보를 화면에 표시
-------------------------*/
function displayWeather(data, cityName) {
  const temp = data.main.temp;
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;

  document.getElementById('cityName').textContent = cityName;

  currentTempC = temp;
  isCelsius = true;
  unitToggle.textContent = '섭씨 → 화씨';

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

  updateBackground(getWeatherCode(icon));

  weatherBox.classList.remove('hidden');
  document.querySelectorAll('.subtitle').forEach((el) => {
    el.classList.remove('hidden');
  });
}

/* ------------------------
    온도 기반 옷차림 추천
-------------------------*/
function clothingRecommendation(t) {
  if (t >= 28) return '👕 아주 더워요! 반팔 또는 민소매를 입으세요.';
  if (t >= 23) return '👚 따뜻해요! 반팔 + 얇은 셔츠가 딱 좋겠어요.';
  if (t >= 17) return '🧥 선선합니다! 얇은 가디건을 추천할게요.';
  if (t >= 10) return '🧥 쌀쌀해요! 자켓과 니트를 입는건 어떠세요?';
  if (t >= 5) return '🧥🧣 코트가 필요할 것 같아요!';
  return '🧥🧤 매우 추움! 패딩은 필수.';
}

/* ------------------------
    3일 예보 요청 & 표시
-------------------------*/
async function getForecast(lat, lon) {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
  const res = await fetch(url);
  const data = await res.json();

  forecastContainer.innerHTML = '';

  const daily = data.list.filter((x) => x.dt_txt.includes('12:00')).slice(0, 3);

  daily.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';

    card.innerHTML = `
      <h4>${d.dt_txt.split(' ')[0]}</h4>
      <img src="${getCustomIconSrc(d.weather[0].icon)}" alt="">
      <p>${d.main.temp}°C</p>
      <p>${d.weather[0].description}</p>
    `;

    forecastContainer.appendChild(card);
  });

  renderHourlyChart(data.list);
}

/* ------------------------
    단기 시간별 온도 차트 생성
-------------------------*/
function renderHourlyChart(list) {
  const hourly = list.slice(0, 8);
  const labels = hourly.map((x) => x.dt_txt.split(' ')[1].slice(0, 5));
  const temps = hourly.map((x) => x.main.temp);

  const ctx = document.getElementById('hourlyChart').getContext('2d');

  if (hourlyChart) hourlyChart.destroy();

  hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '시간별 온도(°C)',
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

/* ------------------------
    도시명 → 좌표 검색
-------------------------*/
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

/* ------------------------
    최근 검색 저장 & 버튼 생성
-------------------------*/
function updateRecentSearches(city) {
  recentSearches = recentSearches.filter((c) => c !== city);
  recentSearches.unshift(city);

  if (recentSearches.length > 5) recentSearches.pop();

  localStorage.setItem('recentCities', JSON.stringify(recentSearches));

  renderRecent();
}

function renderRecent() {
  recentContainer.innerHTML = '';

  recentSearches.forEach((c) => {
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.onclick = () => searchCity(c);
    recentContainer.appendChild(btn);
  });
}

/* ------------------------
    검색 버튼/엔터 입력 → 검색 실행
-------------------------*/
async function searchCity(city) {
  const coord = await getCoordinates(city);
  if (!coord) return;
  getWeather(coord.lat, coord.lon, coord.name);
}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) return alert('도시를 입력하세요!');
  searchCity(city);
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

renderRecent();

/* ------------------------
    페이지 로드 시 초기 UI 숨김
-------------------------*/
function hideAllInitially() {
  weatherBox.classList.add('hidden');
  aqiBox.classList.add('hidden');
  document.querySelector('.chart-container').classList.add('hidden');
  forecastContainer.innerHTML = '';
}

hideAllInitially();
