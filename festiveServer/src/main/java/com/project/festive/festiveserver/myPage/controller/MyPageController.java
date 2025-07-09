package com.project.festive.festiveserver.myPage.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.dto.MyCalendarDto;
import com.project.festive.festiveserver.myPage.model.service.MyPageService;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
	
	// 비밀번호 일치 확인 (POST /mypage/check-current-password)
    @PostMapping("/check-current-password")
    public ResponseEntity<Map<String, Object>> checkCurrentPassword(
    		HttpServletRequest request, @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
    	String accessToken = getAccessTokenFromCookie(request);

        Long memberNo = jwtUtil.getMemberNo(accessToken);
        String password = requestBody.get("password");

        boolean match = service.checkPassword(memberNo, password);
        Map<String, Object> result = new HashMap<>();
        result.put("match", match);
        return ResponseEntity.ok(result);
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

    @PostMapping("/edit-info")
    public ResponseEntity<Map<String, String>> updateInfo(
            HttpServletRequest request,
            @RequestBody MemberDto updatedInfo) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "로그인이 필요합니다."));
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            log.info("회원 정보 수정 요청: memberNo = {}, updatedInfo = {}", memberNo, updatedInfo);

            // DB에서 회원정보 조회
            MemberDto member = service.getMyInfo(memberNo);
            if (member == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "회원을 찾을 수 없습니다."));
            }

            // 소셜회원 여부 체크 (socialId가 null이 아니면 소셜회원)
            boolean isSocial = (jwtUtil.getSocialId(accessToken) != null);

            // 일반회원만 비밀번호 검증, 소셜회원은 건너뜀
            if (!isSocial) {
                String password = updatedInfo.getPassword();
                if (password == null || password.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "비밀번호를 입력해주세요."));
                }
                boolean match = service.checkPassword(memberNo, password);
                if (!match) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "비밀번호가 일치하지 않습니다."));
                }
            }
            // 소셜회원(isSocial == true)은 비밀번호 확인 없이 바로 진행

            // 정보 수정 진행
            boolean result = service.updateMyInfo(memberNo, updatedInfo);

            if (result) {
                return ResponseEntity.ok(Map.of("message", "정보 수정 성공"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "정보 수정 중 오류가 발생했습니다."));
            }
        } catch (Exception e) {
            log.error("개인정보 수정 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "정보 수정 중 오류가 발생했습니다."));
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
                                                             @RequestParam("nickname") String nickname,
                                                             @RequestParam(value = "profileImage", required = false) MultipartFile profileImageFile) {
        try {
            String accessToken = getAccessTokenFromCookie(request);
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);

            if (nickname == null || nickname.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "수정할 닉네임을 입력해주세요."));
            }

            boolean result = service.updateProfile(memberNo, nickname, profileImageFile);

            if (result) {
                return ResponseEntity.ok(Map.of("message", "프로필 수정 성공"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "프로필 수정 실패"));
            }
        } catch (Exception e) {
            log.error("프로필 수정 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "프로필 수정 중 오류가 발생했습니다."));
        }
    }
    
    // 기본 이미지로 변경
    @PostMapping("/profile/reset-image")
    public ResponseEntity<?> resetProfileImage(HttpServletRequest request) {
    	String accessToken = getAccessTokenFromCookie(request);
    	Long memberNo = jwtUtil.getMemberNo(accessToken);
    	
        if (memberNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        boolean success = service.resetProfileImage(memberNo);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "기본 이미지로 변경되었습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "기본 이미지 변경 실패"));
        }
    }
    
     // 내가 찜한 축제 목록을 캘린더 및 리스트용으로 조회
    @GetMapping("/mycalendar")
    public ResponseEntity<List<MyCalendarDto>> getMyFavoriteFestivals(
            @AuthenticationPrincipal CustomUserDetails userDetails, HttpServletRequest request) { // Spring Security의 UserDetails 객체 사용 예시
    	
    	String accessToken = getAccessTokenFromCookie(request);
    	
        if (accessToken == null) {
            // 비로그인 사용자의 경우 401 Unauthorized 응답
            return ResponseEntity.status(401).build();
        }

        Long memberNo = jwtUtil.getMemberNo(accessToken);
        log.info("컨트롤러에서 memberNo : " + memberNo);
        List<MyCalendarDto> favoriteFestivals = service.getFavoriteFestivals(memberNo);
        log.info("컨트롤러에서 favoriteFestivals : ", favoriteFestivals);
        
        
        if (accessToken == null || accessToken.isEmpty()) {
            // 토큰이 없으면 비인가 상태로 응답
            return ResponseEntity.status(401).build();
        }
        
        return ResponseEntity.ok(favoriteFestivals);
    }

     // 찜 해제
    @DeleteMapping("/favorites/{contentId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable("contentId") String contentId,
            HttpServletRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

    	String accessToken = getAccessTokenFromCookie(request);
    	
        if (accessToken == null) {
            return ResponseEntity.status(401).build();
        }

        Long memberNo = jwtUtil.getMemberNo(accessToken);
        service.removeFavorite(memberNo, contentId);
        
        // 성공적으로 처리되었음을 200 OK로 응답
        return ResponseEntity.ok().build();
    }

}
