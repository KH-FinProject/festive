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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import com.project.festive.festiveserver.common.util.JwtUtil;
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
	private final JwtUtil jwtUtil;

	// 회원탈퇴
	@PostMapping("/withdrawal")
	public ResponseEntity<String> withdraw(@RequestHeader("Authorization") String authHeader,
	                                       @RequestBody Map<String, String> request) {
	    try {
	        String token = authHeader.replace("Bearer ", "");
	        Long memberNo = jwtUtil.getMemberNo(token);

	        String password = request.get("password");

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
	@PostMapping("/pw")
	public ResponseEntity<?> updatePassword(@RequestHeader("Authorization") String authHeader,
	                                        @RequestBody Map<String, String> request) {
	    try {
	        String token = authHeader.replace("Bearer ", "");
	        Long memberNo = jwtUtil.getMemberNo(token);

	        String currentPw = request.get("currentPw");
	        String newPw = request.get("newPw");

	        boolean result = service.changePw(memberNo, currentPw, newPw);

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
	public ResponseEntity<List<BoardDto>> getMyPosts(@RequestHeader("Authorization") String authHeader) {
	    try {
	        String token = authHeader.replace("Bearer ", "");
	        Long memberNo = jwtUtil.getMemberNo(token);

	        List<BoardDto> postList = service.getMyPosts(memberNo);
	        return ResponseEntity.ok(postList);
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}
	
	// 내가 쓴 작성한 댓글 목록 조회
	@GetMapping("/comment")
	public ResponseEntity<List<CommentDto>> getMyComments(@RequestHeader("Authorization") String authHeader) {
		try {
			String token = authHeader.replace("Bearer ", "");
			Long memberNo = jwtUtil.getMemberNo(token);
			
			List<CommentDto> postList = service.getMyComments(memberNo);
			return ResponseEntity.ok(postList);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// 현재 회원 정보 조회
    @GetMapping("/info")
    public ResponseEntity<MemberDto> getMyInfo(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Long memberNo = jwtUtil.getMemberNo(token);
        return ResponseEntity.ok(service.getMyInfo(memberNo));
    }

    // 개인정보 수정
    @PostMapping("/info")
    public ResponseEntity<?> updateInfo(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody MemberDto updatedInfo) {
        String token = authHeader.replace("Bearer ", "");
        Long memberNo = jwtUtil.getMemberNo(token);

        boolean result = service.updateMyInfo(memberNo, updatedInfo);

        if (result) {
            return ResponseEntity.ok(Map.of("message", "정보 수정 성공"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "비밀번호가 일치하지 않습니다."));
        }
    }



}
