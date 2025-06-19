// Weather.jsx
import {useEffect, useState} from "react";

const Weather = ({ iconSize = 30 }) => {
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        const key = import.meta.env.VITE_WEATHER_KEY;

        const fetchWeather = (lat, lon) => {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=kr`;
            fetch(url)
                .then(res => res.json())
                .then(setWeather);
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${key}&units=metric&lang=kr`)
                        .then(res => res.json())
                        .then(setWeather);
                }
            );
        }
    }, []);

    if (!weather) return <span>날씨 불러오는 중...</span>;

    return (
        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem" }}>
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
