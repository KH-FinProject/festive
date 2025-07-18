import React, { useState, useEffect } from "react";
import "./Booth.css";
import AISideMenu from "./AISideMenu";
import Title from "./Title";
import "./AISideMenu.css";
import "../monthFestive/Title.css";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";
import { useLocation } from "react-router-dom";

// 투어 API 연동 함수 (LocalFestive.jsx 방식 fetch 기반)
async function fetchFestivals({ keyword, region, startDate, endDate }) {
  const formatDate = (dateStr) => (dateStr ? dateStr.replaceAll("-", "") : "");
  const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
  const params = new URLSearchParams({
    MobileOS: "WEB",
    MobileApp: "Festive",
    _type: "json",
    arrange: "A",
    numOfRows: "10000",
    pageNo: "1",
  });
  if (startDate) params.append("eventStartDate", formatDate(startDate));
  if (endDate) params.append("eventEndDate", formatDate(endDate));
  if (region) params.append("areaCode", region); // region은 areaCode로 전달
  if (keyword) params.append("keyword", keyword);
  const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&${params.toString()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data?.response?.body?.items?.item;
    if (!items) return [];
    // 종료된 축제 제외
    const filtered = Array.isArray(items)
      ? items.filter((item) => {
        const start = item.eventstartdate;
        const end = item.eventenddate;
        if (getFestivalStatus(start, end) === "종료") return false;
        return true;
      })
      : [items];
    return filtered.map((item) => {
      const start = item.eventstartdate;
      const end = item.eventenddate;
      return {
        contentId: item.contentid,
        title: item.title,
        eventStartDate: start
          ? `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`
          : "",
        eventEndDate: end
          ? `${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}`
          : "",
        region: item.areacode || region || "",
        image: item.firstimage || "/logo.png",
        location: item.addr1 || "장소 미정",
      };
    });
  } catch (error) {
    console.error("축제 검색 실패:", error);
    return [];
  }
}

// getFestivalStatus 함수도 LocalFestive.jsx와 동일하게 추가
function getFestivalStatus(start, end) {
  if (!start || !end) return "예정";
  const now = new Date();
  const startDate = new Date(
    `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`
  );
  const endDate = new Date(
    `${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}`
  );
  if (now < startDate) return "예정";
  else if (now > endDate) return "종료";
  else return "진행중";
}

// 축제 검색 모달 컴포넌트
function FestivalSearchModal({ open, onClose, onSelect, areaOptions }) {
  const [region, setRegion] = useState(""); // 초기값은 전체(빈 문자열)

  // areaOptions와 safeAreaOptions 콘솔 출력 (필요시 유지)
  useEffect(() => {
    console.log("areaOptions:", areaOptions);
    const safeAreaOptions =
      areaOptions.length > 0
        ? [
          ...new Map(
            areaOptions.map((area) => [area.areaName, area])
          ).values(),
        ]
        : [{ areaName: "서울", areaCode: "1" }];
    console.log("safeAreaOptions:", safeAreaOptions);
  }, [areaOptions]);

  // safeAreaOptions에 '전체' 옵션을 항상 첫 번째로 추가
  const safeAreaOptions = [
    { areaName: "전체", areaCode: "" },
    ...(areaOptions.length > 0
      ? [...new Map(areaOptions.map((area) => [area.areaName, area])).values()]
      : [{ areaName: "서울", areaCode: "1" }]),
  ];

  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 실시간 검색 (입력값이 바뀔 때마다 자동으로 목록 갱신)
  React.useEffect(() => {
    let ignore = false;
    async function fetchList() {
      setLoading(true);
      try {
        let festivals = await fetchFestivals({
          keyword: "", // TourAPI는 keyword 미지원이므로 빈값 전달
          region,
          startDate,
          endDate,
        });
        // 축제명(query)로 프론트에서 필터링
        if (query) {
          const lowerQuery = query.toLowerCase();
          festivals = festivals.filter(
            (f) => f.title && f.title.toLowerCase().includes(lowerQuery)
          );
        }
        if (!ignore) setResults(festivals);
      } catch {
        if (!ignore) setResults([]);
      }
      if (!ignore) setLoading(false);
    }
    if (open) fetchList();
    return () => {
      ignore = true;
    };
  }, [query, region, startDate, endDate, open]);

  // (삭제) areaOptions가 바뀌어도 region을 강제로 '서울'로 세팅하지 않음
  // useEffect(() => {
  //   if (
  //     (!region || !safeAreaOptions.some((a) => a.areaCode === region)) &&
  //     safeAreaOptions.length > 0
  //   ) {
  //     const seoulCode = getSeoulAreaCode();
  //     if (seoulCode) setRegion(seoulCode);
  //   }
  // }, [areaOptions]);

  if (!open) return null;
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="modal"
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          width: 500,
          maxWidth: "90vw",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "none",
            fontSize: 20,
            cursor: "pointer",
          }}
          aria-label="닫기"
        >
          ×
        </button>
        <h3 style={{ marginBottom: 12 }}>축제 검색</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="축제명"
              style={{ flex: 2, padding: 4, minWidth: 120 }}
            />
            <select
              className="search-input location-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {safeAreaOptions.map((area) => (
                <option key={area.areaCode} value={area.areaCode}>
                  {area.areaName}
                </option>
              ))}
            </select>
          </div>
          {/* 날짜 입력을 한 줄에 배치 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
            }}
          >
            <input
              id="searchStartDate"
              type="date"
              className="search-input date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="시작일"
              style={{ minWidth: 120 }}
            />
            <span style={{ fontWeight: "bold", fontSize: 18, margin: "0 4px" }}>
              ~
            </span>
            <input
              id="searchEndDate"
              type="date"
              className="search-input date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="종료일"
              style={{ minWidth: 120 }}
            />
          </div>
        </div>
        {loading ? (
          <div>로딩중...</div>
        ) : (
          <ul
            style={{
              marginTop: 16,
              maxHeight: 180,
              overflowY: "auto",
              padding: 0,
            }}
          >
            {results.map((festival) => (
              <li
                key={festival.contentId}
                onClick={() => {
                  onSelect({
                    title: festival.title,
                    contentId: festival.contentId,
                  });
                  onClose();
                }}
                style={{
                  cursor: "pointer",
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <b>{festival.title}</b>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {festival.region} | {festival.eventStartDate} ~{" "}
                  {festival.eventEndDate}
                </div>
              </li>
            ))}
            {results.length === 0 && (
              <li style={{ color: "#aaa", padding: "6px 0" }}>
                검색 결과가 없습니다.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

// 플리마켓 신청 폼
const FleaMarketForm = ({ areaOptions, contentId, contentTitle }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [festivalName, setFestivalName] = useState(contentTitle || "");
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");
  const [item, setItem] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  // 상태 추가
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [license, setLicense] = useState("");
  const [formContentId, setFormContentId] = useState(contentId || "");
  const { member } = useAuthStore();
  const memberNo = member?.memberNo;
  // const [applyContentId, setApplyContentId] = useState(contentId || "");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !festivalName ||
      !name ||
      !shop ||
      !phone ||
      !item ||
      !startDate ||
      !endDate ||
      !selectedFile
    ) {
      alert("모든 필수 항목을 입력/선택해 주세요.");
      return;
    }
    if (!memberNo) {
      alert("로그인 후 신청 가능합니다.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("memberNo", memberNo); // 로그인 사용자 번호 추가
      formData.append("applicantName", name);
      formData.append("applicantCompany", shop); // 플리마켓: shop, 푸드트럭: truck
      formData.append("boothTel", phone);
      formData.append("products", item); // 플리마켓: item, 푸드트럭: menu
      formData.append("boothStartDate", startDate);
      formData.append("boothEndDate", endDate);
      formData.append("contentId", formContentId);
      formData.append("contentTitle", festivalName);
      formData.append("boothType", 1); // 플리마켓: 1로 전송
      formData.append("image", selectedFile);
      // 영업허가증, 트럭크기 등은 formData에 추가하지 않음

      await axios.post("/api/booth/request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("신청이 완료되었습니다!");
      setFestivalName("");
      setName("");
      setShop("");
      setPhone("");
      setItem("");
      setDesc("");
      setSelectedFile(null);
    } catch {
      alert("신청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booth-form-container">
      <h2 className="booth-form-title">플리마켓 신청</h2>

      <div className="booth-form-fields">
        <div className="booth-form-field">
          <label className="booth-form-label">
            축제명 <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="booth-form-input"
              placeholder="축제를 선택하세요"
              value={festivalName}
              readOnly
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="festival-search-btn"
              onClick={() => setShowFestivalModal(true)}
              style={{ padding: "0 12px" }}
            >
              축제 검색
            </button>
          </div>
        </div>
        <div className="booth-form-field" style={{ display: "none" }}>
          <label className="booth-form-label">
            축제 ID(contentId) <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            value={formContentId}
            disabled
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            시작 날짜 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="booth-form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="booth-form-field">
          <label className="booth-form-label">
            끝 날짜 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="booth-form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            신청자 성함 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="성함을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            상호명 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="상호명을 입력해주세요"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            휴대 전화 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder=" - 는 제외하고 작성해 주세요 "
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            판매 품목 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="판매할 품목을 입력해주세요"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            상품소개 <span style={{ color: "red" }}>*</span>
          </label>
          <textarea
            rows={4}
            className="booth-form-textarea"
            placeholder="상품에 대한 상세한 소개를 입력해주세요"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            대표이미지 <span style={{ color: "red" }}>*</span>
          </label>
          <div className="booth-file-upload">
            <input
              type="file"
              id="fleamarket-file"
              className="booth-file-input"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="fleamarket-file" className="booth-file-label">
              <div className="booth-file-upload-icon">+</div>
              <p className="booth-file-upload-text">
                {selectedFile ? selectedFile.name : "파일을 첨부해주세요"}
              </p>
            </label>{" "}
          </div>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            영업허가증 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="영업허가증 번호를 입력해주세요"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">기타의견</label>
          <textarea
            rows={3}
            className="booth-form-textarea"
            placeholder="기타 의견이나 요청사항을 입력해주세요"
          />
        </div>
      </div>

      <FestivalSearchModal
        open={showFestivalModal}
        onClose={() => setShowFestivalModal(false)}
        onSelect={({ title, contentId }) => {
          setFestivalName(title);
          setFormContentId(contentId);
        }}
        areaOptions={areaOptions}
      />
      <div className="booth-submit-section">
        <button
          className="booth-submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "신청 중..." : "신청하기"}
        </button>
      </div>
    </div>
  );
};

// 푸드트럭 신청 폼
const FoodTruckForm = ({ areaOptions, contentId, contentTitle }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [festivalName, setFestivalName] = useState(contentTitle || "");
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [name, setName] = useState("");
  const [truck, setTruck] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [menu, setMenu] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(false);
  // 날짜 상태 추가
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // FoodTruckForm 등에서 contentId 상태 추가
  const [truckContentId, setTruckContentId] = useState(contentId || "");
  const { member } = useAuthStore();
  const memberNo = member?.memberNo;
  // const [applyContentId, setApplyContentId] = useState(contentId || "");

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // startDate, endDate가 이 컴포넌트의 상태임을 명확히 사용
    const boothStartDate = startDate;
    const boothEndDate = endDate;
    if (
      !festivalName ||
      !name ||
      !truck ||
      !phone ||
      !menu ||
      !boothStartDate ||
      !boothEndDate ||
      !license ||
      selectedFiles.length === 0
    ) {
      alert("모든 필수 항목을 입력/선택해 주세요.");
      return;
    }
    if (!memberNo) {
      alert("로그인 후 신청 가능합니다.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("memberNo", memberNo); // 로그인 사용자 번호 추가
      formData.append("applicantName", name);
      formData.append("applicantCompany", truck); // 푸드트럭명은 applicantCompany로 보냄
      formData.append("boothTel", phone);
      formData.append("products", menu); // 메뉴 종류를 products로 보냄
      formData.append("boothStartDate", boothStartDate);
      formData.append("boothEndDate", boothEndDate);
      formData.append("contentId", truckContentId);
      formData.append("contentTitle", festivalName);
      formData.append("boothType", 2); // 푸드트럭: 2로 전송
      formData.append("image", selectedFiles[0]);
      // 영업허가증, 트럭크기 등은 formData에 추가하지 않음

      await axios.post("/api/booth/request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("신청이 완료되었습니다!");
      setFestivalName("");
      setName("");
      setTruck("");
      setPhone("");
      setLicense("");
      setMenu("");
      setSize("");
      setSelectedFiles([]);
      setStartDate("");
      setEndDate("");
    } catch {
      alert("신청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booth-form-container">
      <h2 className="booth-form-title">푸드트럭 신청</h2>

      <div className="booth-form-fields">
        <div className="booth-form-field">
          <label className="booth-form-label">
            축제명 <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="booth-form-input"
              placeholder="축제를 선택하세요"
              value={festivalName}
              readOnly
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="festival-search-btn"
              onClick={() => setShowFestivalModal(true)}
              style={{ padding: "0 12px" }}
            >
              축제 검색
            </button>
          </div>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            시작 날짜 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="booth-form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="booth-form-field">
          <label className="booth-form-label">
            끝 날짜 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="booth-form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            신청자 성함 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="성함을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            푸드트럭명 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="푸드트럭 이름을 입력해주세요"
            value={truck}
            onChange={(e) => setTruck(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            휴대 전화 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder=" - 는 제외하고 작성해 주세요 "
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            영업허가증 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="영업허가증 번호를 입력해주세요"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            메뉴 종류 <span style={{ color: "red" }}>*</span>
          </label>
          <select
            className="booth-form-select"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
          >
            <option value="">메뉴 종류를 선택해주세요</option>
            <option value="한식">한식</option>
            <option value="중식">중식</option>
            <option value="일식">일식</option>
            <option value="양식">양식</option>
            <option value="분식">분식</option>
            <option value="디저트">디저트</option>
            <option value="음료">음료</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            트럭 크기 <span style={{ color: "red" }}>*</span>
          </label>
          <select
            className="booth-form-select"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option value="">트럭 크기를 선택해주세요</option>
            <option value="소형">소형 (1톤 이하)</option>
            <option value="중형">중형 (1톤 ~ 2.5톤)</option>
            <option value="대형">대형 (2.5톤 이상)</option>
          </select>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">영업허가증</label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="영업허가증 번호를 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            파일 첨부 <span style={{ color: "red" }}>*</span>
          </label>
          <div className="booth-file-upload">
            <input
              type="file"
              id="foodtruck-file"
              className="booth-file-input"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
            />
            <label htmlFor="foodtruck-file" className="booth-file-label">
              <div className="booth-file-upload-icon">+</div>
              <p className="booth-file-upload-text">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length}개 파일 선택됨`
                  : "사업자등록증, 영업허가증 및 대표이미지를 첨부해주세요"}
              </p>
            </label>
          </div>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">기타의견</label>
          <textarea
            rows={3}
            className="booth-form-textarea"
            placeholder="기타 의견이나 요청사항을 입력해주세요"
          />
        </div>
      </div>

      <FestivalSearchModal
        open={showFestivalModal}
        onClose={() => setShowFestivalModal(false)}
        onSelect={({ title, contentId }) => {
          setFestivalName(title);
          setTruckContentId(contentId);
        }}
        areaOptions={areaOptions}
      />
      <div className="booth-submit-section">
        <button
          className="booth-submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "신청 중..." : "신청하기"}
        </button>
      </div>
    </div>
  );
};

// 메인 컴포넌트
const Booth = () => {
  const [activeTab, setActiveTab] = useState("fleamarket");
  const [areaOptions, setAreaOptions] = useState([]);

  useEffect(() => {
    async function fetchAreas() {
      try {
        const axiosApi = (await import("../../api/axiosAPI")).default;
        const response = await axiosApi.get(
          `${import.meta.env.VITE_API_URL}/area/areas`
        );
        setAreaOptions(response.data);
      } catch {
        setAreaOptions([]);
      }
    }
    fetchAreas();
  }, []);

  // 신청한 축제 정보 불러오기
  const location = useLocation();
  const { contentId, contentTitle, category } = location.state || {};

  // category 값이 있으면 강제로 activeTab 세팅 가능
  useEffect(() => {
    if (category) {
      setActiveTab(category); // "fleamarket" 또는 "foodtruck"
    }
  }, [category]);

  return (
    <div className="booth-page">
      <Title />
      {/* 이미지가 들어갈 div */}
      <div className="booth-hero-image">
        {/* 여기에 이미지를 삽입하시면 됩니다 */}
      </div>
      <div className="booth-container">
        <div className="booth-main-content">
          <AISideMenu activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* 메인 콘텐츠 */}
          <div className="booth-form-wrapper">
            {activeTab === "fleamarket" ? (
              <FleaMarketForm
                areaOptions={areaOptions}
                contentId={contentId}
                contentTitle={contentTitle}
              />
            ) : (
              <FoodTruckForm
                areaOptions={areaOptions}
                contentId={contentId}
                contentTitle={contentTitle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booth;
