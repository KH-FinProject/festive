import React, { useState } from "react";
import { Search, Star } from "lucide-react";
import AdminSidebar from "./AdminSideBar";
import "./AdminDeleteMember.css";

const AdminDeleteMember = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // 탈퇴 회원 더미 데이터 (많은 데이터로 스크롤 테스트)
  const withdrawnMembers = [
    {
      id: 1,
      userId: "sung1sung",
      name: "성민승",
      nickname: "월승스",
      withdrawalDate: "2025-06-08 17:28:38",
    },
    {
      id: 2,
      userId: "sung2sung",
      name: "김민수",
      nickname: "민수킹",
      withdrawalDate: "2025-06-07 15:22:15",
    },
    {
      id: 3,
      userId: "sung3sung",
      name: "이영희",
      nickname: "영희짱",
      withdrawalDate: "2025-06-06 14:15:30",
    },
    {
      id: 4,
      userId: "sung4sung",
      name: "박철수",
      nickname: "철수맨",
      withdrawalDate: "2025-06-05 13:45:22",
    },
    {
      id: 5,
      userId: "sung5sung",
      name: "최지영",
      nickname: "지영이",
      withdrawalDate: "2025-06-04 12:30:18",
    },
    {
      id: 6,
      userId: "sung6sung",
      name: "정우진",
      nickname: "우진킹",
      withdrawalDate: "2025-06-03 11:25:45",
    },
    {
      id: 7,
      userId: "sung7sung",
      name: "한소희",
      nickname: "소희야",
      withdrawalDate: "2025-06-02 10:15:33",
    },
    {
      id: 8,
      userId: "sung8sung",
      name: "윤도현",
      nickname: "도현아",
      withdrawalDate: "2025-06-01 09:30:27",
    },
    {
      id: 9,
      userId: "sung9sung",
      name: "임수정",
      nickname: "수정이",
      withdrawalDate: "2025-05-31 08:45:12",
    },
    {
      id: 10,
      userId: "sung10sung",
      name: "강혜원",
      nickname: "혜원님",
      withdrawalDate: "2025-05-30 07:20:55",
    },
    {
      id: 11,
      userId: "sung11sung",
      name: "송지효",
      nickname: "지효언니",
      withdrawalDate: "2025-05-29 18:35:41",
    },
    {
      id: 12,
      userId: "sung12sung",
      name: "김종국",
      nickname: "종국형",
      withdrawalDate: "2025-05-28 16:22:18",
    },
    {
      id: 13,
      userId: "sung13sung",
      name: "하하하",
      nickname: "하하킹",
      withdrawalDate: "2025-05-27 15:10:33",
    },
    {
      id: 14,
      userId: "sung14sung",
      name: "유재석",
      nickname: "재석이",
      withdrawalDate: "2025-05-26 14:55:29",
    },
    {
      id: 15,
      userId: "sung15sung",
      name: "전소민",
      nickname: "소민이",
      withdrawalDate: "2025-05-25 13:40:15",
    },
  ];

  const handleCheckboxChange = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === withdrawnMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(withdrawnMembers.map((member) => member.id));
    }
  };

  const filteredMembers = withdrawnMembers.filter(
    (member) =>
      member.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.name.includes(searchTerm) ||
      member.nickname.includes(searchTerm)
  );

  return (
    <div className="member-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar activeItem="회원 탈퇴 및 삭제" />

        {/* Main Content */}
        <main className="management-main">
          <div className="page-header">
            <h1 className="page-title">회원 탈퇴 및 삭제</h1>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="검색할 회원 입력"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="search-button">
                <Search className="search-icon" />
              </button>
            </div>
          </div>

          {/* Member List Section */}
          <div className="member-list-section">
            <div className="section-header">
              <h2 className="section-title">탈퇴 회원 정보</h2>
            </div>

            <div className="member-list-container">
              <div className="member-list-header">
                <div className="header-row">
                  <div className="header-cell checkbox-cell">
                    <input
                      type="checkbox"
                      checked={
                        selectedMembers.length === withdrawnMembers.length
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
                {filteredMembers.map((member) => (
                  <div key={member.id} className="member-row">
                    <div className="member-cell checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleCheckboxChange(member.id)}
                        className="member-checkbox"
                      />
                    </div>
                    <div className="member-cell">{member.userId}</div>
                    <div className="member-cell">{member.name}</div>
                    <div className="member-cell">{member.nickname}</div>
                    <div className="member-cell">{member.withdrawalDate}</div>
                    <div className="member-cell action-cell">
                      <button className="action-button delete-button">
                        삭제
                      </button>
                    </div>
                    <div className="member-cell action-cell">
                      <button className="action-button restore-button">
                        복구
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDeleteMember;
