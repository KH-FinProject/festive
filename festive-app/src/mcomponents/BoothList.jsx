import { useEffect, useState } from "react";
import axiosApi from "../api/axiosAPI";
import "./BoothList.css";

export default function BoothList() {
  const [boothList, setBoothList] = useState([]);

  useEffect(() => {
    const fetchBoothList = async () => {
      try {
        const resp = await axiosApi.get("/booth/list");
        setBoothList(resp.data);
      } catch {
        setBoothList([]);
      }
    };
    fetchBoothList();
  }, []);

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
