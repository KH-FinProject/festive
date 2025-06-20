// Weather.jsx
import { useEffect, useState } from "react";

const Weather = ({ iconSize = 50 }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const key = import.meta.env.VITE_WEATHER_KEY;
    if (!key) {
      setError("날씨 API 키가 설정되지 않았습니다.");
      return;
    }

    const fetchWeather = async (lat, lon) => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=kr`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("날씨 정보를 가져오는데 실패했습니다.");
        }
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
        console.error("Weather API Error:", err);
      }
    };

    const fetchDefaultWeather = async () => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${key}&units=metric&lang=kr`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("날씨 정보를 가져오는데 실패했습니다.");
        }
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
        console.error("Weather API Error:", err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchDefaultWeather();
        }
      );
    } else {
      fetchDefaultWeather();
    }
  }, []);

  if (error)
    return (
      <span style={{ fontSize: "0.9rem", color: "#666" }}>
        날씨 정보를 불러올 수 없습니다.
      </span>
    );
  if (!weather)
    return (
      <span style={{ fontSize: "0.9rem", color: "#666" }}>
        날씨 불러오는 중...
      </span>
    );

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.9rem",
      }}
    >
      <img
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        alt="날씨"
        style={{ width: iconSize, height: iconSize }}
      />
      {Math.round(weather.main.temp)}°C
      <span style={{ fontSize: "0.75rem", color: "#666" }}>
        ({weather.name})
      </span>
    </span>
  );
};

export default Weather;
