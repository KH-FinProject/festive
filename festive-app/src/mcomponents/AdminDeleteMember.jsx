import React, { useEffect, useState } from "react";
import { Search, Star } from "lucide-react";
import "./AdminDeleteMember.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";

const AdminDeleteMember = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [withdrawnMembers, setWithdrawnMembers] = useState([]);

  // 탈퇴 회원 데이터
  const fetchWithdrawMember = async () => {
    try {
      const resp = await axiosApi.get("/admin/withdraw");
      const data = resp.data;

      if (resp.status == 200) {
        console.log(data);
        setWithdrawnMembers(data);
      }
    } catch (err) {
      console.error("탈퇴 회원 불러오기 에러 : ", err);
    }
  };

  // 체크박스 선택/해제 상태 반영
  const handleCheckboxChange = (memberNo) => {
    setSelectedMembers((prev) =>
      prev.includes(memberNo)
        ? prev.filter((number) => number !== memberNo)
        : [...prev, memberNo]
    );

    console.log("selectedMembers : ", selectedMembers);
  };

  // 체크박스 전체선택
  const handleSelectAll = () => {
    if (selectedMembers.length === withdrawnMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(withdrawnMembers.map((member) => member.memberNo));
    }
    console.log("selectedMembers : ", selectedMembers);
  };

  const keyword = searchTerm.trim().toLowerCase();

  // filteredMembers : id, 닉네임, 이름으로 검색된 회원들
  const filteredMembers = (withdrawnMembers || []).filter((member) => {
    if (!member) return false;
    return (
      member.ID?.toLowerCase().includes(keyword) ||
      member.NAME?.toLowerCase().includes(keyword) ||
      member.NICKNAME?.toLowerCase().includes(keyword)
    );
  });

  // 삭제 버튼 클릭 시 회원 삭제
  const handleClickDelete = async (memberNoList) => {
    const isConfirmed = window.confirm(
      "회원을 영구 삭제 하시겠습니까? (복구 불가능)"
    );

    if (!isConfirmed) return;
    try {
      const resp = await axiosApi.post("/admin/withdrawDelete", memberNoList);
      const data = resp.data;

      if (resp.status == 200) {
        console.log(data);
        alert(data, "명 삭제되었습니다.");

        setSelectedMembers([]);
        fetchWithdrawMember();
        return;
      }

      alert("삭제 실패했습니다.");
    } catch (err) {
      console.error("회원 삭제하기 에러 : ", err);
    }
  };

  // 복구 버튼 클릭 시 회원 복구
  const handleClickRestore = async (memberNoList) => {
    const isConfirmed = window.confirm("해당 회원을 복구하시겠습니까?");

    if (!isConfirmed) return;

    try {
      const resp = await axiosApi.post("/admin/withdrawRestore", memberNoList);
      const data = resp.data;

      if (resp.status == 200) {
        console.log(data);
        alert("복구되었습니다.");

        setSelectedMembers([]);
        fetchWithdrawMember();

        return;
      }

      alert("복구 실패");
    } catch (err) {
      console.error("회원 복구하기 에러 : ", err);
    }
  };

  useEffect(() => {
    fetchWithdrawMember();
  }, []);

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <div className="content">
          {/* Main Content */}
          <main className="admin-main">
            <div className="admin-header">
              <h1 className="admin-title">회원 탈퇴 및 삭제</h1>
            </div>

            {/* Search Section */}
            <div className="admin-search-section">
              <div className="admin-search-container">
                <input
                  type="text"
                  placeholder="검색할 회원 입력"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-search-input"
                />
                <button className="admin-search-button">
                  <Search className="admin-search-icon" />
                </button>
              </div>
            </div>

            {/* Member List Section */}
            <div className="member-list-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">탈퇴 회원 정보</h2>
                {/* 체크박스로 선택한 회원 삭제/복구 */}
                <div className="button-group">
                  <button
                    className="action-button delete-button"
                    disabled={selectedMembers.length === 0}
                    onClick={() => handleClickDelete(selectedMembers)}
                  >
                    선택 회원 삭제
                  </button>
                  <button
                    className="action-button restore-button"
                    disabled={selectedMembers.length === 0}
                    onClick={() => handleClickRestore(selectedMembers)}
                  >
                    선택 회원 복구
                  </button>
                </div>
              </div>

              <div className="member-list-container">
                <div className="member-list-header">
                  <div className="header-row">
                    <div className="header-cell checkbox-cell">
                      <input
                        type="checkbox"
                        checked={
                          selectedMembers.length === withdrawnMembers.length &&
                          withdrawnMembers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="member-checkbox"
                      />
                    </div>
                    <div className="header-cell">아이디</div>
                    <div className="header-cell">이름</div>
                    <div className="header-cell">닉네임</div>
                    <div className="header-cell">탈퇴시간</div>
                    <div className="header-cell action-cell">삭제</div>
                    <div className="header-cell action-cell">복구</div>
                  </div>
                </div>

                <div className="member-list-body">
                  {filteredMembers?.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div key={member.memberNo} className="member-row">
                        <div className="member-cell checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.memberNo)}
                            onChange={() =>
                              handleCheckboxChange(member.memberNo)
                            }
                            className="member-checkbox"
                          />
                        </div>
                        <div className="member-cell">{member.ID}</div>
                        <div className="member-cell">{member.NAME}</div>
                        <div className="member-cell">{member.NICKNAME}</div>
                        <div className="member-cell">
                          {member.WITHDRAW_DATE}
                        </div>
                        <div className="member-cell action-cell">
                          <button
                            className="action-button delete-button"
                            onClick={() => handleClickDelete([member.memberNo])}
                          >
                            삭제
                          </button>
                        </div>
                        <div className="member-cell action-cell">
                          <button
                            className="action-button restore-button"
                            onClick={() =>
                              handleClickRestore([member.memberNo])
                            }
                          >
                            복구
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <h2 style={{ textAlign: "center", marginTop: "100px" }}>
                      탈퇴한 회원이 없습니다.
                    </h2>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteMember;
