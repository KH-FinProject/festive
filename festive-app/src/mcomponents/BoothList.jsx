import { useEffect, useState } from "react";
import axiosApi from "../api/axiosAPI";
import "./BoothList.css";

export default function BoothList({ contentId }) {
  const [boothList, setBoothList] = useState([]);

  const fetchBoothList = async () => {
    try {
      const resp = await axiosApi.get("/festival/detail/BoothList", {
        params: {
          contentId: contentId,
        },
      });

      const data = resp.data;
      if (resp.status == 200) {
        setBoothList(data);
      }
    } catch (error) {
      console.log("축제 부스 리스트 소환 중 에러 발생 : ", error);
    }
  };

  useEffect(() => {
    fetchBoothList();
  }, [contentId]);

  return (
    <section className="detail-booth-section">
      {boothList != null && boothList.length > 0 && (
        <>
          <h3 className="section-title">푸드트럭 & 플리마켓</h3>
          <div className="booth-cards-container">
            {boothList.map((booth, index) => (
              <div key={index} className="booth-card">
                <div className="booth-image-container">
                  <img
                    src={booth.boothImg != null ? booth.boothImg : "/logo.png"}
                    alt="대표사진"
                    className="booth-main-image"
                  />
                </div>
                <div className="booth-content">
                  <h4 className="booth-title">{booth.applicantCompany}</h4>
                  <p className="booth-description">{booth.products}</p>
                  <p className="booth-date">
                    {booth.boothStartDate}~{booth.boothEndDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
