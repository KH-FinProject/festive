package com.project.festive.festiveserver.detail.model.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;
import com.project.festive.festiveserver.detail.model.dto.LikesDto;

import java.util.List;
import java.util.Map;

@Mapper
public interface DetailMapper {
	
	/** 현재 찜 상태 확인
	 * @param memberNo
	 * @param contentId
	 * @return
	 * @author 미애
	 */
	int selectFavorite(@Param("memberNo") long memberNo, @Param("contentId") String contentId);

	/** 찜 목록에 추가
	 * @param favorites
	 * @return
	 * @author 미애
	 */
	int insertFavorite(FavoritesDto favorites);

	/** 찜 목록에서 삭제
	 * @param favorites
	 * @return
	 * @author 미애
	 */
	int deleteFavorite(FavoritesDto favorites);

	/** 좋아요 갯수 가져오기
	 * @param contentId
	 * @return
	 * @author 미애
	 */
	int selectLikes(String contentId);

	/** 좋아요 제거
	 * @param likes
	 * @return
	 * @author 미애
	 */
	int deleteLike(LikesDto likes);

	/** 좋아요 추가
	 * @param likes
	 * @return
	 * @author 미애
	 */
	int insertLike(LikesDto likes);
  
  /** 좋아요 많은 순 인기 축제 CONTENT_ID + likeCount 반환 */
  List<Map<String, Object>> selectPopularFestivals(int limit);
  
	/** 참여부스 리스트 받아오기
	 * @param contentId
	 * @return
	 * @author 미애
	 */
	List<BoothRequestDto> selectBoothList(String contentId);

}
