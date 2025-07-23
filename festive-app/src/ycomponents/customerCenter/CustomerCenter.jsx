import React, { useState } from "react";
import "./CustomerCenter.css";
import Title from "./Title";
import CustomerBoard from "./CustomerBoard";
import Pagination from "../wagle/Pagination";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faSearch } from "@fortawesome/free-solid-svg-icons";
import { checkNicknameForSocialUser } from "../../utils/nicknameCheck";
import useAuthStore from "../../store/useAuthStore";

const CustomerCenter = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [actualSearchType, setActualSearchType] = useState("");
  const [actualSearchQuery, setActualSearchQuery] = useState("");
  const navigate = useNavigate();
  const { member, isLoggedIn } = useAuthStore();

  const handlePageChange = (pageNumber) => {
    window.scrollTo(0, 0);
    setCurrentPage(pageNumber);
  };

  const handleTotalPagesChange = (pages) => {
    setTotalPages(pages);
  };

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = async () => {
    // 로그인 체크
    if (!isLoggedIn || !member) {
      alert("로그인이 필요한 서비스입니다.\n로그인 후 문의사항을 작성해보세요!");
      navigate("/signin");
      return;
    }

    // 닉네임 체크 (소셜 사용자용)
    const canProceed = await checkNicknameForSocialUser(navigate);
    if (canProceed) {
      navigate("/customer-center/write");
    }
  };

  const handleSearch = () => {
    setActualSearchType(searchQuery.trim() ? searchType : "");
    setActualSearchQuery(searchQuery.trim());
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleSearchInputKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="customer-center-page-container">
      <Title />
      <div className="customer-center-outer">
        <div className="customer-center-container">
          <CustomerBoard
            currentPage={currentPage}
            searchType={actualSearchType}
            searchQuery={actualSearchQuery}
            onTotalPagesChange={handleTotalPagesChange}
          />
          <div className="customer-center-search-row">
            <div className="customer-center-search-bar">
              <select
                className="customer-search-type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="title">제목</option>
                <option value="title_content">제목+내용</option>
                <option value="author">작성자</option>
              </select>
              <input
                type="text"
                className="customer-search-input"
                placeholder="검색어를 입력해 주세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchInputKeyPress}
              />
              <button className="customer-search-btn" onClick={handleSearch}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
            <button className="customer-write-btn" onClick={handleWriteClick}>
              <FontAwesomeIcon icon={faPen} style={{ marginRight: "6px" }} />
              글쓰기
            </button>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="general-board-pagination"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerCenter;
