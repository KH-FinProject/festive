import React, { createContext, useContext, useState, useEffect } from "react";

const AdminNotificationContext = createContext();

export function useAdminNotification() {
  return useContext(AdminNotificationContext);
}

export function AdminNotificationProvider({ children }) {
  const [hasNewReport, setHasNewReport] = useState(false);
  const [hasNewBooth, setHasNewBooth] = useState(false);
  const [hasNewInquiry, setHasNewInquiry] = useState(false);

  useEffect(() => {
    // 네이티브 WebSocket 사용 (SockJS 없이)
    let ws = null;

    const connectWebSocket = () => {
      try {
        // 환경변수에서 API URL 가져오기
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
        // HTTP/HTTPS를 WS/WSS로 변환
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        
        // 직접 WebSocket 연결 (SockJS 우회)
        ws = new WebSocket(`${wsUrl}/ws/websocket`);

        ws.onopen = function () {
          // STOMP CONNECT 프레임 수동 전송
          const connectFrame = "CONNECT\naccept-version:1.0,1.1,2.0\n\n\x00";
          ws.send(connectFrame);
        };

        ws.onmessage = function (event) {
          if (event.data.includes("CONNECTED")) {
            // 구독 프레임 전송
            const subscribeFrame =
              "SUBSCRIBE\nid:sub-0\ndestination:/topic/admin-alerts\n\n\x00";
            ws.send(subscribeFrame);
            return;
          }
          if (event.data.includes("/topic/admin-alerts")) {
            let isBooth = false;
            try {
              const alert = JSON.parse(event.data.split("\n").pop());
              if (alert.message?.includes("부스")) isBooth = true;
            } catch {
              if (event.data.includes("부스")) isBooth = true;
            }
            if (isBooth) setHasNewBooth(true);
            // 기존 신고 처리도 유지
            try {
              const alert = JSON.parse(event.data.split("\n").pop());
              if (alert.message?.includes("신고")) setHasNewReport(true);
              if (alert.message?.includes("문의")) setHasNewInquiry(true);
            } catch {
              if (event.data.includes("신고")) setHasNewReport(true);
              if (event.data.includes("문의")) setHasNewInquiry(true);
            }
          }
        };

        ws.onclose = function () {
          // 5초 후 재연결 시도
          setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };

        ws.onerror = function (error) {
          console.error("WebSocket 에러:", error);
        };
      } catch (error) {
        console.error("WebSocket 생성 에러:", error);
      }
    };

    // 연결 시작
    connectWebSocket();

    // 클린업
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

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
}
