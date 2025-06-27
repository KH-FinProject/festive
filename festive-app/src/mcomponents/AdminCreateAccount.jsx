import { useState } from "react";
import axiosAPI from "../api/axiosAPI";
import "./AdminCreateAccount.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminCreateAccount = () => {

  const [form, setForm] = useState({
    email: "",
    name: ""
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 관리자 계정 생성
  const createAdminAccount = async () => {

    console.log("createAdminAccount 실행");
    const { email, name } = form;

    if (!email || !name) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const response = await axiosAPI.post("/admin/create", {
        email: email,
        name: name
      });

      if (response.status === 201) {
        const result = response.data;
        alert(`발급된 비밀번호는 ${result}입니다. 다시 확인할 수 없으니 저장해주시기 바랍니다.`);
        setForm({
          email: "",
          name: ""
        });
      }
    } catch (err) {
      alert(err.response?.data || "오류가 발생했습니다.");
    }
  };

  // form 제출 이벤트
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("폼 제출됨");
    createAdminAccount();
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        <AdminSidebar />
        <div className="content">
          <main className="admin-main">
            <div className="admin-header">
              <h1 className="admin-title">관리자 계정생성</h1>
            </div>

            <div className="admin-form-container">
              <div className="admin-form-header">
                <h2>Festive</h2>
              </div>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label htmlFor="email" className="admin-form-label">이메일</label>
                  <input
                    type="email"
                    id="email"
                    className="admin-form-input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="ex) admin@kh.or.kr"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="name" className="admin-form-label">이름</label>
                  <input
                    type="text"
                    id="name"
                    className="admin-form-input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="성함을 입력해주세요."
                    required
                  />
                </div>

                <button type="submit" className="admin-submit-button">
                  비밀번호 받기
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateAccount;
