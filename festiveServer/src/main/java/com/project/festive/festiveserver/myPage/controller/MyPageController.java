package com.project.festive.festiveserver.myPage.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.model.service.MyPageService;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@RestController // 비동기 컨트롤러
@CrossOrigin(origins="http://localhost:5173" /*, allowCredentials = "true"*/ )
// , allowCredentials = "true" 클라이언트로부터 들어오는 쿠키 허용
@RequestMapping("mypage")
@Slf4j
@RequiredArgsConstructor
@SessionAttributes({"loginMember"})
public class MyPageController {
	
	private final MyPageService service;

	/**
	 * 회원탈퇴
	 * 
	 * @param member
	 * @return
	 */
	@PostMapping("withdrawal")
	public ResponseEntity<String> withdrawal(@RequestBody MemberDto member) {
		try {
			log.info("컨트롤러 들어옴1");
			// 요청에서 필요한 정보 추출
			String memberPw = "pass6";
			long memberNo = 6; // 프론트에서 로그인한 회원 번호를 포함하여 전달
			
			log.info("PW: " + memberPw); // 로그 찍히는지 확인
			log.info("NO: " + memberNo);
		    
			int result = service.withdrawal(memberPw, memberNo);

			log.info("컨트롤러 들어옴");
			if (result > 0) {
				return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 일치하지 않습니다.");
			}

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원 탈퇴 중 서버 오류 발생");
		}

	}
	
//	@GetMapping("/profile")
//	public ResponseEntity<?> getMyInfoMain(HttpSession session) {
//	    // 1. 세션 기반 확인
//	    MemberDto loginMember = (MemberDto) session.getAttribute("loginMember");
//	    log.info("로그인 회원 번호 : ", loginMember);
//	    if (loginMember != null) {
//	        Long memberNo = loginMember.getMemberNo();
//	        return ResponseEntity.ok(service.getMemberInfo(memberNo));
//	    }
//
//	    // 2. JWT 기반 확인
//	    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//	    if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails) {
//	        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
//	        int memberNo = userDetails.getMemberNo();
//	        return ResponseEntity.ok(service.getMemberInfo(memberNo));
//	    }
//
//	    // 3. 로그인 안 된 경우
//	    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
//	}

	
//	// 프로필 사진 변경
//	// MemberController.java
//	@PutMapping("/mypage/profile")
//	public ResponseEntity<?> updateProfile(@RequestParam int memberNo,
//	                                       @RequestParam String nickname,
//	                                       @RequestParam(required = false) MultipartFile profileImage) {
//	    service.updateProfile(memberNo, nickname, profileImage);
//	    return ResponseEntity.ok().build();
//	}

	
//	/** 회원 정보 조회 (GET) */
//    @GetMapping("/info/{memberNo}")
//    public ResponseEntity<MemberDto> getInfo(@PathVariable int memberNo) {
//    	MemberDto member = service.getMemberByNo(memberNo);
//        if (member != null) {
//            return ResponseEntity.ok(member);
//        } else {
//            return ResponseEntity.notFound().build();
//        }
//    }
//
//    /** 회원 정보 수정 (PUT) */
//    @PutMapping("/info")
//    public ResponseEntity<Map<String, Object>> updateInfo(@RequestBody MemberDto inputMember) {
//        // inputMember에 memberNo 포함되어 있어야 함 (토큰이나 세션에서 가져오는 로직은 생략)
//        // 주소가 여러 필드로 분리되어 있으면 프론트에서 합쳐서 보내거나,
//        // JSON 구조를 변경하여 받아서 서비스단에서 합칠 수 있음
//
//        int result = service.updateInfo(inputMember);
//
//        if (result > 0) {
//            return ResponseEntity.ok(Map.of("message", "회원 정보 수정 성공"));
//        } else {
//            return ResponseEntity.badRequest().body(Map.of("message", "회원 정보 수정 실패"));
//        }
//    }

	/** 비밀번호 변경 (POST) */
	@PostMapping("/pw")
	public ResponseEntity<Map<String, Object>> changePw(@RequestBody Map<String, String> paramMap) {

	    // 1. 필수 파라미터 유효성 검사
	    if (!paramMap.containsKey("currentPw") || !paramMap.containsKey("newPw") || !paramMap.containsKey("memberNo")) {
	        return ResponseEntity
	                .badRequest()
	                .body(Map.of("message", "필수 정보(currentPw, newPw, memberNo)가 누락되었습니다."));
	    }

	    try {
	        // 2. 파라미터 꺼내기
	        String currentPw = paramMap.get("currentPw");
	        String newPw = paramMap.get("newPw");
	        int memberNo = Integer.parseInt(paramMap.get("memberNo"));

	        // 3. 서비스 호출
	        int result = service.changePw(paramMap, memberNo);

	        // 4. 결과 반환
	        if (result > 0) {
	            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다!"));
	        } else {
	            return ResponseEntity.badRequest().body(Map.of("message", "현재 비밀번호가 일치하지 않습니다."));
	        }

	    } catch (NumberFormatException e) {
	        return ResponseEntity
	                .badRequest()
	                .body(Map.of("message", "memberNo는 숫자여야 합니다."));
	    } catch (Exception e) {
	        return ResponseEntity
	                .status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body(Map.of("message", "서버 오류 발생"));
	    }
	}
	
	// 내가 작성한 게시글
	@GetMapping("/mypost")
	public ResponseEntity<?> getMyPosts(@RequestParam("memberNo") int memberNo) {
	    List<BoardDto> list = service.getMyPosts(memberNo);
	    return ResponseEntity.ok(list);
	}
	
	// 내가 작성한 댓글
	@GetMapping("/comments")
	public ResponseEntity<?> getMyComments(@RequestParam("memberNo") int memberNo) {
	    List<CommentDto> list = service.getMyComments(memberNo);
	    return ResponseEntity.ok(list);
	}
	
	// 정보 조회
    @GetMapping("/info")
    public ResponseEntity<?> getMyInfo(@RequestParam int memberNo) {
        return ResponseEntity.ok(service.getMemberInfo(memberNo));
    }

    // 정보 수정
    @PutMapping("/info")
    public ResponseEntity<?> updateMyInfo(@RequestBody MemberDto dto) {
        boolean updated = service.updateMemberInfo(dto);
        return updated
            ? ResponseEntity.ok(Map.of("message", "정보가 수정되었습니다."))
            : ResponseEntity.badRequest().body(Map.of("message", "정보 수정에 실패했습니다."));
    }


//
//    /** 프로필 이미지 변경 (POST) - MultipartFile 처리 위해 @RequestPart 사용 */
//    @PostMapping(value = "/profile", consumes = {"multipart/form-data"})
//    public ResponseEntity<Map<String, Object>> updateProfile(
//            @RequestPart("profileImg") MultipartFile profileImg,
//            @RequestParam("memberNo") int memberNo) throws Exception {
//
//        int result = service.profile(profileImg, memberNo);
//
//        if (result > 0) {
//            return ResponseEntity.ok(Map.of("message", "프로필 이미지 변경 성공"));
//        } else {
//            return ResponseEntity.badRequest().body(Map.of("message", "프로필 이미지 변경 실패"));
//        }
//    }
//
//    /** 파일 목록 조회 (GET) */
//    @GetMapping("/fileList/{memberNo}")
//    public ResponseEntity<List<UploadFile>> getFileList(@PathVariable int memberNo) {
//        List<UploadFile> list = service.fileList(memberNo);
//        return ResponseEntity.ok(list);
//    }

}
