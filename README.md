# 🎪 FESTIVE - AI 기반 축제 플랫폼
> **Full-Stack 개발 포트폴리오 프로젝트**  
> 실제 TourAPI와 OpenAI를 활용한 종합 축제 정보 서비스

[![Vercel](https://img.shields.io/badge/Vercel-Live-brightgreen?style=flat-square&logo=vercel)](https://festivekorea.site)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green?style=flat-square&logo=spring)](https://spring.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=flat-square&logo=openai)](https://openai.com/)

## 📖 프로젝트 개요

**FESTIVE**는 실시간 축제 정보와 AI 기반 맞춤형 여행 코스를 제공하는 종합 플랫폼입니다.  
단순한 정보 제공을 넘어 **실제 사용 가능한 서비스** 구현에 중점을 둔 **Full-Stack 개발 프로젝트**입니다.

### 🎯 핵심 가치
- **실용성**: 실제 TourAPI 데이터 기반의 정확한 축제 정보
- **지능성**: OpenAI GPT를 활용한 개인 맞춤형 여행 추천
- **안정성**: 하이브리드 파싱, 예외 처리, 보안 강화

---

## ✨ 주요 기능 및 기술적 성과

### 🤖 AI 여행 코스 추천 시스템
**OpenAI GPT-4와 실제 관광 데이터를 결합한 지능형 추천 엔진**

- **프롬프트 엔지니어링**: 지역별 맞춤 추천을 위한 Few-shot Learning 적용
- **데이터 검증 시스템**: AI가 가상 장소 생성을 방지하는 3단계 검증 로직
- **실시간 연동**: TourAPI와 OpenAI API 동시 처리로 정확성과 창의성 확보

```javascript
// AI 응답 검증 및 재생성 시스템
if (containsForbiddenPlaces(response)) {
    return retryWithStricterPrompt(message, tourData);
}
```

### 🔄 하이브리드 API 파싱 시스템
**TourAPI의 불규칙한 응답 형식(JSON/XML)을 자동 감지하여 처리**

- **자동 형식 감지**: 응답 첫 글자 분석으로 JSON/XML 자동 구분
- **무중단 서비스**: API 응답 형식 변경에도 서비스 중단 없음
- **예외 처리**: 알 수 없는 형식도 안전하게 처리

```javascript
// 하이브리드 파싱 핵심 로직
if (trimmedResponse.startsWith("<")) {
    return parseXMLResponse(response);
} else if (trimmedResponse.startsWith("{")) {
    return parseJSONResponse(response);
}
```

### 🔐 통합 인증 시스템
**일반 로그인과 OAuth2 소셜 로그인을 통합한 보안 강화 시스템**

- **다중 인증**: 일반, Google, Naver, Kakao 로그인 지원
- **보안 강화**: JWT + BCrypt 암호화, 탈퇴 회원 재로그인 방지
- **사용자 경험**: 소셜 로그인 시 닉네임 자동 설정 로직

### 📊 실시간 데이터 관리
**외부 API와 내부 데이터의 효율적 동기화**

- **TourAPI 연동**: 축제, 관광지, 숙박 정보 실시간 수집
- **지능형 캐싱**: 무한 스크롤과 페이지네이션 최적화
- **지역별 필터링**: 위치 기반 맞춤 정보 제공

---

## 🛠️ 기술 스택

### **Frontend**
- **React 18** + **Vite** - 모던 개발 환경
- **Zustand** - 경량 상태 관리
- **React Router** - SPA 라우팅
- **Axios** - HTTP 클라이언트
- **Kakao Map API** - 지도 및 위치 서비스

### **Backend**
- **Spring Boot 3.x** - 엔터프라이즈 백엔드
- **Spring Security** - 인증/인가
- **MyBatis** - SQL 매퍼
- **Oracle DB** - 관계형 데이터베이스
- **JWT** - 토큰 기반 인증

### **External APIs**
- **OpenAI GPT-4** - AI 여행 추천
- **TourAPI** - 관광/축제 정보
- **공공데이터포털** - 주차장 정보
- **OAuth2** - 소셜 로그인

### **DevOps & Deployment**
- **Vercel** - 프론트엔드 자동 배포
- **AWS EC2** - 백엔드 서버
- **GitHub Actions** - CI/CD 파이프라인
- **환경 분리** - 개발/프로덕션 환경 구분

---

## 🎯 핵심 문제 해결 사례

### 1. **TourAPI 응답 형식 불일치 해결**
**문제**: TourAPI가 JSON/XML을 혼재하여 응답, 서비스 중단 발생  
**해결**: 응답 형식 자동 감지 및 하이브리드 파싱 시스템 구현  
**결과**: 100% 무중단 서비스 달성

### 2. **AI 가상 장소 생성 문제**
**문제**: AI가 실제 TourAPI 데이터 대신 일반적인 관광지(경복궁, 명동 등) 추천  
**해결**: 데이터 강제 주입 + 실시간 검증 + 2단계 재생성 시스템  
**결과**: 100% 실제 데이터 기반 추천 달성

### 3. **지역 코드 추론 실패**
**문제**: AI가 "서울" → areaCode "1" 매핑을 못함  
**해결**: Few-shot Learning으로 구체적 매핑 예시 제공  
**결과**: 주요 광역시 100% 정확 인식

---

## 📱 주요 화면

| 메인 페이지 | AI 여행 추천 | 축제 상세 정보 |
|------------|-------------|---------------|
| 실시간 축제 정보 제공 | 맞춤형 여행 코스 생성 | 상세 정보 및 지도 |

| 커뮤니티 | 관리자 시스템 | 부스 신청 |
|----------|-------------|----------|
| 와글와글 게시판 | 통합 관리 대시보드 | 푸드트럭/플리마켓 신청 |

---

## 🚀 성능 및 최적화

### **프론트엔드 최적화**
- **코드 스플리팅**: 페이지별 번들 분할로 초기 로딩 시간 50% 단축
- **무한 스크롤**: 가상화를 통한 대용량 데이터 렌더링 최적화
- **이미지 최적화**: Lazy Loading 및 WebP 포맷 적용

### **백엔드 최적화**
- **연결 풀링**: HikariCP를 통한 DB 연결 최적화
- **쿼리 최적화**: MyBatis 동적 쿼리로 필요한 데이터만 조회
- **API 호출 최적화**: 병렬 처리 및 캐싱으로 응답 속도 향상

### **보안 강화**
- **XSS 방지**: 사용자 입력 검증 및 이스케이프 처리
- **CSRF 보호**: Spring Security 기본 보안 설정
- **API 키 보안**: 환경변수 분리 및 콘솔 출력 제거

---

## 📈 개발 성과

### **기술적 성장**
- **Full-Stack 역량**: Frontend/Backend 전 영역 개발 경험
- **AI 통합**: OpenAI API를 실제 서비스에 안정적으로 적용
- **외부 API 연동**: 다양한 공공 API와 상용 API 통합 경험
- **실무 중심 개발**: 실제 배포 및 운영까지 완주

### **문제 해결 능력**
- **복합적 사고**: API 불안정성, AI 한계, 사용자 경험을 종합적으로 고려
- **창의적 해결**: 기존 방법론을 넘어 새로운 접근법 개발
- **지속적 개선**: 사용자 피드백 기반 지속적 기능 개선

---

## 🔗 배포 및 링크

- **🌐 Live Demo**: [https://festivekorea.site](https://festivekorea.site)
- **📱 반응형**: 모바일/태블릿/PC 모든 환경 지원 
- **⚡ 성능**: Lighthouse 성능 점수 90+ 달성

---

## 🏗️ 로컬 실행 방법

### 필수 요구사항
- Node.js 18+
- Java 17+
- Oracle Database 11g+

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/dudals3530/festive.git
cd festive

# 프론트엔드 실행
cd festive-app
npm install
npm run dev

# 백엔드 실행 (새 터미널)
cd festiveServer
./gradlew bootRun
```

### 환경변수 설정

```bash
# .env (프론트엔드)
VITE_API_URL=http://localhost:8080
VITE_KAKAO_MAP_API_KEY=your_kakao_key
VITE_TOURAPI_KEY=your_tour_api_key
VITE_PUBLIC_CARPARK_API=your_parking_api_key

# application.properties (백엔드)
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:xe
spring.datasource.username=your_username
spring.datasource.password=your_password
openai.api.key=your_openai_key
```

---

## 📞 연락처

- **GitHub**: [@dudals3530](https://github.com/dudals3530)
- **Email**: dudals3530@naver.com
- **Portfolio**: [프로젝트 상세 설명](https://festivekorea.site)

---

## 📄 라이선스

이 프로젝트는 포트폴리오 목적으로 제작되었으며, 상업적 이용은 제한됩니다.

---

*"실제 사용자에게 가치를 제공하는 서비스를 만들고자 했습니다.  
기술은 수단이고, 사용자의 경험이 목적이라는 믿음으로 개발했습니다."*

**- 김영민, Full-Stack Developer** 