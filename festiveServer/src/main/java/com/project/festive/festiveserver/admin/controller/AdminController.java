package com.project.festive.festiveserver.admin.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import com.project.festive.festiveserver.admin.dto.AdminStatisticsDto;
import com.project.festive.festiveserver.admin.model.service.AdminService;
import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController // 비동기 컨트롤러
@CrossOrigin(origins="http://localhost:5173", allowCredentials = "true")
@RequestMapping("admin")
@Slf4j
@RequiredArgsConstructor
@SessionAttributes({"loginMember"})
public class AdminController {
	
	private final AdminService service;
	
	
	/** 관리자 계정 발급 메서드
	 * @param member
	 * @return
	 */
	@PostMapping("create")
	public ResponseEntity<String> createAdminAccount(@RequestBody MemberDto member) {
		try {
			// 1. 기존에 있는 이메일인지 검사
			int checkEmail = service.checkEmail(member.getEmail());
			// 2. 있으면 발급 안함
			if(checkEmail > 0) {
				
				// HttpStatus.CONFLICT (409) : 요청이 서버의 현재 상태와 충돌할 때 사용
				// == 이미 존재하는 리소스(email) 때문에 새로운 리소스를 만들 수 없다.
				return ResponseEntity.status(HttpStatus.CONFLICT)
						.body("이미 사용 중인 이메일입니다.");
			}
			
			// 3. 없으면 새로 발급
			String accountPw = service.createAdminAccount(member);
			// HttpStatus.OK (200) : 요청이 정상적으로 처리되었으나 기존 리소스에 대한 단순 처리
			// HttpStatus.CREATED (201) : 자원이 성공적으로 생성되었음을 나타냄
			return ResponseEntity.status(HttpStatus.CREATED).body(accountPw);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR) // 500
					.body("관리자 계정 생성 중 문제 발생(서버 문의 바람)");
		}
		
	}
	
	/** 탈퇴 회원 조회
	 * @return
	 * @author 미애
	 */
	@GetMapping("withdraw")
	public ResponseEntity<Object> selectWithdrawMembers() {
		try {
			List<MemberDto> withdrawMemberList = new ArrayList<>();
			withdrawMemberList = service.selectWithdrawMembers();
			return ResponseEntity.status(HttpStatus.OK).body(withdrawMemberList);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
		
	}
	
	
	/** 탈퇴 회원 영구삭제
	 * @param memberNoList
	 * @return
	 * @author 미애
	 */
	@PostMapping("withdrawDelete")
	public ResponseEntity<Object> deleteWithdrawMember(@RequestBody List<Integer> memberNoList) {
		try {
			int result = service.deleteWithdrawMember(memberNoList);
			return ResponseEntity.status(HttpStatus.OK).body(result);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
		
	}
	
	/** 탈퇴 회원 복구
	 * @param memberNoList
	 * @return
	 * @author 미애
	 */
	@PostMapping("withdrawRestore")
	public ResponseEntity<Object> updateWithdrawMember(@RequestBody List<Integer> memberNoList) {
		try {
			int result = service.updateWithdrawMember(memberNoList);
			return ResponseEntity.status(HttpStatus.OK).body(result);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
		
	}

	/** 관리자 통계 조회
	 * @return AdminStatisticsDto
	 */
	@GetMapping("statistics")
	public ResponseEntity<Object> getAdminStatistics() {
		try {
			log.info("통계 조회 요청 시작");
			AdminStatisticsDto statistics = service.getAdminStatistics();
			log.info("통계 조회 성공: {}", statistics);
			return ResponseEntity.status(HttpStatus.OK).body(statistics);
			
		} catch (Exception e) {
			log.error("통계 조회 중 오류 발생", e);
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
	}


	/**
     * 공지글 작성
     */
    @PostMapping("/write")
    public ResponseEntity<String> createBoard(Authentication authentication, @RequestBody BoardDto boardDto) {
        try {
            // 안전한 인증 정보 추출
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).body("인증 정보가 없습니다.");
            }
            
            Object principal = authentication.getPrincipal();
            if (!(principal instanceof CustomUserDetails)) {
                log.error("인증 정보 타입 오류: {}", principal.getClass().getName());
                return ResponseEntity.status(401).body("유효하지 않은 인증 정보입니다.");
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            Long memberNo = userDetails.getMemberNo();
            
            boardDto.setMemberNo(memberNo);
            // boardTypeNo가 없으면 기본값 1(일반 게시판)로 설정
            if (boardDto.getBoardTypeNo() == null) {
                boardDto.setBoardTypeNo(1L);
            }
            int result = service.createBoard(boardDto);
            if (result > 0) {
                return ResponseEntity.ok("게시글이 작성되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("게시글 작성에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("게시글 작성 실패", e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    // 글 목록 조회
    @GetMapping("/board")
    public List<BoardDto> getAllBoards() {
    	
    	log.debug("키키" + service.getAllBoards().toString());
        return service.getAllBoards();
    }
    
    // 선택한 글 삭제
	@PostMapping("/boardDelete")
	public ResponseEntity<Object> deleteBoard(@RequestBody List<Integer> boardNoList) {
		try {
			int result = service.deleteBoard(boardNoList);
			return ResponseEntity.status(HttpStatus.OK).body(result);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
		
	}
    
    // 현재 인증된 관리자 정보 반환
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 필요");
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof CustomUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 인증 정보");
        }
        CustomUserDetails userDetails = (CustomUserDetails) principal;
        return ResponseEntity.ok(
            java.util.Map.of("role", userDetails.getRole())
        );
    }
    
}
