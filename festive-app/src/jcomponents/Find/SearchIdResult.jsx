import './SearchIdResult.css';

const SearchIdResult = ({ foundId, show, onClose, onLogin }) => {
  if (!show) return null;
  return (
    <div className="find-result-overlay" onClick={onClose}>
      <div className="find-result-modal" onClick={e => e.stopPropagation()}>
        <div className="result-header">
          <h3>아이디 찾기 결과</h3>
          <button type="button" className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="result-content">
          <div className="result-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981"/>
            </svg>
          </div>
          <div className="result-message">
            <p className="result-title">아이디를 찾았습니다!</p>
            <p className="result-subtitle">입력하신 정보로 등록된 아이디입니다.</p>
            <div className="found-id">
              <span className="id-label">ID</span>
              <span className="id-value">{foundId || '조회된 아이디가 없습니다.'}</span>
            </div>
          </div>
        </div>
        <div className="result-actions">
          <button type="button" className="action-btn primary" onClick={onLogin}>
            로그인하기
          </button>
          <button type="button" className="action-btn secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchIdResult; 