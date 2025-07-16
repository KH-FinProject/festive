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

export default function PublicCarParkWithMap({
  lDongRegnCd,
  lDongSignguCd,
  center,
  placeName,
  onMarkerClick,
}) {
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

  // 주차장 관련 state
  const [listCarPark, setListCarPark] = useState([]);
  const [isParkingLoading, setIsParkingLoading] = useState(true);
  const areaCode = String(lDongRegnCd) + String(lDongSignguCd);

  // 공영주차장 데이터 가져오기
  const fetchPublicCarPark = async () => {
    try {
      const field = encodeURIComponent("지역코드::EQ");
      const serviceKey = import.meta.env.VITE_PUBLIC_CARPARK_API;

      // 디버깅: serviceKey 값 확인
      console.log("🔍 VITE_PUBLIC_CARPARK_API:", serviceKey);
      console.log("🔍 serviceKey length:", serviceKey?.length);
      console.log("🔍 All env vars:", import.meta.env);

      // areaCode 검증
      if (!areaCode || areaCode.includes("undefined") || !serviceKey) {
        setListCarPark([]);
        setIsParkingLoading(false);
        return;
      }

      // 모든 환경에서 직접 API 호출
      const url = `https://api.odcloud.kr/api/15050093/v1/uddi:d19c8e21-4445-43fe-b2a6-865dff832e08?page=1&perPage=1000&returnType=json&cond[${field}]=${areaCode}&serviceKey=${serviceKey}`;
      const response = await fetch(url);
      const respData = await response.json();
      const items = respData?.data;
      if (!items || !Array.isArray(items)) {
        setListCarPark([]);
        setIsParkingLoading(false);
        return;
      }

      const mapped = items.map((item) => ({
        name: item["주차장명"],
        address: item["주차장도로명주소"],
        jibunAddr: item["주차장지번주소"],
        public: item["주차장구분"],
        mapx: item["경도"],
        mapy: item["위도"],
      }));

      const list = mapped.filter(
        (carpark) =>
          typeof carpark.public === "string" && carpark.public.includes("공영")
      );

      setListCarPark(list);
      setIsParkingLoading(false);
    } catch (error) {
      console.error("주차장 정보 로드 실패:", error);
      setListCarPark([]);
      setIsParkingLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCarPark();
  }, [areaCode]);

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

  // 마커 클릭 핸들러
  const handleMarkerClick = (index, marker) => {
    setInfo(index);

    // A 컴포넌트로 데이터 전달
    const markerData = {
      name: marker.name,
      address: marker.address,
      jibunAddr: marker.jibunAddr,
    };

    // 부모 컴포넌트로 데이터 전달
    if (onMarkerClick) {
      onMarkerClick(markerData);
    }
  };

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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        center={center}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
        }}
        level={3} // 기본 줌 레벨 설정
        onCreate={(map) => setMapInstance(map)}
      >
        {/* 메인 장소 마커 */}
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

        {/* 공영주차장 마커들 (있을 경우에만) */}
        {listCarPark.length > 0 && (
          <div>
            {listCarPark.map((marker, index) => {
              const distance = getDistanceFromLatLonInMeter(
                center.lat,
                center.lng,
                marker.mapy, // 위도
                marker.mapx // 경도
              );

              if (distance <= radius) {
                return (
                  <MapMarker
                    key={index}
                    position={{ lat: marker.mapy, lng: marker.mapx }}
                    image={{
                      src: "../../carPark.png",
                      size: { width: 24, height: 24 },
                    }}
                    title={marker.name}
                    onClick={() => handleMarkerClick(index, marker)}
                  >
                    {info === index && (
                      <div style={{ margin: "0 2px", fontSize: "13px" }}>
                        {marker.name} <br />
                        <a
                          href={`https://map.kakao.com/link/map/${marker.name},${marker.mapy},${marker.mapx}`}
                          style={{
                            color: "#333",
                            fontWeight: "500",
                            fontSize: "12px",
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
                            fontSize: "12px",
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
        )}
      </Map>

      {/* 주차장 정보 로딩 상태 표시 */}
      {isParkingLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#666",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          주차장 정보 로딩 중...
        </div>
      )}

      {/* 주차장이 없을 때 안내 메시지 */}
      {!isParkingLoading && listCarPark.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#666",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          주변에 공영주차장이 없습니다
        </div>
      )}
    </div>
  );
}
