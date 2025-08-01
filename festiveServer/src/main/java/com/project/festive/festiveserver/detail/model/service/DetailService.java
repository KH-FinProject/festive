package com.project.festive.festiveserver.detail.model.service;

import java.util.List;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;
import com.project.festive.festiveserver.detail.model.dto.FestivalDetailDto;
import com.project.festive.festiveserver.detail.model.dto.LikesDto;

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

	/** 좋아요 갯수 가져오기
	 * @param contentId
	 * @return
	 * @author 미애
	 */
	int selectLikes(String contentId);

	/** 좋아요 상태 변경
	 * @param likes
	 * @return
	 * @author 미애
	 */
	int changeLikes(LikesDto likes);

	/** 참여부스 리스트 받아오기
	 * @param contentId
	 * @return
	 */
	List<BoothRequestDto> selectBoothList(String contentId);

	/** 인기 축제 리스트 받아오기
	 * @param limit
	 * @return
	 */
	List<FestivalDetailDto> getPopularFestivals(int limit);
}
