package com.project.festive.festiveserver.auth.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.auth.dto.AuthKeyRequest;
import com.project.festive.festiveserver.auth.dto.FindAuthKeyRequest;
import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.auth.dto.LoginResponse;
import com.project.festive.festiveserver.auth.entity.EmailAuthKey;
import com.project.festive.festiveserver.auth.entity.RefreshToken;
import com.project.festive.festiveserver.auth.entity.TelAuthKey;
import com.project.festive.festiveserver.auth.mapper.AuthMapper;
import com.project.festive.festiveserver.auth.repository.EmailAuthKeyRepository;
import com.project.festive.festiveserver.auth.repository.RefreshTokenRepository;
import com.project.festive.festiveserver.auth.repository.TelAuthKeyRepository;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.common.util.SolapiUtil;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.repository.MemberRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

	private final BCryptPasswordEncoder bcrypt;
	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final EmailAuthKeyRepository emailAuthKeyRepository;
	private final TelAuthKeyRepository telAuthKeyRepository;
	private final JwtUtil jwtUtil;
	private final JavaMailSender mailSender;
	private final AuthMapper authMapper;
	private final SolapiUtil solapiUtil;

	@Override
	public Map<String, Object> login(LoginRequest request) {
		
		Map<String, Object> result = new HashMap<>();
		
		// 1. 사용자 존재 여부 확인
		Optional<Member> memberOpt = memberRepository.findByUserIdAndNotDeleted(request.getId());
		if (!memberOpt.isPresent()) {
			result.put("success", false);
			result.put("message", "존재하지 않거나 탈퇴한 계정입니다.");
			return result;
		}
		
		Member member = memberOpt.get();
		
		// 2. 비밀번호 확인
		if (!bcrypt.matches(request.getPassword(), member.getPassword())) {
			result.put("success", false);
			result.put("message", "비밀번호가 일치하지 않습니다.");
			return result;
		}
		
		// 3. 로그인 성공 시 토큰 생성
		String accessToken = jwtUtil.generateAccessToken(member.getMemberNo(), member.getEmail(), member.getRole(), member.getSocialId());
		String refreshToken = jwtUtil.generateRefreshToken(member.getMemberNo(), member.getEmail(), member.getRole(), member.getSocialId());
		Date expirationDate = jwtUtil.getExpirationDate(refreshToken);
		LocalDateTime localExpirationDate = expirationDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
		
		RefreshToken refreshTokenEntity = RefreshToken.builder()
				.memberNo(member.getMemberNo())
				.refreshToken(refreshToken)
				.expirationDate(localExpirationDate)
				.build();
		
		int updateResult = authMapper.updateRefreshToken(refreshTokenEntity);
		
		if (updateResult == 0) {
			authMapper.insertRefreshToken(refreshTokenEntity);
		}
		
		// 4. 성공 응답 구성
		result.put("success", true);
		result.put("refreshToken", refreshToken);
		result.put("accessToken", accessToken);

		LoginResponse loginResponse = LoginResponse.builder()
				.memberNo(member.getMemberNo())
				.name(member.getName())
				.nickname(member.getNickname())
				.email(member.getEmail())
				.role(member.getRole())
				.profileImage(member.getProfileImage())
				.build();
		
		result.put("loginResponse", loginResponse);
		
		return result;
	}

	@Override
	public void logout(Long memberNo) {
		refreshTokenRepository.deleteById(memberNo); // REFRESH_TOKEN의 ID는(PK) memberNo
	}

	@Override
	public Member findMember(Long memberNo) {
		return memberRepository.findById(memberNo).orElse(null);
	}

	@Override
	public String findRefreshToken(Long memberNo) {
		return refreshTokenRepository.findById(memberNo) // Optional<RefreshToken> 객체를 반환함 (해당 회원의 토큰이 있을 수도, 없을 수도 있음)
				.map(RefreshToken::getRefreshToken) // Optional<RefreshToken>을 Optional<String>으로 변환 (토큰 문자열만 추출)
				.orElse(null); // 값이 없을 경우 null 반환
	}
	
	@Override
	public LocalDateTime findRefreshTokenExpiration(Long memberNo) {
	    return refreshTokenRepository
	        .findById(memberNo)
	        .map(RefreshToken::getExpirationDate)
	        .orElse(null);
	}
	
	@Override
	public int updatePasswordByMemberNo(Long memberNo, String pw) {
		
		String encPw = bcrypt.encode(pw);
		
		return memberRepository.updatePasswordByMemberNo(memberNo, encPw);
	}

	/**
	 * 만료된 리프레시 토큰들을 삭제합니다.
	 * @return 삭제된 토큰의 개수
	 */
	@Override
	public int deleteExpiredRefreshTokens() {
		LocalDateTime now = LocalDateTime.now();
		int deletedCount = refreshTokenRepository.deleteAllByExpirationDateBefore(now);
		log.info("만료된 리프레시 토큰 {}개를 삭제했습니다.", deletedCount);
		return deletedCount;
	}
	
	/**
	 * 특정 회원의 리프레시 토큰이 유효한지 확인합니다.
	 * @param memberNo 회원 번호
	 * @return 토큰이 존재하고 만료되지 않았으면 true, 그렇지 않으면 false
	 */
	@Override
	public boolean isRefreshTokenValid(Long memberNo) {
		return refreshTokenRepository.findById(memberNo)
				.map(token -> token.getExpirationDate().isAfter(LocalDateTime.now()))
				.orElse(false);
	}
	
	@Override
	public String sendEmail(String htmlName, String email) {
		try {
			log.info("이메일 발송 시작: {}", email);

			String authKey = createAuthKey();

			if (!storeEmailAuthKey(email, authKey)) {
				log.error("이메일 인증키 저장 실패");
				throw new RuntimeException("인증키 저장에 실패했습니다.");
			}

			MimeMessage message = mailSender.createMimeMessage();

			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setTo(email);
			helper.setSubject("[Festive] 인증번호 발송");
			helper.setText(loadHtml(authKey, htmlName), true);

			mailSender.send(message);

			log.info("이메일 발송 성공: {}", email);

			return "인증번호가 이메일로 전송되었습니다.";

		} catch (MessagingException e) {
			log.error("이메일 전송 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("이메일 전송에 실패했습니다.");
		} catch (Exception e) {
			log.error("인증키 생성 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("인증키 생성에 실패했습니다.");
		}
	}
	
	@Override
	public String sendSms(String tel) {
		try {
			log.info("SMS 발송 시작: {}", tel);

			String authKey = createAuthKey();

			if (!storeTelAuthKey(tel, authKey)) {
				log.error("전화번호 인증키 저장 실패");
				throw new RuntimeException("인증키 저장에 실패했습니다.");
			}

			solapiUtil.sendVerificationCode(tel, "01073471916", authKey);

			log.info("SMS 발송 성공: {}", tel);
			return "인증번호가 SMS로 전송되었습니다.";

		} catch (Exception e) {
			log.error("인증키 생성 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("인증키 생성에 실패했습니다.");
		}
	}
	
	@Override
	public int checkAuthKey(AuthKeyRequest req) {
		if ("email".equals(req.getAuthMethod())) {
			EmailAuthKey entity = emailAuthKeyRepository.findById(req.getEmail()).orElse(null);
			if (entity == null) return 0;
			if (entity.getAuthKey().equals(req.getAuthKey())) return 1;
			return 2;
			
		} else if ("tel".equals(req.getAuthMethod())) {
			TelAuthKey entity = telAuthKeyRepository.findById(req.getTel()).orElse(null);
			if (entity == null) return 0;
			if (entity.getAuthKey().equals(req.getAuthKey())) return 1;
			return 2;
		}
		return 0;
	}
	
	/** 아이디/비밀번호 찾기 인증번호 확인 메서드
	 * @param req 아이디(+name)/비밀번호(+id) 추가 인증 요청
	 * @return 0: 존재하지 않는 회원, 1: 존재하는 회원, 2: 인증번호 문제
	 */
	@Override
	public int findCheckAuthKey(FindAuthKeyRequest req) {
        int result = switch (req.getType()) {
            case "id" -> switch (req.getAuthMethod()) {
                case "email" -> authMapper.checkIdFindByEmail(req.getName(), req.getEmail(), req.getAuthKey()) > 0 ? 1 : 0;
                case "tel" -> authMapper.checkIdFindByTel(req.getName(), req.getTel(), req.getAuthKey()) > 0 ? 1 : 0;
                default -> 0;
            };
            case "pw" -> switch (req.getAuthMethod()) {
                case "email" -> authMapper.checkPwFindByEmail(req.getUserId(), req.getEmail(), req.getAuthKey()) > 0 ? 1 : 0;
                case "tel" -> authMapper.checkPwFindByTel(req.getUserId(), req.getTel(), req.getAuthKey()) > 0 ? 1 : 0;
                default -> 0;
            };
            default -> 0;
        };
        return result;
	}
	
	private boolean storeEmailAuthKey(String email, String authKey) {
		try {
			emailAuthKeyRepository.save(EmailAuthKey.builder()
				.email(email)
				.authKey(authKey)
				.createTime(LocalDateTime.now())
				.build());
			return true;
		} catch (Exception e) {
			log.error("이메일 인증키 저장 오류: {}", e.getMessage(), e);
			return false;
		}
	}
	
	private boolean storeTelAuthKey(String tel, String authKey) {
		try {
			telAuthKeyRepository.save(TelAuthKey.builder()
				.tel(tel)
				.authKey(authKey)
				.createTime(LocalDateTime.now())
				.build());
			return true;
		} catch (Exception e) {
			log.error("전화번호 인증키 저장 오류: {}", e.getMessage(), e);
			return false;
		}
	}
	
	// HTML 템플릿을 로드하는 메서드
	private String loadHtml(String authKey, String htmlName) {
		// 간단한 HTML 템플릿 반환
		return """
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Festive 인증번호</title>
			</head>
			<body>
				<div style="text-align: center; padding: 20px;">
					<h2>Festive 인증번호</h2>
					<p>안녕하세요! Festive 인증번호입니다.</p>
					<div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
						<h3 style="color: #333; margin: 0;">인증번호: <span style="color: #007bff; font-weight: bold;">%s</span></h3>
					</div>
					<p>위 인증번호를 입력해주세요.</p>
					<p>감사합니다.</p>
				</div>
			</body>
			</html>
			""".formatted(authKey);
	}
	
	// 인증번호 발급 메서드
	// UUID를 사용하여 인증키 생성
	private String createAuthKey() {
		return UUID.randomUUID().toString().substring(0, 6);
	}

	// 변경할 이메일 중복 검사 - 지현이가 추가함
	@Override
	public boolean isEmailDuplicate(String email) {
			// MemberRepository를 사용하여 이메일 존재 여부 확인
			return memberRepository.findByEmail(email).isPresent();
	}
	
	@Override
	public void saveRefreshToken(Long memberNo, String refreshToken, LocalDateTime expirationDate) {
		RefreshToken refreshTokenEntity = RefreshToken.builder()
			.memberNo(memberNo)
			.refreshToken(refreshToken)
			.expirationDate(expirationDate)
			.build();

		int updateResult = authMapper.updateRefreshToken(refreshTokenEntity);
		if (updateResult == 0) {
			authMapper.insertRefreshToken(refreshTokenEntity);
		}
	}
	
	@Override
	public Map<String, Object> findIdSocialByEmail(String name, String email, String authKey) {
		return authMapper.findIdSocialByEmail(name, email, authKey);
	}
	
	@Override
	public Map<String, Object> findIdSocialByTel(String name, String tel, String authKey) {
		return authMapper.findIdSocialByTel(name, tel, authKey);
	}
	
	@Override
	public int findPwSocialByEmail(String userId, String email, String authKey) {
		return authMapper.findPwSocialByEmail(userId, email, authKey);
	}

	@Override
	public int findPwSocialByTel(String userId, String tel, String authKey) {
		return authMapper.findPwSocialByTel(userId, tel, authKey);
	}
	
}
