import './LocalFestive.css';
import React, {useEffect, useState} from "react";
import ScrollToTop from "../../scomponents/monthFestive/ScrollToTop.jsx";

const LocalFestive = () => {
  // 축제 목록 상태
  const [festivals, setFestivals] = useState([]);
  const [sortType, setSortType] = useState('date'); // 'date', 'distance', 'popularity'
  const [listFestivals, setListFestivals] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  
  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, '');
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
            location: item.addr1 || '장소 미정',
            date: `${start?.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} - ${end?.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}`,
            image: item.firstimage || "https://via.placeholder.com/300x200?text=No+Image",
            startDate: start,
            status: getFestivalStatus(start, end)
          };
        });
        
        // 날짜순 정렬
        const sorted = mapped.sort((a, b) => a.startDate.localeCompare(b.startDate));
        
        // 진행중 축제 중 5개 슬라이더용
        const slider = sorted.filter(f => f.status === '진행중').slice(0, 5);
        
        // 슬라이더 제외 나머지
        const sliderIds = new Set(slider.map(f => f.id));
        const list = sorted.filter(f => !sliderIds.has(f.id));
        
        setListFestivals(list);
      } catch (error) {
        console.error('축제 정보 로드 실패:', error);
      }
    };
    
    fetchFestivals();
  }, []);
  
  
  
  const getFestivalStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(`${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6,8)}`);
    const endDate = new Date(`${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6,8)}`);
    
    if (now < startDate) return '예정';
    else if (now > endDate) return '종료';
    else return '진행중';
  };
  
  // 검색 핸들러
  const handleSearch = () => {
    console.log(`검색: 날짜=${searchDate}, 지역=${searchLocation}`);
    // 실제로는 여기서 검색 API 호출
  };
  
  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    // 실제로는 React Router로 상세페이지 이동
    console.log(`축제 ${festivalId} 상세페이지로 이동`);
    // navigate(`/festival/${festivalId}`);
  };
  
  // 정렬 옵션 변경 핸들러
  const handleSortChange = (newSortType) => {
    setSortType(newSortType);
    // 실제로는 여기서 API 재호출하거나 정렬 로직 수행
    console.log(`정렬 변경: ${newSortType}`);
  };
  
  return (
      <>
        <div className="local-header">
          <div className="local-main-title">지역별 축제</div>
          <div className="local-sub-title">
            # 지역별로 다양한 축제를 만나보세요.
          </div>
        </div>
        
        {/* 검색 섹션 */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-group">
              <div className="input-container">
                <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <input
                    type="date"
                    className="search-input date-input"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    placeholder="시기"
                />
              </div>
              <div className="input-container">
                <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <input
                    type="text"
                    className="search-input location-input"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="지역"
                />
              </div>
              <button className="search-button" onClick={handleSearch}>
                검색
              </button>
            </div>
          </div>
        </div>
        
        {/* 새로운 축제 갤러리 섹션 */}
        <div className="festival-gallery-section">
          <div className="gallery-grid">
            {listFestivals.slice(0, 9).map((festival, index) => (
                <div
                    key={festival.id}
                    className={`gallery-card ${index === 0 ? 'large-card' : ''}`}
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
                        <p className="gallery-location">{festival.location}</p>
                      </div>
                      <div className={`gallery-status ${festival.status === '진행중' ? 'active' : 'upcoming'}`}>
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
                  className={`sort-option ${sortType === 'date' ? 'active' : ''}`}
                  onClick={() => handleSortChange('date')}
              >
                축제일순
              </span>
              <span className="divider">|</span>
              <span
                  className={`sort-option ${sortType === 'distance' ? 'active' : ''}`}
                  onClick={() => handleSortChange('distance')}
              >
                거리순
              </span>
              <span className="divider">|</span>
              <span
                  className={`sort-option ${sortType === 'popularity' ? 'active' : ''}`}
                  onClick={() => handleSortChange('popularity')}
              >
                인기순
              </span>
            </div>
            
            {/* 축제 그리드 */}
            <div className="festivals-grid">
              {listFestivals.slice(9).map((festival) => (
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
                      <div className={`festival-status ${festival.status === '진행중' ? 'active' : 'upcoming'}`}>
                        {festival.status}
                      </div>
                    </div>
                    
                    <div className="festival-info">
                      <h3 className="festival-title">{festival.title}</h3>
                      <p className="festival-location">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {festival.location}
                      </p>
                      <p className="festival-date">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
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