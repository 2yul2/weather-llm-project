/* =========================================================
    📌 사용자 정의 아이콘 매핑 함수
    - OpenWeatherMap의 icon 코드 → 내가 만든 커스텀 이미지로 교체
========================================================= */
function getCustomIconSrc(icon) {
  switch (icon) {
    // ☀️ 맑음
    case '01d':
      return 'images/sun.png'; // 낮 - 해
    case '01n':
      return 'images/moon.png'; // 밤 - 달

    // 🌤️ 약간 흐림
    case '02d':
    case '03d':
    case '04d':
      return 'images/cloud_sun.png'; // 구름 + 해
    case '02n':
    case '03n':
    case '04n':
      return 'images/cloud_moon.png'; // 구름 + 달

    // 🌧️ 비
    case '09d':
    case '09n':
    case '10d':
    case '10n':
      return 'images/rain.png';

    // ⚡ 천둥번개
    case '11d':
    case '11n':
      return 'images/thunder.png';

    // ❄ 눈
    case '13d':
    case '13n':
      return 'images/snow.png';

    // 🌫 안개
    case '50d':
    case '50n':
      return 'images/fog.png';

    // 기본값
    default:
      return 'images/default.png';
  }
}

/* =========================================================
    📌 날씨 데이터 요청 함수
    - 도시 이름을 받아 API 호출 후 결과 UI에 표시
========================================================= */
async function getWeather(cityName) {
  const API_KEY = 'YOUR_API_KEY'; // 👉 여기에 본인 API 키 넣기
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=kr`;

  try {
    const response = await fetch(url);

    // ❗ 잘못된 도시 입력 처리
    if (!response.ok) {
      alert('해당 도시를 찾을 수 없습니다!');
      return;
    }

    const data = await response.json();

    // 필요한 정보 변수로 저장
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;

    // UI 요소 업데이트
    document.getElementById('temp').textContent = `${temp}°C`;
    document.getElementById('desc').textContent = desc;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('wind').textContent = `${wind} m/s`;

    // 커스텀 아이콘 적용
    document.getElementById('weather-icon').src = getCustomIconSrc(icon);
  } catch (error) {
    console.error('날씨 불러오기 실패:', error);
    alert('날씨 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}

/* =========================================================
    📌 검색 버튼 이벤트
    - 사용자가 입력한 도시명으로 getWeather 실행
========================================================= */
document.getElementById('search-btn').addEventListener('click', function () {
  const city = document.getElementById('city-input').value.trim();

  if (city === '') {
    alert('도시 이름을 입력해주세요!');
    return;
  }

  getWeather(city);
});

/* =========================================================
    📌 Enter 키 입력 시 검색 실행
========================================================= */
document.getElementById('city-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('search-btn').click();
  }
});
