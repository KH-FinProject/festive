import "./This-month-festive.css";
import { useEffect, useState, useRef, useCallback } from "react";
import Title from "./Title.jsx";
import ExpandingCards from "./Month-Slider.jsx";
import ScrollToTop from "./ScrollToTop.jsx";
import { useNavigate } from "react-router-dom";

const FestivalMainPage = () => {
  // 축제 목록 상태
  const [sortType, setSortType] = useState("date"); // 'date', 'distance', 'popularity'
  const [sliderFestivals, setSliderFestivals] = useState([]);
  const [listFestivals, setListFestivals] = useState([]);
  const [originalListFestivals, setOriginalListFestivals] = useState([]); // 원본 데이터 보존
  const [userLocation, setUserLocation] = useState(null); // 사용자 위치
  const navigate = useNavigate();

  // 무한 스크롤을 위한 상태
  const [page, setPage] = useState(1); // 현재 페이지
  const [hasMore, setHasMore] = useState(true); // 더 많은 데이터 존재 여부
  const [isInitialLoading, setIsInitialLoading] = useState(false); // 최초 전체 로딩
  const [isMoreLoading, setIsMoreLoading] = useState(false); // 추가(무한 스크롤) 로딩
  const [displayedFestivals, setDisplayedFestivals] = useState([]); // 화면에 표시할 축제
  const [pageSize] = useState(12); // 한 번에 로드할 개수

  // Intersection Observer 관련 ref
  const observerRef = useRef();
  const loadingRef = useRef();
  const isMounted = useRef(false);

  // 사용자 위치 가져오기
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("이 브라우저에서는 위치 기반 서비스를 지원하지 않습니다.")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("위치 가져오기 실패:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5분
        }
      );
    });
  };

  // 위치 권한 요청 및 확인
  const requestLocationPermission = async () => {
    try {
      const location = await getUserLocation();
      return location;
    } catch (error) {
      console.error("위치 권한 요청 실패:", error);
      throw error;
    }
  };

  // 거리순 정렬 함수 (투어API 사용)
  const sortByDistance = async () => {
    try {
      // 투어API 거리순 정렬이 제대로 지원되지 않으므로 클라이언트 사이드 거리 계산 사용
      return await sortByDistanceClientSide();
    } catch (error) {
      console.error("거리순 정렬 실패:", error);
      throw error;
    }
  };

  // 클라이언트 사이드 거리 계산 함수
  const sortByDistanceClientSide = async () => {
    try {
      // 사용자 위치 가져오기
      let currentLocation = userLocation;
      if (!currentLocation) {
        currentLocation = await requestLocationPermission();
        if (!currentLocation) {
          throw new Error("위치 정보를 가져올 수 없습니다.");
        }
      }

      // 두 지점 간의 거리 계산 (Haversine 공식)
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 지구의 반지름 (km)
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // km 단위
        return distance;
      };

      // 원본 데이터에서 거리 계산
      const festivalsWithDistance = originalListFestivals.map((festival) => {
        if (festival.mapx && festival.mapy && currentLocation) {
          const distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            parseFloat(festival.mapy), // 위도
            parseFloat(festival.mapx) // 경도
          );
          return {
            ...festival,
            distance: Math.round(distance * 10) / 10, // 소수점 첫째 자리까지 반올림
          };
        }
        return { ...festival, distance: null }; // 좌표가 없으면 null로 설정
      });

      // 거리순으로 정렬 (좌표가 있는 축제들을 먼저, 그 다음에 좌표가 없는 축제들)
      const sorted = festivalsWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // 좌표가 없는 축제는 뒤로
        if (b.distance === null) return -1; // 좌표가 없는 축제는 뒤로
        return a.distance - b.distance;
      });

      return sorted;
    } catch (error) {
      console.error("클라이언트 사이드 거리 계산 실패:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchFestivals = async () => {
      setIsInitialLoading(true);
      try {
        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

        const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=A&numOfRows=1000&pageNo=1`;

        const response = await fetch(url);
        const data = await response.json();
        const items = data?.response?.body?.items?.item;

        if (!items || !Array.isArray(items)) return;

        const mapped = items.map((item) => {
          const start = item.eventstartdate;
          const end = item.eventenddate;
          return {
            id: item.contentid,
            title: item.title,
            location: item.addr1 || "장소 미정",
            date: `${start?.replace(
              /(\d{4})(\d{2})(\d{2})/,
              "$1.$2.$3"
            )} - ${end?.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}`,
            image: item.firstimage || "/logo.png",
            startDate: start,
            endDate: end,
            status: getFestivalStatus(start, end),
            mapx: item.mapx, // 경도
            mapy: item.mapy, // 위도
          };
        });

        // 날짜순 정렬
        const sorted = mapped.sort((a, b) =>
          a.startDate.localeCompare(b.startDate)
        );

        // 오늘 날짜 기준으로 개최된 축제 중 가장 최근에 개최된 축제 5개 (슬라이더용)
        const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");

        const recentFestivals = sorted
          .filter((f) => f.startDate <= todayStr) // 오늘 이전에 시작한 축제들
          .sort((a, b) => b.startDate.localeCompare(a.startDate)) // 최근 날짜순으로 정렬
          .slice(0, 5); // 상위 5개

        // 슬라이더 제외 나머지
        const sliderIds = new Set(recentFestivals.map((f) => f.id));
        const list = sorted.filter((f) => !sliderIds.has(f.id));

        setSliderFestivals(recentFestivals);
        setListFestivals(list);
        setOriginalListFestivals(list); // 원본 데이터 보존
        isMounted.current = true;
      } catch (error) {
        console.error("축제 정보 로드 실패:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchFestivals();
  }, []);

  const getFestivalStatus = (start, end) => {
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
  };

  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    // 실제로는 React Router로 상세페이지 이동
    navigate(`/festival/detail/${festivalId}`);
  };

  // 정렬 옵션 변경 핸들러
  const handleSortChange = async (newSortType) => {
    setSortType(newSortType);

    if (newSortType === "distance") {
      try {
        // 거리순 정렬 시도 (투어API 사용)
        const sortedFestivals = await sortByDistance();
        setListFestivals(sortedFestivals);
        setDisplayedFestivals(sortedFestivals.slice(0, pageSize));
        setPage(1);
        setHasMore(sortedFestivals.length > pageSize);
      } catch (error) {
        // 위치 권한이 거부된 경우
        if (error.code === 1) {
          alert(
            "위치 기반 서비스에 동의해주세요. 거리순 정렬을 사용하려면 위치 권한이 필요합니다."
          );
          setSortType("date"); // 날짜순으로 되돌리기
        } else {
          alert("거리순 정렬 중 오류가 발생했습니다. 다시 시도해주세요.");
          setSortType("date"); // 날짜순으로 되돌리기
        }
      }
    } else if (newSortType === "date") {
      // 날짜순 정렬 (원본 데이터에서 정렬)
      const sorted = [...originalListFestivals].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
      setListFestivals(sorted);
      setDisplayedFestivals(sorted.slice(0, pageSize));
      setPage(1);
      setHasMore(sorted.length > pageSize);
    }
  };

  // 데이터 받아오면 렌더링 개수 관리
  useEffect(() => {
    if (!isMounted.current) return;
    setDisplayedFestivals(listFestivals.slice(0, page * pageSize));
    setHasMore(listFestivals.length > page * pageSize);
  }, [listFestivals, page, pageSize]);

  // 무한 스크롤은 클라이언트에서 slice로만 처리 (추가 API 호출 없음)
  const loadMoreFestivals = useCallback(() => {
    if (isMoreLoading || !hasMore) return;
    setIsMoreLoading(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const newDisplayed = listFestivals.slice(0, nextPage * pageSize);

      setDisplayedFestivals(newDisplayed);
      setPage(nextPage);
      setHasMore(newDisplayed.length < listFestivals.length);
      setIsMoreLoading(false);
    }, 400); // 0.4초 뒤에 로딩 되도록 설정
  }, [page, pageSize, isMoreLoading, hasMore, listFestivals]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isMoreLoading) {
          loadMoreFestivals();
        }
      },
      {
        root: null,
        rootMargin: "20px",
        threshold: 0.1,
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isMoreLoading, loadMoreFestivals]);

  return (
    <>
      <Title />
      <div className="festival-main">
        {/* 슬라이더 공간 - 여기에 슬라이더 컴포넌트가 들어갈 예정 */}
        <div className="slider-container">
          <ExpandingCards
            festivals={sliderFestivals}
            onFestivalClick={handleFestivalClick}
          />
        </div>

        {/* 축제 목록 섹션 */}
        <section className="festivals-section">
          {/* 정렬 옵션 */}
          <div className="sort-options">
            <span
              className={`sort-option ${sortType === "date" ? "active" : ""}`}
              onClick={() => handleSortChange("date")}
            >
              축제일순
            </span>
            <span className="divider">|</span>
            <span
              className={`sort-option ${sortType === "distance" ? "active" : ""
                }`}
              onClick={() => handleSortChange("distance")}
            >
              거리순
            </span>
          </div>

          {/* 최초 전체 로딩 인디케이터 */}
          {isInitialLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>축제를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* 축제 그리드 */}
              <div className="festivals-grid">
                {displayedFestivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="festival-card"
                    onClick={() => handleFestivalClick(festival.id)}
                  >
                    <div className="festival-image-container">
                      <img
                        src={festival.image}
                        alt={festival.title}
                        className="festival-image"
                      />
                      <div
                        className={`festival-status ${
                          festival.status === "진행중" ? "active" : "upcoming"
                        }`}
                      >
                        {festival.status}
                      </div>
                    </div>

                    <div className="festival-info">
                      <h3 className="festival-title">{festival.title}</h3>
                      <p className="festival-location">
                        <svg
                          className="icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {festival.location}
                        {sortType === "distance" && festival.distance && (
                          <span
                            style={{
                              color: "#60a5fa",
                              marginLeft: "8px",
                              fontSize: "0.8rem",
                            }}
                          >
                            ({festival.distance.toFixed(1)}km)
                          </span>
                        )}
                      </p>
                      <p className="festival-date">
                        <svg
                          className="icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {festival.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 무한 스크롤 로딩 인디케이터 */}
              {hasMore && (
                <div ref={loadingRef} className="loading-more-container">
                  {isMoreLoading ? (
                    <div className="loading-more">
                      <div className="spinner"></div>
                      <p>더 불러오는 중...</p>
                    </div>
                  ) : (
                    <div className="scroll-hint">
                      <p>스크롤하여 더 많은 축제를 확인하세요</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <ScrollToTop />
    </>
  );
};

export default FestivalMainPage;
