package com.project.festive.festiveserver.detail.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LikesDto {
	
	private int numId;
	private String ContentId;
	
	// 좋아요 여부 확인
	private boolean currLike;
	

}
