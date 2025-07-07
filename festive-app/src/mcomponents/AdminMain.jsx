import "./AdminMain.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";
import Chart from "react-apexcharts";
import { useState, useEffect } from "react";
import axiosAPI from "../api/axiosAPI";

const AdminMain = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 통계 데이터 가져오기
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axiosAPI.get("/admin/statistics");
      setStatistics(response.data);
      setError(null);
    } catch (err) {
      console.error("통계 조회 실패:", err);
      setError("통계 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="admin-management-container">
        <div className="management-content">
          <AdminSidebar />
          <div className="content">
            <main className="admin-main">
              <div className="admin-header">
                <h1 className="admin-title">관리자 대시보드</h1>
              </div>
              <div className="loading-container">
                <p>통계 데이터를 불러오는 중...</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="admin-management-container">
        <div className="management-content">
          <AdminSidebar />
          <div className="content">
            <main className="admin-main">
              <div className="admin-header">
                <h1 className="admin-title">관리자 대시보드</h1>
              </div>
              <div className="error-container">
                <p>{error}</p>
                <button onClick={fetchStatistics}>다시 시도</button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // 통계 데이터가 없을 때
  if (!statistics) {
    return (
      <div className="admin-management-container">
        <div className="management-content">
          <AdminSidebar />
          <div className="content">
            <main className="admin-main">
              <div className="admin-header">
                <h1 className="admin-title">관리자 대시보드</h1>
              </div>
              <div className="no-data-container">
                <p>통계 데이터가 없습니다.</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ApexCharts 데이터 가공
  const categories = statistics.dailyStatistics.map((stat) => stat.dayName);

  // 회원 추이 차트 (라인 차트)
  const memberTrendOptions = {
    chart: {
      type: "line",
      height: 200,
      toolbar: { show: false },
    },
    xaxis: {
      categories: categories,
      title: { text: "날짜" },
    },
    yaxis: {
      title: { text: "회원 수" },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    colors: ["#8884d8", "#ff7c7c"],
    legend: { position: "top" },
    grid: { show: true },
  };

  const memberTrendSeries = [
    {
      name: "신규회원",
      data: statistics.dailyStatistics.map((stat) => stat.newMembers),
    },
    {
      name: "탈퇴회원",
      data: statistics.dailyStatistics.map((stat) => stat.withdrawMembers),
    },
  ];

  // 이용자 수 추이 차트 (바 차트)
  const userActivityOptions = {
    chart: {
      type: "bar",
      height: 250,
      toolbar: { show: false },
    },
    xaxis: {
      categories: categories,
      title: { text: "날짜" },
    },
    yaxis: {
      title: { text: "이용자 수" },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    colors: ["#82ca9d", "#8884d8"],
    legend: { position: "top" },
    grid: { show: true },
  };

  const userActivitySeries = [
    {
      name: "전체회원수",
      data: statistics.dailyStatistics.map((stat) => stat.returnMembers),
    },
    {
      name: "활동회원수",
      data: statistics.dailyStatistics.map((stat) => stat.activeMembers),
    },
  ];

  // 통계 요약 파이 차트
  const summaryOptions = {
    chart: {
      type: "pie",
      height: 300,
    },
    labels: ["신규회원", "활동회원", "비활동회원", "탈퇴회원"],
    colors: ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"],
    legend: { position: "bottom" },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const summarySeries = [
    statistics.weeklyNewMembers,
    statistics.activeMembers,
    statistics.returnMembers - statistics.activeMembers,
    statistics.weeklyWithdrawMembers,
  ];

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <div className="content">
          {/* Main Content */}
          <main className="admin-main">
            <div className="admin-header">
              <h1 className="admin-title">관리자 대시보드</h1>
            </div>

            <div className="main-section">
              <div className="main-item">
                <div className="item">
                  <span>신규회원추이</span>
                  <div className="item-value">
                    총 {statistics.weeklyNewMembers}명
                  </div>
                </div>
                <div className="item">
                  <span>이용자 수 추이</span>
                  <div className="item-value">
                    전체 {statistics.returnMembers}명 / 활동{" "}
                    {statistics.activeMembers}명
                  </div>
                </div>
                <div className="item">
                  <span>탈퇴 회원 추이</span>
                  <div className="item-value">
                    총 {statistics.weeklyWithdrawMembers}명
                  </div>
                </div>
              </div>

              <div className="chart">
                <div className="chart-container">
                  <h3>주간 통계 차트</h3>

                  {/* 회원 추이 차트 (신규 + 탈퇴) */}
                  <div className="chart-item">
                    <h4>회원 추이 (최근 일주일)</h4>
                    <Chart
                      options={memberTrendOptions}
                      series={memberTrendSeries}
                      type="line"
                      height={200}
                    />
                  </div>

                  {/* 이용자 수 추이 차트 */}
                  <div className="chart-item">
                    <h4>이용자 수 추이 (전체회원수 vs 활동회원수)</h4>
                    <Chart
                      options={userActivityOptions}
                      series={userActivitySeries}
                      type="bar"
                      height={250}
                    />
                  </div>

                  {/* 통계 요약 파이 차트 */}
                  <div className="chart-item">
                    <h4>주간 통계 요약</h4>
                    <Chart
                      options={summaryOptions}
                      series={summarySeries}
                      type="pie"
                      height={300}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
