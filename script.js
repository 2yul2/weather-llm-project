const API_KEY = '33fc9866eb4ed63cc2c454eefc621600';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// UI 요소 가져오기
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const weatherBox = document.getElementById('weatherInfo');
const errorBox = document.getElementById('errorBox');

// ✅ 오류 처리 함수
function handleError(message) {
  errorBox.style.display = 'block';
  errorBox.textContent = message;
  weatherBox.style.display = 'none';
}

// ✅ 날씨 불러오기 기능
async function getWeather(city) {
  try {
    const url = `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=kr`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      handleError(data.message || '날씨 정보를 가져오지 못했습니다.');
      return;
    }

    const temp = data.main.temp;
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;

    document.getElementById(
      'weatherIcon'
    ).src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    document.getElementById('temp').textContent = `🌡 온도: ${temp}°C`;
    document.getElementById('description').textContent = `☁ 날씨: ${desc}`;

    const today = new Date();
    document.getElementById(
      'today'
    ).textContent = `📅 날짜: ${today.getFullYear()}.${
      today.getMonth() + 1
    }.${today.getDate()}`;

    errorBox.style.display = 'none';
    weatherBox.style.display = 'block';
  } catch (e) {
    handleError('네트워크 오류가 발생했습니다.');
  }
}

// 검색 버튼 클릭
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city === '') return alert('도시 이름을 입력하세요!');
  getWeather(city);
});
