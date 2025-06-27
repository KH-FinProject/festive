package com.project.festive.festiveserver.auth.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.auth.entity.RefreshToken;

@Mapper
public interface AuthMapper {

  public int insertRefreshToken(RefreshToken refreshToken);
  public int updateRefreshToken(RefreshToken refreshToken);
}
