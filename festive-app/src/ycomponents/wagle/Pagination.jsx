import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import "./Pagination.css";

/**
 * 페이지네이션 로직을 관리하는 커스텀 훅
 *
 * @param {Object} options
 * @param {number} options.totalItems - 전체 아이템 수
 * @param {number} [options.pageSize=10] - 페이지당 표시할 아이템 수
 * @param {number} [options.initialPage=1] - 초기 페이지 번호
 */
export const usePagination = ({
  totalItems,
  pageSize = 10,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.ceil(totalItems / pageSize);

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    },
    [totalPages]
  );

  const currentItems = useCallback(
    (items) => {
      const startIndex = (currentPage - 1) * pageSize;
      return items.slice(startIndex, startIndex + pageSize);
    },
    [currentPage, pageSize]
  );

  return {
    currentPage,
    totalPages,
    goToPage,
    currentItems,
    pageSize,
  };
};

/**
 * 페이지네이션 컴포넌트
 *
 * @param {Object} props
 * @param {number} props.currentPage - 현재 페이지 번호
 * @param {number} props.totalPages - 전체 페이지 수
 * @param {Function} props.onPageChange - 페이지 변경 시 호출될 함수
 * @param {string} [props.className=""] - 추가할 CSS 클래스명
 * @param {boolean} [props.showFirstLast=true] - 첫 페이지/마지막 페이지 버튼 표시 여부
 * @param {number} [props.maxVisiblePages=5] - 한 번에 표시할 페이지 버튼의 최대 개수
 *
 * @example
 * // 기본 사용법
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 *
 * // 커스텀 스타일과 옵션을 적용한 사용법
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={handlePageChange}
 *   className="custom-pagination"
 *   showFirstLast={false}
 *   maxVisiblePages={7}
 * />
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  showFirstLast = true,
  maxVisiblePages = 5,
}) {
  /**
   * 현재 페이지를 중심으로 표시할 페이지 번호들을 계산
   *
   * 예시:
   * - 전체 페이지가 10페이지이고 현재 페이지가 5페이지인 경우
   * - maxVisiblePages가 5인 경우
   * - 결과: [3, 4, 5, 6, 7]
   *
   * 특수한 경우 처리:
   * 1. 현재 페이지가 처음/끝에 가까운 경우 시작/끝 페이지를 조정
   * 2. 전체 페이지 수가 maxVisiblePages보다 작은 경우 모든 페이지를 표시
   *
   * @returns {number[]} 화면에 표시할 페이지 번호 배열
   */
  const getPageNumbers = () => {
    const pageNumbers = [];
    // 시작 페이지 계산: 현재 페이지를 중심으로 좌우로 페이지를 표시
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    // 끝 페이지 계산: 시작 페이지부터 최대 표시 개수만큼 표시
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 끝 페이지가 최대 표시 개수보다 작은 경우, 시작 페이지를 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 페이지 번호 배열 생성
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className={`pagination-container ${className}`.trim()}>
      {/* 첫 페이지로 이동하는 버튼 */}
      {showFirstLast && (
        <button
          type="button"
          className="pagination-btn nav"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="첫 페이지로 이동"
        >
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>
      )}

      {/* 이전 페이지로 이동하는 버튼 */}
      <button
        type="button"
        className="pagination-btn nav"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지로 이동"
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </button>

      {/* 페이지 번호 버튼들 */}
      {getPageNumbers().map((pageNum) => (
        <button
          type="button"
          key={pageNum}
          className={`pagination-btn${
            currentPage === pageNum ? " active" : ""
          }`}
          onClick={() => onPageChange(pageNum)}
          aria-label={`${pageNum} 페이지로 이동`}
          aria-current={currentPage === pageNum ? "page" : undefined}
        >
          {pageNum}
        </button>
      ))}

      {/* 다음 페이지로 이동하는 버튼 */}
      <button
        type="button"
        className="pagination-btn nav"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지로 이동"
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </button>

      {/* 마지막 페이지로 이동하는 버튼 */}
      {showFirstLast && (
        <button
          type="button"
          className="pagination-btn nav"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="마지막 페이지로 이동"
        >
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      )}
    </div>
  );
}

export default Pagination;
