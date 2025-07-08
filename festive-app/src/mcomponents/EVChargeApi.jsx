import { useEffect, useState } from "react";

const EVChargeApi = ({ metroCode, cityCode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvCharge = async () => {
      try {
        const serviceKey = import.meta.env.VITE_EVCHARGE_API;

        const url = `/kepco-api/openapi/v1/EVcharge.do?metroCd=11&cityCd=26&apiKey=${serviceKey}&returnType=json`;

        const response = await fetch(url);
        const respData = await response.json();
        const items = respData?.data;

        if (!items || !Array.isArray(items)) return;

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

      {/* <div className="festivals-grid">
        {evChargeList.map((charge) => (
          <div>{charge.stnPlace}</div>
        ))}
      </div> */}
    </>
  );
};

export default EVChargeApi;
