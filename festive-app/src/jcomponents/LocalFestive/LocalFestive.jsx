import "./LocalFestive.css";
import React, { useEffect, useState, useRef, useCallback } from "react";
import ScrollToTop from "../../scomponents/monthFestive/ScrollToTop.jsx";
import { useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const LocalFestive = () => {
  // 축제 목록 상태
  const [festivals, setFestivals] = useState([]);
  const [sortType, setSortType] = useState("date"); // '축제일순', '거리순'
  const [searchStartDate, setSearchStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [userLocation, setUserLocation] = useState(null); // 사용자 위치
  const [areaOptions, setAreaOptions] = useState([]);
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

  // 축제 검색 상태
  const [isKeywordSearch, setIsKeywordSearch] = useState(false);

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

  // DB 조회해서 처음 마운트시 지역 옵션 생성
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axiosApi.get(
          `${import.meta.env.VITE_API_URL}/area/areas`
        );
        setAreaOptions(response.data);
      } catch (error) {
        console.error(
          "지역 옵션 생성 중 오류 발생:",
          error.response?.data || error.message
        );
      }
    };

    fetchAreas();
  }, []);

  // 초기 축제 데이터 로드
  useEffect(() => {
    fetchInitialFestivals();
    isMounted.current = true;
  }, []);

  // 축제 검색시(시작/끝 날짜, 지역 수정시) 데이터 로드
  useEffect(() => {
    if (!isMounted.current) return;
    searchFestivals();
  }, [searchStartDate, searchEndDate, searchLocation]);

  // 축제 데이터 가져오기 함수
  const fetchFestivalData = async () => {
    const today = new Date();
    const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
    const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

    const params = new URLSearchParams({
      MobileOS: "WEB",
      MobileApp: "Festive",
      _type: "json",
      eventStartDate: yyyyMMdd,
      arrange: "A",
      numOfRows: "1000",
      pageNo: "1",
    });

    const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    const items = data?.response?.body?.items?.item;

    if (!items || !Array.isArray(items)) return [];

    // 축제일순 정렬
    items.sort((a, b) => a.eventstartdate.localeCompare(b.eventstartdate));

    return items.map((item) => {
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
        status: getFestivalStatus(start, end),
        mapx: item.mapx,
        mapy: item.mapy,
      };
    });
  };

  // 초기 데이터 로드
  const fetchInitialFestivals = async () => {
    setIsInitialLoading(true);

    try {
      const data = await fetchFestivalData();
      setFestivals(data);
      setDisplayedFestivals(data);
      setHasMore(data.length > pageSize);
      setPage(1);
    } catch (error) {
      console.error("초기 축제 로드 실패:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 검색 함수
  const searchFestivals = async () => {
    setIsKeywordSearch(false);
    setIsMoreLoading(true);
    setPage(1);
    setHasMore(true);

    try {
      const formatDate = (dateStr) =>
        dateStr ? dateStr.replaceAll("-", "") : "";
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
      const params = new URLSearchParams({
        MobileOS: "WEB",
        MobileApp: "Festive",
        _type: "json",
        eventStartDate: formatDate(searchStartDate),
        eventEndDate: formatDate(searchEndDate),
        arrange: "A",
        numOfRows: "1000",
        pageNo: "1",
      });

      if (searchLocation) {
        params.append("areaCode", searchLocation);
      }

      const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;

      if (!items || !Array.isArray(items)) {
        setFestivals([]);
        setDisplayedFestivals([]);
        setHasMore(false);
        return;
      }

      // contentTypeId가 15가 아니고 종료된 축제 제외
      const filtered = items.filter((item) => {
        return (
          item.contenttypeid === "15" &&
          getFestivalStatus(item.eventstartdate, item.eventenddate) !== "종료"
        );
      });

      // 매핑
      let mapped = filtered.map((item) => {
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
          status: getFestivalStatus(start, end),
          mapx: item.mapx,
          mapy: item.mapy,
        };
      });

      // 정렬
      if (sortType === "distance") {
        try {
          const festivalsWithDistance = await addDistanceToFestivals(mapped);
          mapped = festivalsWithDistance.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;

            return a.distance - b.distance;
          });
        } catch (error) {
          console.error("거리순 정렬 실패, 축제일순으로 대체:", error);
          mapped = mapped.sort((a, b) =>
            a.startDate.localeCompare(b.startDate)
          );
        }
      } else {
        mapped = mapped.sort((a, b) => a.startDate.localeCompare(b.startDate));
      }
      setFestivals(mapped);
      setDisplayedFestivals(mapped.slice(0, pageSize));
      setHasMore(mapped.length > pageSize);
    } catch (error) {
      console.error("축제 검색 실패:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  // 키워드를 포함하는 축제 데이터 가져오기 함수
  const keywordSearchFestivals = async (e) => {
    setIsKeywordSearch(true);
    setIsMoreLoading(true);
    setPage(1);
    setHasMore(true);
    setSortType("distance"); // 거리순으로 고정

    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
      const params = new URLSearchParams({
        MobileOS: "WEB",
        MobileApp: "Festive",
        _type: "json",
        arrange: "A",
        numOfRows: "10000",
        pageNo: "1",
        contentTypeId: "15",
        keyword: searchKeyword,
      });

      const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${serviceKey}&${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;

      if (!items || !Array.isArray(items)) {
        setFestivals([]);
        setDisplayedFestivals([]);
        setHasMore(false);
        return;
      }

      // 매핑 (날짜 정보 없음)
      let mapped = items.map((item) => ({
        id: item.contentid,
        title: item.title,
        location: item.addr1 || "장소 미제공",
        date: "날짜 정보 없음",
        image: item.firstimage || "/logo.png",
        startDate: null,
        status: "미제공",
        mapx: item.mapx,
        mapy: item.mapy,
      }));

      // 거리순 정렬만 적용
      const festivalsWithDistance = await addDistanceToFestivals(mapped);
      mapped = festivalsWithDistance.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

      setFestivals(mapped);
      setDisplayedFestivals(mapped.slice(0, pageSize));
      setHasMore(mapped.length > pageSize);
    } catch (error) {
      console.error("축제 검색 실패:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  // 축제 목록에 거리 정보 추가하는 함수
  const addDistanceToFestivals = async (festivals) => {
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

      // 축제 목록에 거리 정보 추가
      return festivals.map((festival) => {
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
    } catch (error) {
      console.error("거리 정보 추가 실패:", error);
      throw error;
    }
  };

  // 키워드 검색 핸들러
  const handleKeywordSearch = () => {
    if (!searchKeyword.trim()) {
      alert("키워드를 입력해 주세요.");
      return;
    }
    setIsKeywordSearch(true);
    keywordSearchFestivals();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!searchKeyword.trim()) {
        alert("키워드를 입력해 주세요.");
        return;
      }
      setIsKeywordSearch(true);
      keywordSearchFestivals();
    }
  };

  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    navigate(`/festival/detail/${festivalId}`);
  };

  // 정렬 옵션 변경 핸들러
  const handleSortChange = async (newSortType) => {
    setSortType(newSortType);

    if (newSortType === "distance") {
      try {
        // 현재 축제 목록에 거리 정보 추가 후 정렬
        const festivalsWithDistance = await addDistanceToFestivals(festivals);
        const sortedFestivals = festivalsWithDistance.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1; // 좌표가 없는 축제는 뒤로
          if (b.distance === null) return -1; // 좌표가 없는 축제는 뒤로

          return a.distance - b.distance;
        });

        setFestivals(sortedFestivals);
        setDisplayedFestivals(sortedFestivals);
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
      // 날짜순 정렬 (현재 축제 목록에서 정렬)
      const sorted = [...festivals].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
      setFestivals(sorted);
      setDisplayedFestivals(sorted);
    }
  };

  // 축제 상태 반환 함수
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

  // 데이터 받아오면 렌더링 개수 관리
  useEffect(() => {
    setDisplayedFestivals(festivals.slice(0, page * pageSize));
    setHasMore(festivals.length > page * pageSize);
  }, [festivals, page, pageSize]);

  // 무한 스크롤은 클라이언트에서 slice로만 처리 (추가 API 호출 없음)
  const loadMoreFestivals = useCallback(() => {
    if (isMoreLoading || !hasMore) return;
    setIsMoreLoading(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const newDisplayed = festivals.slice(0, nextPage * pageSize);

      setDisplayedFestivals(newDisplayed);
      setPage(nextPage);
      setHasMore(newDisplayed.length < festivals.length);
      setIsMoreLoading(false);
    }, 400); // 0.4초 뒤에 로딩 되도록 설정
  }, [page, pageSize, isMoreLoading, hasMore, festivals]);

  // Intersection Observer 설정
  useEffect(() => {
    // 1. IntersectionObserver 인스턴스 생성
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // 2. 타겟이 화면에 보이고, 더 불러올 데이터가 있고, 로딩 중이 아닐 때만 loadMoreFestivals 실행
        if (target.isIntersecting && hasMore && !isMoreLoading) {
          loadMoreFestivals();
        }
      },
      {
        root: null, // 뷰포트(브라우저 창) 기준으로 관찰
        rootMargin: "100px", // 타겟이 실제로 뷰포트에 닿기 100px 전에 미리 감지
        threshold: 0.1, // 타겟 요소의 10%만 보여도 콜백 실행
      }
    );

    // 3. loadingRef가 가리키는 DOM 요소를 관찰 시작
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    // 4. 컴포넌트 언마운트 시 observer 해제
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isMoreLoading, loadMoreFestivals]);

  return (
    <>
      <div className="local-header">
        <div className="local-main-title">지역별 축제</div>
        <div className="local-sub-title">
          # 지역별로 다양한 축제를 만나보세요.
        </div>

        {/* 검색 섹션 */}
        <div className="search-section">
          <div className="search-title">축제 검색</div>
          <div className="search-description">
            원하는 날짜와 지역을 선택하여 축제를 찾아보세요
          </div>
          <div className="search-container">
            <div className="search-form-row">
              <div className="input-block">
                <span className="input-label">시작 날짜</span>
                <input
                  id="searchStartDate"
                  type="date"
                  className="search-input date-input"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  placeholder="시작일"
                />
              </div>
              <span className="date-range-tilde">~</span>
              <div className="input-block">
                <span className="input-label">종료 날짜</span>
                <input
                  id="searchEndDate"
                  type="date"
                  className="search-input date-input"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  placeholder="종료일"
                />
              </div>
              <div className="input-block">
                <span className="input-label">지역</span>
                <select
                  className="search-input location-select"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                >
                  <option value="">전체</option>
                  {areaOptions.map((area) => (
                    <option key={area.areaCode} value={area.areaCode}>
                      {area.areaName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-block">
                <span className="input-label">축제명</span>
                <div
                  className="keyword-input-icon-wrapper"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    className="search-input keyword-input"
                    placeholder="축제명으로 검색"
                    value={searchKeyword || ""}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <span
                    className="keyword-search-icon"
                    onClick={handleKeywordSearch}
                    role="button"
                    tabIndex={0}
                    aria-label="검색"
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "22px",
                      color: "#60a5fa",
                      zIndex: 2,
                    }}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 메시지 영역: 항상 고정 */}
          <div className="keyword-info-message-area">
            {searchKeyword && (
              <div className="keyword-info-message">
                축제명 검색은 날짜 정보가 제공되지 않습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 새로운 축제 갤러리 섹션 */}
      {/* <div className="festival-gallery-section">
        <div className="gallery-grid">
          {displayedFestivals.slice(0, 9).map((festival, index) => (
            <div
              key={festival.id}
              className={`gallery-card ${index === 0 ? "large-card" : ""}`}
              onClick={() => handleFestivalClick(festival.id)}
            >
              <div className="gallery-image-container">
                <img
                  src={festival.image}
                  alt={festival.title}
                  className="gallery-image"
                />
                <div className="gallery-overlay">
                  <div className="gallery-content">
                    <h3 className="gallery-title">{festival.title}</h3>
                    <p className="gallery-date">{festival.date}</p>
                    <p className="gallery-location">
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
                  </div>
                  <div
                    className={`gallery-status ${
                      festival.status === "진행중" ? "active" : "upcoming"
                    }`}
                  >
                    {festival.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      <div className="festival-main">
        {/* 축제 목록 섹션 */}
        <section className="festivals-section">
          {/* 정렬 옵션 */}
          {isKeywordSearch ? (
            <div className="sort-options">
              <span className="sort-option active">거리순</span>
            </div>
          ) : (
            <div className="sort-options">
              <span
                className={`sort-option ${sortType === "date" ? "active" : ""}`}
                onClick={() => handleSortChange("date")}
              >
                축제일순
              </span>
              <span className="divider">|</span>
              <span
                className={`sort-option ${
                  sortType === "distance" ? "active" : ""
                }`}
                onClick={() => handleSortChange("distance")}
              >
                거리순
              </span>
            </div>
          )}

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
                        {festival.date && festival.date !== "날짜 미제공"
                          ? festival.date
                          : "날짜 정보 없음"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 검색 결과 없음 메시지 */}
              {isKeywordSearch && (!festivals || festivals.length === 0) && (
                <div className="keyword-info-message">
                  검색 결과가 없습니다.
                </div>
              )}

              {/* 추가(무한 스크롤) 로딩 인디케이터 */}
              {isMoreLoading && (
                <div className="loading-indicator small">
                  <div className="spinner"></div>
                  <p>더 불러오는 중...</p>
                </div>
              )}

              {/* Intersection Observer 타겟 */}
              {hasMore && (
                <div
                  ref={loadingRef}
                  className="observer-target"
                  style={{ height: "20px" }}
                />
              )}

              {/* 더 이상 데이터가 없을 때 */}
              {!hasMore && displayedFestivals.length > 0 && (
                <div className="no-more-data">
                  <p>모든 축제를 불러왔습니다.</p>
                </div>
              )}

              <ScrollToTop />
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default LocalFestive;
