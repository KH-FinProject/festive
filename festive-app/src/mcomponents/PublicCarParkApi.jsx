import { useEffect, useState } from "react";
import KakaoMap from "./KakaoMap";
import { Map, MapMarker } from "react-kakao-maps-sdk";

export default function PublicCarPark({
  lDongRegnCd,
  lDongSignguCd,
  center,
  placeName,
}) {
  const [listCarPark, setListCarPark] = useState([]);
  const [isloading, setIsLoading] = useState(true);
  const areaCode = String(lDongRegnCd) + String(lDongSignguCd);

  const fetchPublicCarPark = async () => {
    try {
      const field = encodeURIComponent("지역코드::EQ");
      const serviceKey = import.meta.env.VITE_PUBLIC_CARPARK_API;

      const url = `/carpark-api/api/15050093/v1/uddi:d19c8e21-4445-43fe-b2a6-865dff832e08?page=1&perPage=50&returnType=json&cond[${field}]=${areaCode}&serviceKey=${serviceKey}`;

      const response = await fetch(url);
      const respData = await response.json();
      const items = respData?.data;

      if (!items || !Array.isArray(items)) return;
      const mapped = items.map((item) => ({
        name: item["주차장명"],
        address: item["주차장도로명주소"],
        public: item["주차장구분"],
        mapx: item["경도"],
        mapy: item["위도"],
      }));
      setListCarPark(mapped);
    } catch (error) {
      console.error("주차장 정보 로드 실패:", error);
    }
  };

  useEffect(() => {
    fetchPublicCarPark();
  }, [areaCode]);

  useEffect(() => {
    if (listCarPark != null || listCarPark.length > 0) {
      setIsLoading(false);
    }
  }, [listCarPark]);

  if (isloading) {
    return <h1>주차장 정보 로딩중...</h1>;
  }
  return (
    <>
      {listCarPark.length > 0 ? (
        <KakaoMap center={center} markers={listCarPark} placeName={placeName} />
      ) : (
        <h1>주차장 정보 로딩 중...</h1>
      )}
    </>
  );
}
