import {
  CustomOverlayMap,
  Map,
  MapMarker,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import { useState, useEffect, useRef } from "react";

// 거리 계산
const getDistanceFromLatLonInMeter = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

export default function KakaoMap({ center, markers, placeName }) {
  const key = import.meta.env.VITE_KAKAO_MAP_API_KEY;
  const [loading, error] = useKakaoLoader({
    appkey: key,
    libraries: ["services", "clusterer"],
  });

  const [isReady, setIsReady] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const radius = 1000; // 1km
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let timeoutId;

    if (!loading && !error) {
      // SDK 로딩 완료 후 더 안전한 지연시간 설정
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, error]);

  useEffect(() => {
    // 맵 인스턴스가 생성되면 크기 재조정
    if (mapInstance) {
      const timer = setTimeout(() => {
        mapInstance.relayout();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [mapInstance]);

  // 맵 생성 실패 시 재시도 로직
  const handleMapError = () => {
    if (retryCount.current < maxRetries) {
      retryCount.current += 1;
      console.log(`지도 로딩 재시도 ${retryCount.current}/${maxRetries}`);

      setTimeout(() => {
        setIsReady(false);
        setTimeout(() => setIsReady(true), 500);
      }, 1000);
    }
  };

  // 맵 생성 성공 시 콜백
  const handleMapCreated = (map) => {
    setMapInstance(map);
    retryCount.current = 0; // 성공하면 재시도 카운트 초기화
    // 맵 크기 재조정 (컨테이너 크기 변경 대응)
    setTimeout(() => {
      map.relayout();
    }, 100);
  };

  console.log(
    "지도 로딩 상태:",
    loading,
    "준비 상태:",
    isReady,
    "재시도 횟수:",
    retryCount.current
  );

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "395px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          color: "#666",
        }}
      >
        지도 로딩 실패: {error.message}
        <button
          onClick={() => window.location.reload()}
          style={{ marginLeft: "10px", padding: "5px 10px" }}
        >
          새로고침
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div
        style={{
          width: "100%",
          height: "395px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          color: "#666",
        }}
      >
        지도 로딩 중...
        {retryCount.current > 0 &&
          ` (재시도 중: ${retryCount.current}/${maxRetries})`}
      </div>
    );
  }

  return (
    <Map
      center={center}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
      }}
      onCreate={handleMapCreated}
      onError={handleMapError}
      level={3} // 기본 줌 레벨 설정
    >
      <MapMarker position={center} />
      <CustomOverlayMap position={center} yAnchor={2.2}>
        <div
          style={{
            padding: "6px 10px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
            color: "#333",
            fontWeight: "500",
            fontSize: "14px",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {placeName}
        </div>
      </CustomOverlayMap>

      {/* 마커 여러 개 꽂기 */}
      <div>
        {markers.map((marker, index) => {
          const distance = getDistanceFromLatLonInMeter(
            center.lat,
            center.lng,
            marker.mapy, // 위도
            marker.mapx // 경도
          );

          if (distance <= radius && marker.public == "공영") {
            return (
              <MapMarker
                key={index}
                position={{ lat: marker.mapy, lng: marker.mapx }}
                image={{
                  src: "../../carPark.png",
                  size: { width: 24, height: 24 },
                }}
                title={marker.title}
                onClick={() => setInfo(index)}
              >
                {info === index && (
                  <div style={{ margin: "0 2px", fontSize: "14px" }}>
                    {marker.name} <br />
                    <a
                      href={`https://map.kakao.com/link/map/${marker.name},${marker.mapy},${marker.mapx}`}
                      style={{
                        color: "#333",
                        fontWeight: "500",
                        fontSize: "14px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      큰지도보기
                    </a>{" "}
                    <a
                      href={`https://map.kakao.com/link/to/${marker.name},${marker.mapy},${marker.mapx}`}
                      style={{
                        color: "#333",
                        fontWeight: "500",
                        fontSize: "14px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      길찾기
                    </a>
                  </div>
                )}
              </MapMarker>
            );
          }
          return null;
        })}
      </div>
    </Map>
  );
}
