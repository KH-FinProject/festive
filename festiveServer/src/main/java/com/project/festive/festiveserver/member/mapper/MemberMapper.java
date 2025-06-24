package com.project.festive.festiveserver.member.mapper;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MemberMapper {

    // 제재 카운트 1 증가
    int increaseSanctionCount(long memberNo);

}
