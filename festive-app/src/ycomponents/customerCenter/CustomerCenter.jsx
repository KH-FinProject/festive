import React, { useState } from "react";
import "./CustomerCenter.css";
import Title from "./Title";
import CustomerBoard from "./CustomerBoard";
import Pagination from "../wagle/Pagination";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faSearch } from "@fortawesome/free-solid-svg-icons";

const CustomerCenter = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleWriteClick = () => {
    navigate("/customer-center/write");
  };

  const handleSearch = () => {
    console.log("검색:", { type: searchType, query: searchQuery });
    // 여기에 실제 검색 로직 추가
  };

  return (
    <div className="customer-center-page-container">
      <Title />
      <div className="customer-center-outer">
        <div className="customer-center-container">
          <CustomerBoard currentPage={currentPage} />
          <div className="customer-center-search-row">
            <div className="customer-center-search-bar">
              <select
                className="customer-search-type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="title">제목</option>
                <option value="author">작성자</option>
              </select>
              <input
                type="text"
                className="customer-search-input"
                placeholder="검색어를 입력해 주세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
            totalPages={10}
            onPageChange={handlePageChange}
            className="general-board-pagination"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerCenter;
