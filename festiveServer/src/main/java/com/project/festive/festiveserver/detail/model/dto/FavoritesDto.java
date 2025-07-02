package com.project.festive.festiveserver.detail.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoritesDto {
	
	private String contentId;
	private long memberNo;
	
	// 현재 찜 상태 확인을 위한 변수
	private boolean currFavorite;

}
