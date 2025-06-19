import './This-month-festive.css';
import {useEffect, useState} from "react";
import Title from "./Title.jsx";
import ExpandingCards from "./Month-Slider.jsx";

const FestivalMainPage = () => {
  // 축제 목록 상태
  const [festivals, setFestivals] = useState([]);
  const [sortType, setSortType] = useState('date'); // 'date', 'distance', 'popularity'

  // 예시 축제 목록 데이터
  useEffect(() => {
    // 실제로는 API 호출이 들어갈 부분
    const mockFestivals = [
      {
        id: 1,
        title: "서울 벚꽃축제",
        location: "여의도 한강공원",
        date: "2025.04.05 - 2025.04.15",
        image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&h=200&fit=crop",
        status: "진행중"
      },
      {
        id: 2,
        title: "부산 바다축제",
        location: "해운대 해수욕장",
        date: "2025.07.20 - 2025.07.25",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop",
        status: "예정"
      },
      {
        id: 3,
        title: "전주 한옥마을 축제",
        location: "전주 한옥마을",
        date: "2025.05.01 - 2025.05.07",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
        status: "진행중"
      },
      {
        id: 4,
        title: "제주 유채꽃축제",
        location: "제주 성산일출봉",
        date: "2025.04.10 - 2025.04.20",
        image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=300&h=200&fit=crop",
        status: "진행중"
      },
      {
        id: 5,
        title: "경주 문화축제",
        location: "경주 불국사",
        date: "2025.09.15 - 2025.09.22",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
        status: "예정"
      },
      {
        id: 6,
        title: "강릉 커피축제",
        location: "강릉 안목해변",
        date: "2025.10.01 - 2025.10.07",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",
        status: "예정"
      },
      {
        id: 7,
        title: "대구 치킨축제",
        location: "대구 두류공원",
        date: "2025.06.15 - 2025.06.20",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop",
        status: "예정"
      },
      {
        id: 8,
        title: "인천 차이나타운 축제",
        location: "인천 차이나타운",
        date: "2025.08.10 - 2025.08.15",
        image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300&h=200&fit=crop",
        status: "예정"
      },
      {
        id: 9,
        title: "광주 김치축제",
        location: "광주 국립아시아문화전당",
        date: "2025.11.01 - 2025.11.07",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
        status: "예정"
      }
    ];
    setFestivals(mockFestivals);
  }, []);

  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    // 실제로는 React Router로 상세페이지 이동
    console.log(`축제 ${festivalId} 상세페이지로 이동`);
    // navigate(`/festival/${festivalId}`);
  };

  // 더보기 버튼 클릭 핸들러
  const handleLoadMore = () => {
    // 더 많은 축제 로드 로직
    console.log('더 많은 축제 로드');
  };

  // 정렬 옵션 변경 핸들러
  const handleSortChange = (newSortType) => {
    setSortType(newSortType);
    // 실제로는 여기서 API 재호출하거나 정렬 로직 수행
    console.log(`정렬 변경: ${newSortType}`);
  };

  return (
      <>
        <Title />
        <div className="festival-main">
          {/* 슬라이더 공간 - 여기에 슬라이더 컴포넌트가 들어갈 예정 */}
          <div className="slider-container">
            <ExpandingCards />
          </div>

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
              {festivals.map((festival) => (
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

            {/* 더보기 버튼 */}
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore}>
                더 많은 축제 보기
              </button>
            </div>
          </section>
        </div>
      </>
  );
};

export default FestivalMainPage;