import React, { useState } from "react";
import "./Booth.css";
import AISideMenu from "./AISideMenu";
import Title from "./Title";
import "./AISideMenu.css";
import "../monthFestive/Title.css";

// 축제 검색 모달 컴포넌트
function FestivalSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  // 임시 축제 리스트 (API 연동 시 교체)
  const festivals = [
    "서울불꽃축제",
    "부산불꽃축제",
    "대구치맥페스티벌",
    "진주남강유등축제",
    "화천산천어축제",
    "보령머드축제",
    "춘천마임축제",
    "안동국제탈춤페스티벌",
    "담양대나무축제",
    "제주들불축제",
  ];

  const handleSearch = () => {
    const filtered = festivals.filter((f) => f.includes(query));
    setResults(filtered);
  };

  if (!open) return null;
  // 오버레이 클릭 시 닫기
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
          minWidth: 320,
          position: "relative",
        }}
      >
        {/* 오른쪽 위 엑스버튼 */}
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="축제명을 입력하세요"
          style={{ width: "70%", marginRight: 8, padding: 4 }}
        />
        <button onClick={handleSearch} style={{ padding: "4px 12px" }}>
          검색
        </button>
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
              key={festival}
              onClick={() => {
                onSelect(festival);
                onClose();
              }}
              style={{
                cursor: "pointer",
                padding: "6px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              {festival}
            </li>
          ))}
          {results.length === 0 && (
            <li style={{ color: "#aaa", padding: "6px 0" }}>
              검색 결과가 없습니다.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// 플리마켓 신청 폼
const FleaMarketForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [festivalName, setFestivalName] = useState("");
  const [showFestivalModal, setShowFestivalModal] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  return (
    <div className="booth-form-container">
      <h2 className="booth-form-title">플리마켓 신청</h2>

      <div className="booth-form-fields">
        <div className="booth-form-field">
          <label className="booth-form-label">
            축제명 <span className="booth-required">*</span>
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
              onClick={() => setShowFestivalModal(true)}
              style={{ padding: "0 12px" }}
            >
              축제 검색
            </button>
          </div>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            신청자 성함 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="성함을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">연락처</label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder="연락처를 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            상호명 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="상호명을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            휴대 전화 <span className="booth-required">*</span>
          </label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder="000-0000-0000"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            일반 전화 <span className="booth-required">*</span>
          </label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder="000-000-0000"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            판매 품목 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="판매할 품목을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            상품소개 <span className="booth-required">*</span>
          </label>
          <textarea
            rows={4}
            className="booth-form-textarea"
            placeholder="상품에 대한 상세한 소개를 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">마케팅</label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="마케팅 방법을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            파일 첨부 <span className="booth-required">*</span>
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
        onSelect={setFestivalName}
      />
      <div className="booth-submit-section">
        <button className="booth-submit-button">신청하기</button>
      </div>
    </div>
  );
};

// 푸드트럭 신청 폼
const FoodTruckForm = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [festivalName, setFestivalName] = useState("");
  const [showFestivalModal, setShowFestivalModal] = useState(false);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  return (
    <div className="booth-form-container">
      <h2 className="booth-form-title">푸드트럭 신청</h2>

      <div className="booth-form-fields">
        <div className="booth-form-field">
          <label className="booth-form-label">
            축제명 <span className="booth-required">*</span>
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
              onClick={() => setShowFestivalModal(true)}
              style={{ padding: "0 12px" }}
            >
              축제 검색
            </button>
          </div>
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            신청자 성함 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="성함을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">연락처</label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder="연락처를 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            푸드트럭명 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="푸드트럭 이름을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            휴대 전화 <span className="booth-required">*</span>
          </label>
          <input
            type="tel"
            className="booth-form-input"
            placeholder="000-0000-0000"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            사업자등록번호 <span className="booth-required">*</span>
          </label>
          <input
            type="text"
            className="booth-form-input"
            placeholder="000-00-00000"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            메뉴 종류 <span className="booth-required">*</span>
          </label>
          <select className="booth-form-select">
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
            주요 메뉴 <span className="booth-required">*</span>
          </label>
          <textarea
            rows={4}
            className="booth-form-textarea"
            placeholder="주요 메뉴와 가격을 입력해주세요"
          />
        </div>

        <div className="booth-form-field">
          <label className="booth-form-label">
            트럭 크기 <span className="booth-required">*</span>
          </label>
          <select className="booth-form-select">
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
            파일 첨부 <span className="booth-required">*</span>
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
                  : "사업자등록증, 영업허가증을 첨부해주세요"}
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
        onSelect={setFestivalName}
      />
      <div className="booth-submit-section">
        <button className="booth-submit-button">신청하기</button>
      </div>
    </div>
  );
};

// 메인 컴포넌트
const Booth = () => {
  const [activeTab, setActiveTab] = useState("fleamarket");

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
              <FleaMarketForm />
            ) : (
              <FoodTruckForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booth;
