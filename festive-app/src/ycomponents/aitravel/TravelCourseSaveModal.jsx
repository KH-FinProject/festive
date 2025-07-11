import React, { useState } from "react";
import "./TravelCourseSaveModal.css";
import useAuthStore from "../../store/useAuthStore";
import logo from "../../assets/festiveLogo.png";

const TravelCourseSaveModal = ({ isOpen, onClose, onSave, travelData }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);

  // 🔐 로그인 상태 확인
  const { isLoggedIn } = useAuthStore();

  // 모달이 열릴 때마다 초기화
  React.useEffect(() => {
    if (isOpen) {
      setCourseTitle("");
      setIsShared(false);
      setIsSubmitting(false);
      // 첫 번째 이미지를 기본 썸네일로 설정
      if (travelData?.locations && travelData.locations.length > 0) {
        const firstImageLocation = travelData.locations.find(
          (loc) => loc.image && loc.image.trim()
        );
        setSelectedThumbnail(firstImageLocation?.image || logo);
      } else {
        setSelectedThumbnail(logo);
      }
    }
  }, [isOpen, travelData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔐 모달에서도 로그인 상태 재확인
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.\n다시 로그인해주세요!");
      onClose();
      return;
    }

    if (!courseTitle.trim()) {
      alert("여행코스 제목을 입력해주세요.");
      return;
    }

    if (
      !travelData ||
      !travelData.locations ||
      travelData.locations.length === 0
    ) {
      alert("저장할 여행 장소가 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 저장 데이터 구성
      const saveData = {
        courseTitle: courseTitle.trim(),
        isShared: isShared ? "Y" : "N",
        thumbnailImage: selectedThumbnail || logo,
        regionName: travelData.regionName || "",
        areaCode: travelData.areaCode || "",
        totalDays: travelData.totalDays || 1,
        requestType: travelData.requestType || "travel_only",
        courseDescription: travelData.courseDescription || "", // AI가 생성한 day별 코스 설명
        locations: travelData.locations.map((location, index) => ({
          name: location.name,
          address: location.address || "",
          latitude: location.latitude,
          longitude: location.longitude,
          image: location.image || null,
          tel: location.tel || null,
          category: location.category || "관광지",
          contentId: location.contentId || null,
          contentTypeId: location.contentTypeId || null,
          day: location.day || 1,
          order: location.order || index + 1,
        })),
      };

      await onSave(saveData);
    } catch (error) {
      console.error("❌ 저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="save-modal" onClick={(e) => e.stopPropagation()}>
        <div className="save-modal__header">
          <h2>여행코스 저장</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="save-modal__content">
          <form onSubmit={handleSubmit}>
            {/* 여행코스 미리보기 */}
            <div className="preview-section">
              <h3>여행코스 미리보기</h3>
              <div className="preview-info">
                <p>
                  <strong>기간:</strong>{" "}
                  {`Day${travelData?.totalDays || 1} 코스`}
                </p>
                <p>
                  <strong>장소 수:</strong> {travelData?.locations?.length || 0}
                  개
                </p>
              </div>

              {travelData?.locations && travelData.locations.length > 0 && (
                <div className="thumbnail-section">
                  <h4>썸네일 선택</h4>
                  <div className="thumbnail-grid">
                    {/* 로고 이미지 */}
                    <div
                      className={`thumbnail-item ${
                        selectedThumbnail === logo ? "selected" : ""
                      }`}
                      onClick={() => setSelectedThumbnail(logo)}
                    >
                      <img src={logo} alt="기본 로고" />
                      <span className="thumbnail-label">기본 이미지</span>
                    </div>

                    {/* 여행지 이미지들 */}
                    {travelData.locations
                      .filter(
                        (location) =>
                          location.image &&
                          location.image.trim() &&
                          location.image !== logo
                      )
                      .map((location, index) => (
                        <div
                          key={index}
                          className={`thumbnail-item ${
                            selectedThumbnail === location.image
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => setSelectedThumbnail(location.image)}
                        >
                          <img
                            src={location.image}
                            alt={location.name}
                            onError={(e) => {
                              e.target.src = logo;
                            }}
                          />
                          <span className="thumbnail-label">
                            {location.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {travelData?.locations && travelData.locations.length > 0 && (
                <div className="preview-locations">
                  <h4>주요 장소들</h4>
                  <div className="location-chips">
                    {travelData.locations.slice(0, 3).map((location, index) => (
                      <span key={index} className="location-chip">
                        {location.name}
                      </span>
                    ))}
                    {travelData.locations.length > 3 && (
                      <span className="location-chip more">
                        +{travelData.locations.length - 3}개 장소
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 제목 입력 */}
            <div className="input-section">
              <label htmlFor="courseTitle">
                여행코스 제목 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="courseTitle"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="예: 부산 2박3일 맛집 투어"
                maxLength={100}
                required
              />
              <small>{courseTitle.length}/100자</small>
            </div>

            {/* 공유 설정 */}
            <div className="input-section">
              <label className="share-option">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                />
                <span className="checkmark"></span>
                <div className="share-text">
                  <strong>모든 사용자와 공유</strong>
                  <small>
                    체크하면 다른 사용자들도 이 여행코스를 볼 수 있습니다.
                  </small>
                </div>
              </label>
            </div>

            {/* 버튼 영역 */}
            <div className="button-section">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={isSubmitting || !courseTitle.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    저장 중...
                  </>
                ) : (
                  <>저장</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TravelCourseSaveModal;
