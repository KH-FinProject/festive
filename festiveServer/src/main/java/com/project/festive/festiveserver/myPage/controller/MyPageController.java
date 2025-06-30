package com.project.festive.festiveserver.myPage.controller;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.model.service.MyPageService;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@CrossOrigin(origins="http://localhost:5173", allowCredentials = "true")
@RequestMapping("mypage")
@Slf4j
@RequiredArgsConstructor
@SessionAttributes({"loginMember"})
public class MyPageController {
	
	private final MyPageService service;
	private final JwtUtil jwtUtil;

	// 쿠키에서 accessToken 추출하는 헬퍼 메서드
	private String getAccessTokenFromCookie(HttpServletRequest request) {
		Cookie cookie = WebUtils.getCookie(request, "accessToken");
		return cookie != null ? cookie.getValue() : null;
	}

	// 회원탈퇴
	@PostMapping("/withdrawal")
	public ResponseEntity<String> withdraw(HttpServletRequest request,
	                                       @RequestBody Map<String, String> requestBody) {
	    try {
	        String accessToken = getAccessTokenFromCookie(request);
	        if (accessToken == null) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
	        }

	        Long memberNo = jwtUtil.getMemberNo(accessToken);
	        String password = requestBody.get("password");

	        boolean success = service.withdraw(memberNo, password);

	        if (success) {
	            return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
	        } else {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 일치하지 않습니다.");
	        }
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
	    }
	}
	
	// 비밀번호 변경
	@PostMapping("/change-password")
	public ResponseEntity<?> updatePassword(HttpServletRequest request,
	                                        @RequestBody Map<String, String> requestBody) {
	    try {
	        String accessToken = getAccessTokenFromCookie(request);
	        if (accessToken == null) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
	        }

	        Long memberNo = jwtUtil.getMemberNo(accessToken);
	        String currentPassword = requestBody.get("currentPassword");
	        String newPassword = requestBody.get("newPassword");

	        boolean result = service.changePw(memberNo, currentPassword, newPassword);

	        if (result) {
	            return ResponseEntity.ok(Map.of("message", "비밀번호 변경 성공"));
	        } else {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "현재 비밀번호가 일치하지 않습니다."));
	        }
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "서버 오류 발생"));
	    }
	}
	
	// 내가 작성한 게시글 목록 조회
	@GetMapping("/post")
	public ResponseEntity<List<BoardDto>> getMyPosts(HttpServletRequest request) {
	    try {
	        String accessToken = getAccessTokenFromCookie(request);
	        if (accessToken == null) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        }

	        Long memberNo = jwtUtil.getMemberNo(accessToken);
	        List<BoardDto> postList = service.getMyPosts(memberNo);
	        return ResponseEntity.ok(postList);
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}
	
	// 내가 쓴 작성한 댓글 목록 조회
	@GetMapping("/comment")
	public ResponseEntity<List<CommentDto>> getMyComments(HttpServletRequest request) {
		try {
			String accessToken = getAccessTokenFromCookie(request);
			if (accessToken == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

			Long memberNo = jwtUtil.getMemberNo(accessToken);
			List<CommentDto> postList = service.getMyComments(memberNo);
			return ResponseEntity.ok(postList);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// 현재 회원 정보 조회
    @GetMapping("/info")
    public ResponseEntity<MemberDto> getMyInfo(HttpServletRequest request) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            log.info("회원 정보 조회 요청: memberNo = {}", memberNo);
            MemberDto memberInfo = service.getMyInfo(memberNo);
            if (memberInfo != null) {
                return ResponseEntity.ok(memberInfo);
            } else {
                log.warn("회원 정보를 찾을 수 없음: memberNo = {}", memberNo);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            log.error("회원 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 개인정보 수정
    @PostMapping("/edit-info")
    public ResponseEntity<Map<String, String>> updateInfo(HttpServletRequest request,
                                        @RequestBody MemberDto updatedInfo) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            log.info("회원 정보 수정 요청: memberNo = {}, updatedInfo = {}", memberNo, updatedInfo);

            boolean result = service.updateMyInfo(memberNo, updatedInfo);

            if (result) {
                return ResponseEntity.ok(Map.of("message", "정보 수정 성공"));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "비밀번호가 일치하지 않습니다."));
            }
        } catch (Exception e) {
            log.error("개인정보 수정 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "정보 수정 중 오류가 발생했습니다."));
        }
    }
    
 // 프로필 정보 조회 (이름, 닉네임, 프로필 이미지) - /mypage/profile
    @GetMapping("/profile")
    public ResponseEntity<MemberDto> getProfileInfo(HttpServletRequest request) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            log.info("프로필 정보 조회 요청: memberNo = {}", memberNo);
            MemberDto profileInfo = service.getProfileInfo(memberNo);
            if (profileInfo != null) {
                return ResponseEntity.ok(profileInfo);
            } else {
                log.warn("프로필 정보를 찾을 수 없음: memberNo = {}", memberNo);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            log.error("프로필 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 닉네임 중복 확인 - /mypage/profile/checkNickname
    @GetMapping("/profile/checkNickname")
    public ResponseEntity<Map<String, Boolean>> checkNickname(HttpServletRequest request,
                                                              @RequestParam("nickname") String nickname) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            
            // 현재 로그인한 사용자의 닉네임은 제외하고 중복 검사
            boolean isDuplicate = service.checkNicknameDuplicate(nickname, memberNo);
            
            return ResponseEntity.ok(Map.of("isDuplicate", isDuplicate));
        } catch (Exception e) {
            log.error("닉네임 중복 확인 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("isDuplicate", true)); // 오류 시 중복으로 처리
        }
    }

    // 프로필 업데이트 (닉네임, 프로필 이미지) - /mypage/profile
    @PostMapping("/edit-profile")
    public ResponseEntity<Map<String, String>> updateProfile(HttpServletRequest request,
                                                             @RequestBody Map<String, String> requestBody) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            String nickname = requestBody.get("nickname");
            String password = requestBody.get("password");

            if ((nickname == null || nickname.isEmpty())) {
                return ResponseEntity.badRequest().body(Map.of("message", "수정할 닉네임을 입력해주세요."));
            }

            boolean result = service.updateProfile(memberNo, nickname, null, password);

            if (result) {
                return ResponseEntity.ok(Map.of("message", "프로필 수정 성공"));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "비밀번호가 일치하지 않습니다."));
            }
        } catch (Exception e) {
            log.error("프로필 수정 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "프로필 수정 중 오류가 발생했습니다."));
        }
    }
}
