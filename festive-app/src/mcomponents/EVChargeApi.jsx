import { useEffect, useState } from "react";

const EVChargeApi = ({ metroCode, cityCode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [evChargeList, setEvChargeList] = useState([]);
  console.log("metroCode:", metroCode); // ✅ undefined 아닌지 꼭 확인!!!
  console.log("cityCode:", cityCode);

  useEffect(() => {
    const fetchEvCharge = async () => {
      try {
        const serviceKey = import.meta.env.VITE_EVCHARGE_API;

        const url = `/kepco-api/openapi/v1/EVcharge.do?metroCd=${metroCode}&cityCd=11&apiKey=${serviceKey}&returnType=json`;

        console.log("최종 요청 주소:", url);

        const response = await fetch(url);
        const respData = await response.json();
        console.log("응답 데이터:", respData);
        const items = respData?.data;

        if (!items || !Array.isArray(items)) return;

        const mapped = items.map((item) => ({
          metro: item.metro,
          city: item.city,
          stnPlace: item.stnPlace,
          stnAddr: item.stnAddr,
          rapidCnt: item.rapidCnt,
          slowCnt: item.slowCnt,
          carType: item.carType,
        }));

        setEvChargeList(mapped);
        setIsLoading(false);
      } catch (error) {
        console.error("충전소 정보 로드 실패:", error);
      }
    };

    fetchEvCharge();
  }, [metroCode, cityCode]);

  if (isLoading) {
    return <h3>전기차 충전소 API 로딩중...</h3>;
  }

  return (
    <>
      {/* <KakaoMap center={{ lat: festival.mapy, lng: festival.mapx }} /> */}
      <h1>하이하이 여기까지 잘왔어~</h1>
    </>
  );
};

export default EVChargeApi;
