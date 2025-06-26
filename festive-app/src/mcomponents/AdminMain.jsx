import "./AdminMain.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";
import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const AdminMain = () => {
  const [notifications, setNotifications] = useState([]);

  // 웹소켓 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket 연결됨");

      // 관리자 알림 구독
      client.subscribe("/topic/admin-alerts", (message) => {
        const alert = JSON.parse(message.body);
        console.log("새로운 신고 알림:", alert);

        // 알림 목록에 추가
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: alert.message,
            reportType: alert.reportType,
            memberNo: alert.memberNo,
            timestamp: new Date().toLocaleString(),
          },
        ]);

        // 브라우저 알림 표시
        if (Notification.permission === "granted") {
          new Notification("새로운 신고", {
            body: alert.message,
            icon: "/logo.png",
          });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP 에러:", frame);
    };

    client.activate();

    // 브라우저 알림 권한 요청
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  const handleNotificationClick = (notification) => {
    // 신고 상세 페이지로 이동하거나 모달 표시
    console.log("신고 상세 보기:", notification);
    // 고객센터 페이지로 이동
    window.location.href = "/admin/customer-service";
  };

  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

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

              {/* 실시간 알림 표시 */}
              <div className="notification-area">
                {notifications.length > 0 && (
                  <div className="notification-badge">
                    {notifications.length}
                  </div>
                )}
                <div className="notification-dropdown">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <small>{notification.timestamp}</small>
                      </div>
                      <button
                        className="notification-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="main-section">
              <div className="main-item">
                <div className="item">
                  <span>신규회원추이</span>
                </div>
                <div className="item">
                  <span>이용자 수 추이</span>
                </div>
                <div className="item">
                  <span>탈퇴 회원 추이</span>
                </div>
              </div>
              <div className="chart">차트 들어가는 부분</div>
            </div>

            {/* 신고 알림 안내 */}
            <div className="reports-section">
              <h2>실시간 신고 알림</h2>
              <div className="reports-info">
                <p>
                  새로운 신고가 접수되면 실시간으로 알림을 받을 수 있습니다.
                </p>
                <p>
                  신고 처리는 <strong>고객센터 관리</strong> 페이지에서 할 수
                  있습니다.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
