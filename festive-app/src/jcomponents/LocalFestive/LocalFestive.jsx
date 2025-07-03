import "./LocalFestive.css";
import React, { useEffect, useState } from "react";
import ScrollToTop from "../../scomponents/monthFestive/ScrollToTop.jsx";
import { useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";

const LocalFestive = () => {
  // 축제 목록 상태
  const [festivals, setFestivals] = useState([]);
  const [originalFestivals, setOriginalFestivals] = useState([]); // 원본 데이터 보존
  const [sortType, setSortType] = useState("date"); // 'date', 'distance'
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null); // 사용자 위치
  const [areaOptions, setAreaOptions] = useState([]);
  const navigate = useNavigate();

  // 키워드 검색 메서드
  const searchKeyword = async (keyword) => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
      const params = new URLSearchParams({
        MobileOS: "WEB",
        MobileApp: "Festive",
        _type: "json",
        arrange: "A",
        contentTypeId: "15",
        keyword: encodeURIComponent(keyword),
      });
      const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;

      if (!items || !Array.isArray(items)) return;

      const mapped = items.map((item) => {
        return {
          id: item.contentid,
          title: item.title
        };
      });
      return mapped;
      
    } catch (error) {
      console.error("키워드 검색 실패:", error);
      throw error;
    }
  }

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
      const festivalsWithDistance = originalFestivals.map((festival) => {
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

  // DB 조회해서 처음 마운트시 지역 옵션 생성
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axiosApi.get(`${import.meta.env.VITE_API_URL}/area/areas`);
        setAreaOptions(response.data);

      } catch (error) {
        console.error("지역 옵션 생성 중 오류 발생:", error.response?.data || error.message);
      }
    };

    fetchAreas();
  }, []);
  
  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

        const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=A&numOfRows=100&pageNo=1`;

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
            status: getFestivalStatus(start, end),
            mapx: item.mapx, // 경도
            mapy: item.mapy, // 위도
          };
        });

        // 날짜순 정렬
        const sorted = mapped.sort((a, b) =>
          a.startDate.localeCompare(b.startDate)
        );

        setFestivals(sorted);
        setOriginalFestivals(sorted); // 원본 데이터 보존

      } catch (error) {
        console.error("축제 정보 로드 실패:", error);
      }
    };

    fetchFestivals();
  }, []);

  const searchFestivals = async () => {
    try {
      const formatDate = (dateStr) => dateStr ? dateStr.replaceAll("-", "") : "";
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
      const params = new URLSearchParams({
        MobileOS: "WEB",
        MobileApp: "Festive",
        _type: "json",
        eventStartDate: formatDate(searchStartDate),
        eventEndDate: formatDate(searchEndDate),
        arrange: "A",
        numOfRows: "100",
        pageNo: "1",
      });
      if (searchLocation) {
        params.append("areaCode", searchLocation);
      }
      const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;

      if (!items || !Array.isArray(items)) return;

      // 종료된 축제 제외
      const filtered = items.filter((item) => {
        const start = item.eventstartdate;
        const end = item.eventenddate;
        if(getFestivalStatus(start, end) === "종료") {
          return false;
        }
        return true;
      });

      const mapped = filtered.map((item) => {
        const start = item.eventstartdate;
        const end = item.eventenddate;
        return {
          id: item.contentid,
          title: item.title,
          location: item.addr1 || "장소 미정",
          date: `${start?.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")} - ${end?.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}`,
          image: item.firstimage || "/logo.png",
          startDate: start,
          status: getFestivalStatus(start, end),
          mapx: item.mapx,
          mapy: item.mapy,
        };
      });

      // 날짜순 정렬
      const sorted = mapped.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setFestivals(sorted);

    } catch (error) {
      console.error("축제 검색 실패:", error);
    }
  };

  // 검색 핸들러
  const handleSearch = () => {
    searchFestivals();
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
        // 거리순 정렬 시도
        const sortedFestivals = await sortByDistance();
        setFestivals(sortedFestivals);
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
      const sorted = [...originalFestivals].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
      setFestivals(sorted);
    }
  };

  // 축제 상태 반환 함수 복구
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
                onChange={e => setSearchStartDate(e.target.value)}
                placeholder="시작일"
              />
            </div>
            <span className="date-range-tilde">~</span>
            <div className="input-block">
              <span className="input-label">끝 날짜</span>
              <input
                id="searchEndDate"
                type="date"
                className="search-input date-input"
                value={searchEndDate}
                onChange={e => setSearchEndDate(e.target.value)}
                placeholder="종료일"
              />
            </div>
            <div className="input-block">
              <span className="input-label">지역</span>
              <select
                className="search-input location-select"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
              >
                <option value="">전체 지역</option>
                {areaOptions.map(area => (
                  <option key={area.areaCode} value={area.areaCode}>
                    {area.areaName}
                  </option>
                ))}
              </select>
            </div>
            <button className="search-button" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* 새로운 축제 갤러리 섹션 */}
      <div className="festival-gallery-section">
        <div className="gallery-grid">
          {festivals.slice(0, 9).map((festival, index) => (
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
      </div>

      <div className="festival-main">
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
              className={`sort-option ${
                sortType === "distance" ? "active" : ""
              }`}
              onClick={() => handleSortChange("distance")}
            >
              거리순
            </span>
          </div>

          {/* 축제 그리드 */}
          <div className="festivals-grid">
            {festivals.slice(9).map((festival) => (
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
          <ScrollToTop />
        </section>
      </div>
    </>
  );
};

export default LocalFestive;
