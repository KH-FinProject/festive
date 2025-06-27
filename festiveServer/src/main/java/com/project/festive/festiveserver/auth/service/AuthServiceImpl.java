package com.project.festive.festiveserver.auth.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.auth.dto.AuthKeyRequest;
import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.auth.dto.LoginResponse;
import com.project.festive.festiveserver.auth.entity.AuthKey;
import com.project.festive.festiveserver.auth.entity.RefreshToken;
import com.project.festive.festiveserver.auth.mapper.AuthMapper;
import com.project.festive.festiveserver.auth.repository.AuthKeyRepository;
import com.project.festive.festiveserver.auth.repository.RefreshTokenRepository;
import com.project.festive.festiveserver.common.util.JwtUtil;
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

	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final BCryptPasswordEncoder bcrypt;
	private final AuthKeyRepository authKeyRepository;
	private final JwtUtil jwtUtil;
	private final JavaMailSender mailSender;
	private final AuthMapper authMapper;

	@Override
	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> login(LoginRequest request) throws RuntimeException {
		
		Member member = memberRepository.findByUserId(request.getId())
				.orElseThrow(() -> new RuntimeException("존재하지 않는 계정입니다."));
		
		if (!bcrypt.matches(request.getPassword(), member.getPassword())) {
			throw new RuntimeException("비밀번호가 일치하지 않습니다.");
		}
		
		String accessToken = jwtUtil.generateAccessToken(member.getMemberNo(), member.getEmail(), member.getRole());
		String refreshToken = jwtUtil.generateRefreshToken(member.getMemberNo(), member.getEmail(), member.getRole());
		Date expirationDate = jwtUtil.getExpirationDate(refreshToken);
		LocalDateTime localExpirationDate = expirationDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
		
		RefreshToken refreshTokenEntity = RefreshToken.builder()
				.memberNo(member.getMemberNo())
				.refreshToken(refreshToken)
				.expirationDate(localExpirationDate)
				.build();
		
		int result = authMapper.updateRefreshToken(refreshTokenEntity);
		
		if (result == 0) {
			authMapper.insertRefreshToken(refreshTokenEntity);
		}
		
		Map<String, Object> map = new HashMap<>();
		map.put("refreshToken", refreshToken);
		map.put("accessToken", accessToken);

		LoginResponse loginResponse = LoginResponse.builder()
				.memberNo(member.getMemberNo())
				.name(member.getName())
				.nickname(member.getNickname())
				.email(member.getEmail())
				.role(member.getRole())
				.profileImage(member.getProfileImage())
				.build();
		
		map.put("loginResponse", loginResponse);
		
		return map;
	}

	@Override
	public void logout(Long memberNo) {
		refreshTokenRepository.deleteById(memberNo); // REFRESH_TOKEN의 ID는(PK) memberNo
	}
	
	@Override
	public Member findMemberByEmail(String userEmail) {
		Member member = memberRepository.findByEmail(userEmail)
				.orElseThrow(() -> new RuntimeException("존재하지 않는 이메일입니다."));

		return member;
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
			log.info("인증키 생성 완료: {}", authKey);
			
			// 인증키를 데이터베이스에 저장
			AuthKey authKeyEntity = AuthKey.builder()
					.email(email)
					.authKey(authKey)
					.createTime(LocalDateTime.now())
					.build();
			
			log.info("AuthKey 엔티티 생성 완료: {}", authKeyEntity);
			
			if (!storeAuthKey(authKeyEntity)) {
				log.error("인증키 저장 실패");
				throw new RuntimeException("인증키 저장에 실패했습니다.");
			}
			
			log.info("인증키 저장 완료");
			
			// 이메일 전송
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			
			helper.setTo(email);
			helper.setSubject("[Festive] 회원가입 인증번호");
			helper.setText(loadHtml(authKey, htmlName), true);
			
			log.info("이메일 메시지 생성 완료, 발송 시도...");
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
	public int checkAuthKey(AuthKeyRequest authKeyRequest) {
		AuthKey authKey = authKeyRepository.findByEmail(authKeyRequest.getEmail());
		
		if (authKey == null) {
			return 0; // 인증키가 존재하지 않음
		}
		
		if (authKey.getAuthKey().equals(authKeyRequest.getAuthKey())) {
			return 1; // 인증 성공
		}
		
		return 2; // 인증키 불일치
	}
	
	// 인증키와 이메일을 DB에 저장하는 메서드
	private boolean storeAuthKey(AuthKey authKeyEntity) {
		try {
			// 기존 이메일에 대한 인증키가 있는지 확인
			AuthKey existingAuthKey = authKeyRepository.findByEmail(authKeyEntity.getEmail());
			
			if (existingAuthKey != null) {
				// 기존 인증키가 있으면 업데이트
				existingAuthKey.setAuthKey(authKeyEntity.getAuthKey());
				existingAuthKey.setCreateTime(LocalDateTime.now());
				authKeyRepository.save(existingAuthKey); // UPDATE
				
			} else {
				// 기존 인증키가 없으면 새로 저장
				authKeyRepository.save(authKeyEntity); // INSERT
			}
			
			return true;
			
		} catch (Exception e) {
			log.error("인증키 저장 중 오류 발생: {}", e.getMessage(), e);
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
					<h2>Festive 회원가입 인증번호</h2>
					<p>안녕하세요! Festive 회원가입을 위한 인증번호입니다.</p>
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
	
}
