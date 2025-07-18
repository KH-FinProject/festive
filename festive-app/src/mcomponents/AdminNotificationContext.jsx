import { Client } from "@stomp/stompjs";
import React, { useEffect, useState, useContext } from "react";
import SockJS from "sockjs-client";
import useAuthStore from "../store/useAuthStore";

export const AdminNotificationProvider = ({ children }) => {
  const [hasNewReport, setHasNewReport] = useState(false);
  const [hasNewBooth, setHasNewBooth] = useState(false);
  const [hasNewInquiry, setHasNewInquiry] = useState(false);
  const { member } = useAuthStore();

  useEffect(() => {
    // 관리자만 WebSocket 구독
    if (!member || member.role !== "ADMIN") return;
    // WebSocket 연결 설정
    const connectWebSocket = () => {
      const API_URL =
        import.meta.env.VITE_API_URL || "https://api.festivekorea.site";
      const socket = new SockJS(`${API_URL}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log("WebSocket Debug:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log("✅ WebSocket 연결 성공:", frame);

        // 관리자 알림 구독
        client.subscribe("/topic/admin-alerts", (message) => {
          try {
            const alert = JSON.parse(message.body);
            console.log("🔔 관리자 알림 수신:", alert);

            // 알림 타입에 따라 상태 업데이트
            if (
              alert.type === "고객센터 문의" ||
              alert.message?.includes("고객센터")
            ) {
              setHasNewInquiry(true);
              console.log("📧 새로운 고객센터 문의 알림");
            } else if (alert.message?.includes("부스") || alert.applicantName) {
              setHasNewBooth(true);
              console.log("🏪 새로운 부스 신청 알림");
            } else if (
              alert.message?.includes("신고") ||
              alert.reportType !== undefined
            ) {
              setHasNewReport(true);
              console.log("🚨 새로운 신고 알림");
            }

            // 브라우저 알림 (권한이 있는 경우)
            if (Notification.permission === "granted") {
              new Notification("Festive 관리자 알림", {
                body: alert.message,
                icon: "/logo.png",
              });
            }
          } catch (error) {
            console.error("알림 처리 중 오류:", error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error("❌ WebSocket STOMP 오류:", frame.headers["message"]);
        console.error("추가 정보:", frame.body);
      };

      client.onWebSocketError = (error) => {
        console.error("❌ WebSocket 연결 오류:", error);
      };

      client.onDisconnect = () => {
        console.log("🔌 WebSocket 연결 해제됨");
      };

      client.activate();
    };

    // 브라우저 알림 권한 요청
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("알림 권한:", permission);
      });
    }

    connectWebSocket();
  }, [member]);

  return (
    <AdminNotificationContext.Provider
      value={{
        hasNewReport,
        setHasNewReport,
        hasNewBooth,
        setHasNewBooth,
        hasNewInquiry,
        setHasNewInquiry,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const AdminNotificationContext = React.createContext(null);

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationProvider"
    );
  }
  return context;
};
