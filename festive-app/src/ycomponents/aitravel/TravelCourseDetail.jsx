import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import "./TravelCourseDetail.css";
import logo from "../../assets/festiveLogo.png";

const TravelCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [courseDetails, setCourseDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [mapCenter, setMapCenter] = useState({
    lat: 37.5666805,
    lng: 126.9784147,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [placeImages, setPlaceImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [placeOverview, setPlaceOverview] = useState("");
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const key = import.meta.env.VITE_KAKAO_MAP_API_KEY;
  const [loadingMap, error] = useKakaoLoader({
    appkey: key,
    libraries: ["services"],
  });

  // 여행코스 데이터 가져오기
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
        const response = await fetch(
          `${baseUrl}/api/travel-course/${courseId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("여행코스를 찾을 수 없습니다.");
        }

        const data = await response.json();
        if (data.success) {
          setCourseData(data.course);
          setCourseDetails(data.details);

          // 첫 번째 장소로 지도 중심 설정
          if (data.details.length > 0) {
            const firstPlace = data.details[0];
            setMapCenter({
              lat: parseFloat(firstPlace.latitude),
              lng: parseFloat(firstPlace.longitude),
            });
          }
        } else {
          throw new Error(data.message || "데이터를 불러올 수 없습니다.");
        }
      } catch (error) {
        console.error("여행코스 데이터 로드 실패:", error);
        alert("여행코스를 불러오는데 실패했습니다.");
        navigate("/ai-travel");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, navigate]);

  // 장소의 상세 이미지들을 가져오는 함수
  const fetchPlaceImages = async (contentId) => {
    if (!contentId) return [];

    setLoadingImages(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(
        `${baseUrl}/api/ai/place-images/${contentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.images || [];
      }
    } catch (error) {
      console.error("장소 이미지 로드 실패:", error);
    } finally {
      setLoadingImages(false);
    }
    return [];
  };

  // 장소의 상세 정보(overview)를 가져오는 함수
  const fetchPlaceOverview = async (contentId) => {
    if (!contentId) {
      setPlaceOverview("");
      return;
    }

    setLoadingOverview(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(
        `${baseUrl}/api/ai/place-overview/${contentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // overview가 존재하고 실제 내용이 있는지 더 엄격하게 검사
        if (data.success && data.overview && data.overview.trim().length > 0) {
          setPlaceOverview(data.overview.trim());
        } else {
          setPlaceOverview(""); // fallback으로 AI 설명 사용
        }
      } else {
        setPlaceOverview("");
      }
    } catch (error) {
      console.error("장소 상세 정보 로드 실패:", error);
      setPlaceOverview("");
    } finally {
      setLoadingOverview(false);
    }
  };

  // 선택된 날짜의 장소들 필터링
  const getPlacesByDay = useCallback(
    (day) => {
      return courseDetails.filter((place) => place.dayNumber === day);
    },
    [courseDetails]
  );

  // 거리 계산 함수 (하버사인 공식)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km 단위
  };

  // areaCode 기준 지역명 반환
  const getRegionByAreaCode = (areaCode) => {
    if (!areaCode) return "전국";

    const areaMap = {
      1: "서울",
      2: "인천",
      3: "대전",
      4: "대구",
      5: "광주",
      6: "부산",
      7: "울산",
      8: "세종",
      31: "경기도",
      32: "강원도",
      33: "충청북도",
      34: "충청남도",
      35: "경상북도",
      36: "경상남도",
      37: "전라북도",
      38: "전라남도",
      39: "제주도",
    };
    return areaMap[areaCode] || "전국";
  };

  // place_category 기준 여행 테마 분류
  const getTravelTheme = () => {
    if (!courseDetails.length) return "종합";

    // place_category 추출
    const categories = courseDetails
      .map((place) => place.placeCategory)
      .filter(Boolean);

    if (categories.length === 0) return "종합";

    // 가장 많이 등장하는 카테고리 찾기
    const categoryCount = {};
    categories.forEach((category) => {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // 가장 빈번한 카테고리 찾기
    const maxCount = Math.max(...Object.values(categoryCount));
    const dominantCategories = Object.keys(categoryCount).filter(
      (category) => categoryCount[category] === maxCount
    );

    // 50% 이상을 차지하는 카테고리가 있으면 해당 테마로 설정
    if (
      dominantCategories.length === 1 &&
      maxCount >= categories.length * 0.5
    ) {
      return dominantCategories[0];
    }

    // 여러 카테고리가 섞인 경우 종합으로 표시
    return "종합";
  };

  // getRecommendedSeason 함수 제거됨

  // AI 장소 설명 생성
  const generateAIDescription = (place) => {
    const baseDescriptions = {
      관광지:
        "이곳은 많은 관광객들이 찾는 인기 관광명소입니다. 아름다운 경치와 특별한 체험을 즐길 수 있어요.",
      문화시설:
        "역사와 문화를 체험할 수 있는 소중한 공간입니다. 교육적 가치가 높은 다양한 전시와 프로그램을 만나보세요.",
      음식점:
        "지역 특색이 살아있는 맛집입니다. 현지 음식 문화를 경험할 수 있는 좋은 기회가 될 거예요.",
      숙박: "편안한 휴식을 위한 최적의 장소입니다. 여행의 피로를 풀고 다음 일정을 준비하세요.",
      쇼핑: "다양한 쇼핑과 구경거리가 있는 곳입니다. 여행 기념품이나 특산품을 찾아보세요.",
    };

    const category = place.placeCategory || "";
    let description = "";

    // 카테고리별 기본 설명
    if (category.includes("관광지") || category.includes("명소")) {
      description = baseDescriptions["관광지"];
    } else if (
      category.includes("문화") ||
      category.includes("박물관") ||
      category.includes("미술관")
    ) {
      description = baseDescriptions["문화시설"];
    } else if (
      category.includes("음식") ||
      category.includes("맛집") ||
      category.includes("식당")
    ) {
      description = baseDescriptions["음식점"];
    } else if (category.includes("숙박") || category.includes("호텔")) {
      description = baseDescriptions["숙박"];
    } else if (category.includes("쇼핑") || category.includes("시장")) {
      description = baseDescriptions["쇼핑"];
    } else {
      description =
        "이곳은 여행 코스의 중요한 일부입니다. 특별한 경험과 추억을 만들어보세요.";
    }

    // 추가 팁
    const tips = [
      "인생샷을 남기기 좋은 포토존이 있어요!",
      "적당한 관람 시간은 1-2시간 정도입니다.",
      "대중교통 이용 시 미리 시간을 확인해보세요.",
      "현지인에게 추천받은 숨은 매력도 찾아보세요!",
      "주변에 함께 둘러볼 만한 곳들도 체크해보세요.",
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return `${description}\n\n${randomTip}`;
  };

  // 전체 일수 계산 (먼저 계산)
  const totalDays = useMemo(() => {
    if (courseData?.totalDays) {
      return courseData.totalDays;
    }
    if (courseDetails.length === 0) {
      return 1;
    }
    return Math.max(...courseDetails.map((d) => d.dayNumber), 1);
  }, [courseData?.totalDays, courseDetails]);

  // 총 거리 계산만 유지 (소요시간 계산 제거)
  const totalDistance = useMemo(() => {
    let totalDistance = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dayPlaces = getPlacesByDay(day).sort(
        (a, b) => a.visitOrder - b.visitOrder
      );

      // 각 날짜별 장소 간 거리 계산
      for (let i = 0; i < dayPlaces.length - 1; i++) {
        const place1 = dayPlaces[i];
        const place2 = dayPlaces[i + 1];

        if (
          place1.latitude &&
          place1.longitude &&
          place2.latitude &&
          place2.longitude
        ) {
          const distance = calculateDistance(
            place1.latitude,
            place1.longitude,
            place2.latitude,
            place2.longitude
          );
          totalDistance += distance;
        }
      }
    }

    return Math.round(totalDistance * 10) / 10; // 소수점 첫째자리
  }, [getPlacesByDay, totalDays]);

  // 장소 클릭 핸들러 수정
  const handlePlaceClick = async (place, index) => {
    setSelectedPlace(place);
    setMapCenter({
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    });

    // 사이드 패널 표시
    setShowSidePanel(true);
    setCurrentImageIndex(0); // 슬라이더 인덱스 초기화

    // 병렬로 장소 이미지와 상세 정보 가져오기
    if (place.contentId) {
      const [images, overview] = await Promise.all([
        fetchPlaceImages(place.contentId),
        fetchPlaceOverview(place.contentId),
      ]);
      setPlaceImages(images);
      // fetchPlaceOverview는 내부에서 setPlaceOverview를 호출하므로 추가 처리 불필요
    } else {
      setPlaceImages([]);
      setPlaceOverview("");
    }
  };

  // 사이드 패널 닫기
  const closeSidePanel = () => {
    setShowSidePanel(false);
    setSelectedPlace(null);
    setPlaceImages([]);
    setPlaceOverview("");
    setCurrentImageIndex(0);
  };

  // 모든 이미지들 (기본 이미지 + detailImage2 이미지들) 결합
  const getAllImages = () => {
    const images = [];

    // 기본 이미지 추가
    if (selectedPlace?.placeImage) {
      images.push({
        url: selectedPlace.placeImage,
        alt: selectedPlace.placeName,
        type: "main",
      });
    }

    // detailImage2에서 가져온 이미지들 추가
    placeImages.forEach((image, index) => {
      images.push({
        url: image.originImgUrl,
        alt: `${selectedPlace?.placeName} ${index + 1}`,
        type: "detail",
      });
    });

    // 이미지가 없으면 로고 추가
    if (images.length === 0) {
      images.push({
        url: logo,
        alt: selectedPlace?.placeName || "기본 이미지",
        type: "default",
      });
    }

    return images;
  };

  // 슬라이더 네비게이션 함수들
  const nextImage = () => {
    const allImages = getAllImages();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    const allImages = getAllImages();
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // 선택된 날짜의 마커들과 경로
  const dayPlaces = getPlacesByDay(selectedDay);
  const polylinePath = dayPlaces
    .sort((a, b) => a.visitOrder - b.visitOrder)
    .filter((place) => place.latitude && place.longitude)
    .map((place) => ({
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    }));

  if (loading || loadingMap) {
    return (
      <div className="travel-detail-loading">
        <div>여행코스 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="travel-detail-error">
        <div>지도를 불러올 수 없습니다.</div>
        <button onClick={() => window.location.reload()}>새로고침</button>
      </div>
    );
  }

  return (
    <div className="travel-detail-container">
      {/* 왼쪽 코스 정보 패널 */}
      <div
        className={`travel-detail-sidebar ${
          showSidePanel ? "with-side-panel" : ""
        }`}
      >
        <div className="travel-detail-header">
          <button
            className="travel-detail-back-btn"
            onClick={() => navigate("/ai-travel")}
          >
            ← 목록으로 돌아가기
          </button>

          <div className="travel-detail-course-info">
            <h1>{courseData?.courseTitle}</h1>
            <div className="travel-detail-meta">
              <span className="travel-detail-region">
                {courseData?.areaCode
                  ? getRegionByAreaCode(courseData.areaCode)
                  : courseData?.regionName || "전국"}
              </span>
              <span className="travel-detail-days">{totalDays}일 코스</span>
            </div>
            <div className="travel-detail-date">
              {courseData?.createdDate
                ? new Date(courseData.createdDate).toLocaleDateString("ko-KR")
                : "날짜 미정"}
            </div>

            {/* 작성자 정보 */}
            <div className="travel-detail-author">
              <img
                src={courseData?.memberProfileImage || logo}
                alt="작성자"
                className="travel-detail-author-profile"
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
              <div className="travel-detail-author-info">
                <h4>
                  {courseData?.memberNickname ||
                    courseData?.memberName ||
                    "알 수 없음"}
                </h4>
                <p>여행코스 작성자</p>
              </div>
            </div>

            {/* 코스 소개 */}
            <div className="travel-detail-description">
              <h4>코스 소개</h4>
              {courseData?.courseDescription &&
              courseData.courseDescription.trim().length > 0 ? (
                // AI가 생성한 day별 코스 설명을 표시
                <div className="travel-detail-ai-description">
                  {courseData.courseDescription
                    .split("\n")
                    .map((line, index) => {
                      // 빈 줄 처리
                      if (!line.trim()) {
                        return <br key={index} />;
                      }

                      const trimmedLine = line.trim();

                      // Day 제목 처리
                      if (trimmedLine.match(/^Day\s*\d+/)) {
                        return (
                          <h5 key={index} className="travel-detail-day-title">
                            {trimmedLine}
                          </h5>
                        );
                      }

                      // 장소 리스트 (- 로 시작하는 줄) 처리
                      if (trimmedLine.startsWith("- ")) {
                        return (
                          <div key={index} className="travel-detail-place-item">
                            {trimmedLine.substring(2)}
                          </div>
                        );
                      }

                      // 포인트 처리
                      if (trimmedLine.startsWith("포인트:")) {
                        return (
                          <div key={index} className="travel-detail-point">
                            <strong>
                              💡 {trimmedLine.substring(3).trim()}
                            </strong>
                          </div>
                        );
                      }

                      // 일반 텍스트
                      return <p key={index}>{trimmedLine}</p>;
                    })}
                </div>
              ) : (
                // 기본 설명
                <p>
                  {courseDetails.length > 0
                    ? `${
                        courseData?.areaCode
                          ? getRegionByAreaCode(courseData.areaCode)
                          : courseData?.regionName || "이 지역"
                      }에서 즐기는 특별한 여행코스입니다. 총 ${
                        courseDetails.length
                      }개의 엄선된 장소들을 통해 ${getTravelTheme()} 중심의 다채로운 경험을 만끽하실 수 있습니다. 각 장소마다 고유한 매력과 이야기가 있으니 천천히 둘러보시며 소중한 추억을 만들어보세요.`
                    : "특별히 선별된 여행코스입니다. AI가 추천하는 맞춤형 여행 경험을 통해 새로운 발견과 즐거움을 찾아보세요."}
                </p>
              )}
            </div>

            {/* 여행 정보 */}
            <div className="travel-detail-info">
              <div className="travel-detail-info-item">
                <span className="label">총 장소</span>
                <span className="value">{courseDetails.length}곳</span>
              </div>
              <div className="travel-detail-info-item">
                <span className="label">여행 테마</span>
                <span className="value">{getTravelTheme()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 일차별 탭 */}
        <div className="travel-detail-day-tabs">
          {Array.from({ length: totalDays }, (_, index) => index + 1).map(
            (day) => (
              <button
                key={day}
                className={`travel-detail-day-tab ${
                  selectedDay === day ? "active" : ""
                }`}
                onClick={() => setSelectedDay(day)}
              >
                Day {day}
              </button>
            )
          )}
        </div>

        {/* 선택된 날짜의 장소 목록 */}
        <div className="travel-detail-places">
          {dayPlaces.length > 0 ? (
            dayPlaces
              .sort((a, b) => a.visitOrder - b.visitOrder)
              .map((place, index) => (
                <div
                  key={place.detailNo}
                  className="travel-detail-place-card"
                  onClick={() => handlePlaceClick(place, index)}
                >
                  <div className="travel-detail-place-number">{index + 1}</div>
                  <div className="travel-detail-place-image">
                    <img
                      src={place.placeImage || logo}
                      alt={place.placeName}
                      onError={(e) => {
                        e.target.src = logo;
                      }}
                    />
                  </div>
                  <div className="travel-detail-place-info">
                    <h3>{place.placeName}</h3>
                    <p className="travel-detail-place-address">
                      {place.placeAddress}
                    </p>
                    {place.placeTel && (
                      <p className="travel-detail-place-tel">
                        📞 {place.placeTel}
                      </p>
                    )}
                    {place.placeCategory && (
                      <span className="travel-detail-place-category">
                        {place.placeCategory}
                      </span>
                    )}
                  </div>
                  <div className="travel-detail-place-ai-hint">상세</div>
                </div>
              ))
          ) : (
            <div className="travel-detail-no-places">
              <p>Day {selectedDay}에 등록된 장소가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 가운데 지도 */}
      <div
        className={`travel-detail-map-container ${
          showSidePanel ? "with-side-panel" : ""
        }`}
      >
        <Map
          center={mapCenter}
          style={{
            width: "100%",
            height: "100%",
          }}
          level={8}
        >
          {/* 선택된 날짜의 마커들 */}
          {dayPlaces.map((place, index) => {
            if (!place.latitude || !place.longitude) return null;

            return (
              <MapMarker
                key={place.detailNo}
                position={{
                  lat: parseFloat(place.latitude),
                  lng: parseFloat(place.longitude),
                }}
                image={{
                  src: `data:image/svg+xml;base64,${btoa(`
                    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="#FF6B6B"/>
                      <circle cx="15" cy="15" r="8" fill="white"/>
                      <text x="15" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B6B">${
                        index + 1
                      }</text>
                    </svg>
                  `)}`,
                  size: { width: 30, height: 40 },
                }}
                title={`${index + 1}. ${place.placeName}`}
                onClick={() => {
                  setMapCenter({
                    lat: parseFloat(place.latitude),
                    lng: parseFloat(place.longitude),
                  });
                }}
              />
            );
          })}

          {/* 장소들을 연결하는 선 */}
          {polylinePath.length > 1 && (
            <Polyline
              path={polylinePath}
              strokeWeight={3}
              strokeColor="#FF6B6B"
              strokeOpacity={0.8}
              strokeStyle="solid"
            />
          )}
        </Map>
      </div>

      {/* 오른쪽 사이드 패널 (장소 상세 정보) */}
      {showSidePanel && selectedPlace && (
        <div className="travel-detail-place-panel">
          <div className="travel-detail-place-panel-header">
            <h3>상세 가이드</h3>
            <button
              className="travel-detail-place-panel-close"
              onClick={closeSidePanel}
            >
              ✕
            </button>
          </div>

          <div className="travel-detail-place-panel-content">
            {/* 장소 이미지 슬라이더 */}
            <div className="travel-detail-place-info-section">
              <div className="travel-detail-place-slider">
                {loadingImages ? (
                  <div className="travel-detail-slider-loading">
                    <img src={logo} alt="로딩중" />
                    <div className="loading-text">이미지를 불러오는 중...</div>
                  </div>
                ) : (
                  <>
                    <div className="travel-detail-slider-container">
                      <div
                        className="travel-detail-slider-track"
                        style={{
                          transform: `translateX(-${currentImageIndex * 100}%)`,
                        }}
                      >
                        {getAllImages().map((image, index) => (
                          <div
                            key={index}
                            className="travel-detail-slider-slide"
                          >
                            <img
                              src={image.url}
                              alt={image.alt}
                              onError={(e) => {
                                e.target.src = logo;
                              }}
                              className="travel-detail-slider-image"
                            />
                          </div>
                        ))}
                      </div>

                      {/* 슬라이더 내비게이션 버튼 */}
                      {getAllImages().length > 1 && (
                        <>
                          <button
                            className="travel-detail-slider-nav travel-detail-slider-nav-prev"
                            onClick={prevImage}
                            aria-label="이전 이미지"
                          >
                            ❮
                          </button>
                          <button
                            className="travel-detail-slider-nav travel-detail-slider-nav-next"
                            onClick={nextImage}
                            aria-label="다음 이미지"
                          >
                            ❯
                          </button>
                        </>
                      )}
                    </div>

                    {/* 슬라이더 인디케이터 */}
                    {getAllImages().length > 1 && (
                      <div className="travel-detail-slider-indicators">
                        {getAllImages().map((_, index) => (
                          <button
                            key={index}
                            className={`travel-detail-slider-indicator ${
                              currentImageIndex === index ? "active" : ""
                            }`}
                            onClick={() => goToImage(index)}
                            aria-label={`이미지 ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* 이미지 카운터 */}
                    {getAllImages().length > 1 && (
                      <div className="travel-detail-slider-counter">
                        {currentImageIndex + 1} / {getAllImages().length}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="travel-detail-place-basic-info">
                <h4>{selectedPlace.placeName}</h4>
                <p className="place-address">{selectedPlace.placeAddress}</p>
                {selectedPlace.placeTel && (
                  <p className="place-tel">📞 {selectedPlace.placeTel}</p>
                )}
                {selectedPlace.placeCategory && (
                  <span className="place-category">
                    {selectedPlace.placeCategory}
                  </span>
                )}
              </div>
            </div>

            {/* 지역 정보 */}
            <div className="travel-detail-place-description-section">
              <h5>지역 정보</h5>
              <div className="travel-detail-ai-description-content">
                {loadingOverview ? (
                  <div className="overview-loading">
                    <p>상세 정보를 불러오는 중...</p>
                  </div>
                ) : placeOverview && placeOverview.trim().length > 0 ? (
                  <div className="overview-content">
                    {placeOverview.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <div className="overview-fallback">
                    {generateAIDescription(selectedPlace)
                      .split("\n\n")
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="travel-detail-place-actions">
              <button
                className="travel-detail-action-btn primary"
                onClick={() => {
                  window.open(
                    `https://map.kakao.com/link/map/${selectedPlace.placeName},${selectedPlace.latitude},${selectedPlace.longitude}`,
                    "_blank"
                  );
                }}
              >
                카카오맵에서 보기
              </button>
              <button
                className="travel-detail-action-btn secondary"
                onClick={() => {
                  window.open(
                    `https://map.kakao.com/link/to/${selectedPlace.placeName},${selectedPlace.latitude},${selectedPlace.longitude}`,
                    "_blank"
                  );
                }}
              >
                길찾기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelCourseDetail;
