package com.project.festive.festiveserver.detail.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;
import com.project.festive.festiveserver.common.handler.GlobalExceptionHandler;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;
import com.project.festive.festiveserver.detail.model.dto.LikesDto;
import com.project.festive.festiveserver.detail.model.dto.FestivalDetailDto;
import com.project.festive.festiveserver.detail.model.service.DetailService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/festival/detail")
@CrossOrigin(origins = "http://localhost:5173")
public class DetailController {

	private final GlobalExceptionHandler globalExceptionHandler;

	@Autowired
	private DetailService service;

	@Autowired
	private JwtUtil jwtUtil;

	DetailController(GlobalExceptionHandler globalExceptionHandler) {
		this.globalExceptionHandler = globalExceptionHandler;
	}

	// 쿠키에서 accessToken 추출하는 헬퍼 메서드
	private String getAccessTokenFromCookie(HttpServletRequest request) {
		Cookie cookie = WebUtils.getCookie(request, "accessToken");
		return cookie != null ? cookie.getValue() : null;
	}

	/**
	 * 현재 찜한 상태인지 확인하기
	 * 
	 * @param contentId
	 * @param request
	 * @return
	 * @author 미애
	 */
	@GetMapping("favorites")
	public ResponseEntity<Object> selectFavorite(@RequestParam("contentId") String contentId,
			HttpServletRequest request) {
		try {

			// 토큰 확인 후 memberNo 가져오기
			String accessToken = getAccessTokenFromCookie(request);

			if (accessToken == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
			}

			Long memberNo = jwtUtil.getMemberNo(accessToken);

			boolean result = service.selectFavorite(memberNo, contentId);
			return ResponseEntity.status(HttpStatus.OK).body(result);

		} catch (JwtException e) { // JWT 관련 예외만 잡기
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 토큰입니다.");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}

	}

	/**
	 * 찜 상태 변경하기(찜하기 / 해제)
	 * 
	 * @param favorites
	 * @param request
	 * @return
	 * @author 미애
	 */
	@PostMapping("favorites")
	public ResponseEntity<String> changeFavorite(@RequestBody FavoritesDto favorites, HttpServletRequest request) {

		try {

			// 토큰 확인 후 memberNo 가져오기
			String accessToken = getAccessTokenFromCookie(request);
			if (accessToken == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
			}

			Long memberNo = jwtUtil.getMemberNo(accessToken);

			favorites.setMemberNo(memberNo);

			int result = service.changeFavorite(favorites);

			if (result > 0) {
				return ResponseEntity.status(HttpStatus.OK).body("찜목록에 추가");
			} else if (result < 0) {
				return ResponseEntity.status(HttpStatus.OK).body("찜목록에서 삭제");
			} else {
				// BAD_REQUEST : 400 -> 요청 구문이 잘못되었거나 유효하지 않음.
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("찜하기 반영 실패");
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}

	}

	/**
	 * 좋아요 수 가져오기
	 * 
	 * @param contentId
	 * @param request
	 * @return
	 */
	@GetMapping("likes")
	public ResponseEntity<Object> selectLikes(@RequestParam("contentId") String contentId, HttpServletRequest request) {
		try {

			int result = service.selectLikes(contentId);
			System.out.println("상태보기 : " + result);
			return ResponseEntity.status(HttpStatus.OK).body(result);

		} catch (Exception e) {
			e.getStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}

	}

	/** 좋아요 상태 변경
	 * @param likes
	 * @return
	 * @author 미애
	 */
	@PostMapping("likes")
	public ResponseEntity<String> changeLikes(@RequestBody LikesDto likes) {

		try {
			int result = service.changeLikes(likes);

			if (result > 0) {
				return ResponseEntity.status(HttpStatus.OK).body("좋아요 추가");
			} else if (result < 0) {
				return ResponseEntity.status(HttpStatus.OK).body("좋아요 삭제");
			} else {
				// BAD_REQUEST : 400 -> 요청 구문이 잘못되었거나 유효하지 않음.
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("좋아요 반영 실패");
			}
		} catch (Exception e) {
			 e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}

	}

    /**
     * 좋아요 많은 순 인기 축제 리스트 반환
     */
    @GetMapping("popular")
    public ResponseEntity<List<FestivalDetailDto>> getPopularFestivals(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(service.getPopularFestivals(limit));
    }
}
