package com.project.festive.festiveserver.detail.model.service;

import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;

public interface DetailService {

	/** 찜 상태 확인하기
	 * @param memberNo
	 * @param contentId
	 * @return
	 * @author 미애
	 */
	boolean selectFavorite(long memberNo, String contentId);

	/** 찜 상태 변경하기(찜하기 / 해제)
	 * @param favorites
	 * @return
	 * @author 미애
	 */
	int changeFavorite(FavoritesDto favorites);

}
