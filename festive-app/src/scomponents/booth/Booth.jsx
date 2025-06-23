import React, { useState } from "react";
import "./Booth.css";
import AISideMenu from "./AISideMenu";
import Title from "./Title";
import "./AISideMenu.css";
import "../monthFestive/Title.css";

// 플리마켓 신청 폼
const FleaMarketForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);

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

      <div className="booth-submit-section">
        <button className="booth-submit-button">신청하기</button>
      </div>
    </div>
  );
};

// 푸드트럭 신청 폼
const FoodTruckForm = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);

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
