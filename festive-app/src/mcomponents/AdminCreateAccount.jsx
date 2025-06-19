import React, { useState } from "react";
import "./AdminCreateAccount.css";
import "./AdminCommon.css";

const AdminCreateAccount = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기에 관리자 생성 로직 추가
    console.log("Email:", email, "Password:", password);
  };

  return (
    <div className="content">
      {/* Main Content */}
      <main className="management-main">
        <div className="page-header">
          <h1 className="page-title">관리자 계정생성</h1>
        </div>

        <div className="form-container">
          <div className="form-header">
            <h2>Festive</h2>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                이메일
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button type="submit" className="submit-button">
              비밀번호 받기
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminCreateAccount;
