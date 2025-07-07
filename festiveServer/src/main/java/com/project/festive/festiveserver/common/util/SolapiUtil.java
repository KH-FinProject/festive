package com.project.festive.festiveserver.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
public class SolapiUtil {
    
    // API 인증에 필요한 키 정보를 설정합니다
    @Value("${solapi.api.key}")
    private String apiKey; // 발급받은 API 키
    
    @Value("${solapi.api.secret}")
    private String apiSecret; // 발급받은 API Secret
    
    /**
     * 인증번호 SMS를 보냅니다.
     * @param to            수신자 전화번호
     * @param from          사전 등록된 발신번호
     * @param code          발송할 인증번호
     * @throws Exception
     */
    public void sendVerificationCode(String to, String from, String code) throws Exception {
        String method = "POST";
        String path = "/messages/v4/send";
        String date = Instant.now().toString(); // 현재 시간: ISO 형식
        String salt = UUID.randomUUID().toString().replace("-", ""); // salt: UUID 활용
        
        // 서명을 위한 메시지 생성
        String message = date + salt;
        // 서명: HMAC-SHA256 형식
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(apiSecret.getBytes(), "HmacSHA256"));
        String signature = bytesToHex(hmac.doFinal(message.getBytes()));
        
        URL url = URI.create("https://api.solapi.com" + path).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", String.format(
                "HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
                apiKey, date, salt, signature
        ));
        conn.setDoOutput(true);
        
        String body = String.format(
                "{\"message\":{\"to\":\"%s\",\"from\":\"%s\",\"text\":\"[Festive] 인증번호 %s 입니다.\"}}",
                to, from, code
        );
        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
        
        int responseCode = conn.getResponseCode();
        log.debug("SMS 요청 응답 코드: {}", responseCode);
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                (responseCode == 200) ? conn.getInputStream() : conn.getErrorStream()))) {
            StringBuilder response = new StringBuilder();
            
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            
            log.debug("SMS 응답 결과: {}", response.toString());
        }
    }
    
    // 바이트 배열을 16진수 문자열로 변환하는 헬퍼 메서드
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
    
    /* 요청 헤더 만드는 예시 코드
    public void test() throws Exception {
        
        // 현재 시간을 ISO 형식으로 가져옵니다
        String date = Instant.now().toString();
        // UUID를 생성하여 salt로 사용합니다
        String salt = UUID.randomUUID().toString().replace("-", "");
        
        // 서명을 위한 메시지를 생성합니다
        String message = date + salt;
        
        // HMAC-SHA256으로 서명을 생성합니다
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(apiSecret.getBytes(), "HmacSHA256"));
        String signature = bytesToHex(hmac.doFinal(message.getBytes()));
        
        // API 요청을 위한 URL을 생성합니다
        URL url = URI.create("https://api.solapi.com/messages/v4/list?limit=1").toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        // 생성된 인증 정보를 헤더에 포함시킵니다
        conn.setRequestProperty("Authorization",
                String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
                        apiKey, date, salt, signature));
    }
    */
}