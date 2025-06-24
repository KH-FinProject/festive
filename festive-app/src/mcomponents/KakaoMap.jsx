import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { useState, useEffect } from "react";

export default function KakaoMap({ center }) {
  const key = import.meta.env.VITE_KAKAO_MAP_API_KEY;
  const [loading, error] = useKakaoLoader({
    appkey: key, // JavaScript 키
    libraries: ["services", "clusterer"],
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (!loading && !error) {
      // 약간의 지연을 두어 SDK 완전 초기화 대기
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, error]);

  console.log("지도 로딩 상태:", loading, "준비 상태:", isReady);

  // 에러 처리
  if (error) return <div>지도 로딩 실패: {error.message}</div>;

  // 준비되지 않았으면 로딩 표시
  if (!isReady) return <div>지도 로딩 중...</div>;

  return (
    <Map
      center={center}
      style={{
        width: "100%",
        height: "395px",
        margin: "1px 0",
        borderRadius: "8px",
      }}
    >
      <MapMarker position={center}></MapMarker>
    </Map>
  );
}
