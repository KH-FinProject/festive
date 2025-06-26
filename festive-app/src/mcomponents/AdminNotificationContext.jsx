import React, { createContext, useContext, useState, useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const AdminNotificationContext = createContext();

export function useAdminNotification() {
  return useContext(AdminNotificationContext);
}

export function AdminNotificationProvider({ children }) {
  const [hasNewReport, setHasNewReport] = useState(false);

  useEffect(() => {
    const client = new Client({
      // SockJS 연결 URL을 정확히 설정
      webSocketFactory: () => {
        console.log("WebSocket 연결 시도: http://localhost:8080/ws");
        return new SockJS("http://localhost:8080/ws");
      },
      debug: function (str) {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // 연결 상태 더 자세히 확인하기 위한 설정
      onStompError: (frame) => {
        console.error("STOMP 에러:", frame);
        console.error("STOMP 에러 상세:", frame.headers, frame.body);
      },
      onWebSocketError: (error) => {
        console.error("WebSocket 에러:", error);
      },
      onDisconnect: (frame) => {
        console.log("WebSocket 연결 해제:", frame);
      },
    });

    client.onConnect = (frame) => {
      console.log("WebSocket 연결 성공!");
      console.log("연결 프레임:", frame);

      // 구독 설정
      const subscription = client.subscribe(
        "/topic/admin-alerts",
        (message) => {
          console.log("받은 메시지 전체:", message);
          console.log("메시지 본문:", message.body);

          try {
            const alertData = JSON.parse(message.body);
            console.log("파싱된 알림 데이터:", alertData);
            setHasNewReport(true);
          } catch (error) {
            console.error("메시지 파싱 에러:", error);
            // 파싱 실패해도 알림은 표시
            setHasNewReport(true);
          }
        }
      );

      console.log("구독 완료:", subscription);
    };

    client.onStompError = (frame) => {
      console.error("STOMP 에러:", frame);
      console.error("에러 헤더:", frame.headers);
      console.error("에러 본문:", frame.body);
    };

    // 연결 활성화
    console.log("STOMP 클라이언트 활성화 시작");
    client.activate();

    // 클린업 함수
    return () => {
      console.log("WebSocket 연결 해제 중...");
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, []);

  return (
    <AdminNotificationContext.Provider
      value={{ hasNewReport, setHasNewReport }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}
