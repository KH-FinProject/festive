import React from "react";
import "./LegalPages.css";
import LegalSideMenu from "./LegalSideMenu";
import LegalScrollToTop from "./LegalScrollToTop";

const PrivacyPolicy = () => {
  return (
    <>
      <LegalSideMenu />
      <div className="legal-pages-container">
        <div className="legal-pages-content">
          <h1 className="legal-pages-title">개인정보 처리방침</h1>
          <div className="legal-pages-policy-date">
            <p>시행일자: 2025년 7월 1일</p>
            <p>최종 수정일: 2025년 7월 7일</p>
          </div>

          <div className="legal-pages-policy-intro">
            <p>
              (주)페스티브(이하 "회사")는 정보주체의 자유와 권리 보호를 위해
              「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게
              개인정보를 처리하고 안전하게 관리하고 있습니다.
            </p>
          </div>

          <section className="legal-pages-policy-section">
            <h2>제1조 (개인정보의 처리 목적)</h2>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
            <ul>
              <li>
                <strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제
                서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스
                부정이용 방지
              </li>
              <li>
                <strong>서비스 제공:</strong> 축제 정보 제공, AI 여행 코스 추천,
                커뮤니티 서비스, 부스 신청 서비스
              </li>
              <li>
                <strong>마케팅 및 광고 활용:</strong> 신규 서비스 개발 및 맞춤
                서비스 제공, 축제 참여기회 제공
              </li>
              <li>
                <strong>고객 상담 및 민원 처리:</strong> 민원인의 신원 확인,
                민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보
              </li>
            </ul>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제2조 (개인정보의 처리 및 보유 기간)</h2>
            <div className="table-wrapper">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>수집항목</th>
                    <th>보유기간</th>
                    <th>근거</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>회원정보</td>
                    <td>이메일, 닉네임, 프로필이미지</td>
                    <td>회원탈퇴 시까지</td>
                    <td>서비스 제공</td>
                  </tr>
                  <tr>
                    <td>소셜로그인</td>
                    <td>소셜계정 ID, 이름, 이메일</td>
                    <td>회원탈퇴 시까지</td>
                    <td>서비스 제공</td>
                  </tr>
                  <tr>
                    <td>커뮤니티 활동</td>
                    <td>게시글, 댓글, 좋아요</td>
                    <td>회원탈퇴 후 3년</td>
                    <td>서비스 품질 개선</td>
                  </tr>
                  <tr>
                    <td>접속기록</td>
                    <td>IP주소, 쿠키, 접속시간</td>
                    <td>3개월</td>
                    <td>통신비밀보호법</td>
                  </tr>
                  <tr>
                    <td>부스신청</td>
                    <td>사업자명, 연락처, 신청내용</td>
                    <td>신청 후 5년</td>
                    <td>사업자 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제3조 (개인정보의 제3자 제공)</h2>
            <p>
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서
              명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정
              등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를
              제3자에게 제공합니다.
            </p>

            <div className="table-wrapper">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>제공받는 자</th>
                    <th>제공 목적</th>
                    <th>제공 항목</th>
                    <th>보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>한국관광공사</td>
                    <td>축제 정보 제공</td>
                    <td>없음 (공개 API 이용)</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>OpenAI</td>
                    <td>AI 여행 코스 추천</td>
                    <td>비식별화된 여행 선호도</td>
                    <td>서비스 제공 기간</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제4조 (개인정보처리 위탁)</h2>
            <p>
              회사는 서비스 향상을 위해 아래와 같이 개인정보 처리업무를 위탁하고
              있습니다:
            </p>

            <div className="table-wrapper">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>수탁업체</th>
                    <th>위탁업무</th>
                    <th>위탁기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Amazon Web Services</td>
                    <td>서버 호스팅 및 데이터 저장</td>
                    <td>서비스 제공 기간</td>
                  </tr>
                  <tr>
                    <td>Google</td>
                    <td>소셜 로그인 서비스</td>
                    <td>서비스 제공 기간</td>
                  </tr>
                  <tr>
                    <td>Kakao</td>
                    <td>소셜 로그인 서비스</td>
                    <td>서비스 제공 기간</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제5조 (정보주체의 권리·의무 및 행사방법)</h2>
            <p>
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
              권리를 행사할 수 있습니다:
            </p>
            <ul>
              <li>개인정보 처리현황 통지요구</li>
              <li>개인정보 열람요구</li>
              <li>개인정보 정정·삭제요구</li>
              <li>개인정보 처리정지요구</li>
            </ul>
            <p>
              <strong>권리 행사 방법:</strong> 개인정보보호 책임자에게 서면,
              전화, 전자우편을 통하여 연락하시면 즉시 조치하겠습니다.
            </p>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제6조 (개인정보의 파기)</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
              불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <ul>
              <li>
                <strong>파기절차:</strong> 불필요한 개인정보 및 개인정보파일은
                개인정보보호 책임자의 책임 하에 파기
              </li>
              <li>
                <strong>파기방법:</strong> 전자적 파일은 기록을 재생할 수 없는
                기술적 방법을 사용하여 삭제
              </li>
            </ul>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제7조 (개인정보의 안전성 확보 조치)</h2>
            <p>
              회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에
              필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:
            </p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>개인정보를 안전하게 저장·전송할 수 있는 암호화 기법 사용</li>
              <li>
                해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기
                위한 보안시스템 운용
              </li>
            </ul>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제8조 (개인정보 보호책임자)</h2>
            <div className="contact-info">
              <p>
                <strong>개인정보 보호책임자:</strong> 성원숭 (대표이사)
              </p>
              <p>
                <strong>연락처:</strong>
              </p>
              <ul>
                <li>전화: 1588-1234</li>
                <li>이메일: rkdwl811@gmail.com</li>
              </ul>
              <p>
                정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보
                보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보
                보호책임자에게 문의하실 수 있습니다.
              </p>
            </div>
          </section>

          <section className="legal-pages-policy-section">
            <h2>제9조 (개인정보 처리방침 변경)</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
              변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
              전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          <div className="policy-footer">
            <p>본 방침은 2025년 7월 1일부터 시행됩니다.</p>
          </div>
        </div>
      </div>
      <LegalScrollToTop />
    </>
  );
};

export default PrivacyPolicy;
