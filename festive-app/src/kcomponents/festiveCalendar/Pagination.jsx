import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import "./Pagination.css";

function Pagination({ page, totalPages, goToPage }) {
  return (
    <div className="wagle-pagination">
      <button
        type="button"
        className="page-btn nav"
        onClick={() => goToPage(1)}
        disabled={page === 1}
      >
        <FontAwesomeIcon icon={faAnglesLeft} />
      </button>
      <button
        type="button"
        className="page-btn nav"
        onClick={() => goToPage(page - 1)}
        disabled={page === 1}
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </button>
      {Array.from({ length: totalPages }, (_, idx) => (
        <button
          type="button"
          key={idx + 1}
          className={`page-btn${page === idx + 1 ? " active" : ""}`}
          onClick={() => goToPage(idx + 1)}
        >
          {idx + 1}
        </button>
      ))}
      <button
        type="button"
        className="page-btn nav"
        onClick={() => goToPage(page + 1)}
        disabled={page === totalPages}
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </button>
      <button
        type="button"
        className="page-btn nav"
        onClick={() => goToPage(totalPages)}
        disabled={page === totalPages}
      >
        <FontAwesomeIcon icon={faAnglesRight} />
      </button>
    </div>
  );
}

export default Pagination;
