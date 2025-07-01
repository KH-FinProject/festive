package com.project.festive.festiveserver.detail.model.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;

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

}
