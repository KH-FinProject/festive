package com.project.festive.festiveserver.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/*
 * @Entity 
 * - 이 클래스가 JPA 엔티티임을 나타내는 어노테이션
 * - DB의 테이블과 매핑되어서, 이 클래스 객체가 DB 레코드(행) 하나와 대응됨.
 *  	즉, JPA가 이 클래스를 보고 DB와 연동할 테이블로 인식함.
 * 
 * @Table(name = "MEMBER")
 * - 이 엔티티가 매핑될 DB 테이블 이름을 지정
 * 
 * 
 * */

// DB 테이블과 직접 연결되는 영속 엔티티

@Entity
@Table(name = "MEMBER")
@ToString
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {

	@Id // 해당 필드를 기본 키(primary key) 로 지정
	@Column(name = "MEMBER_NO")
	@SequenceGenerator(
		name = "member_seq",
		sequenceName = "SEQ_MEMBER_NO",
		allocationSize = 1
	)
	@GeneratedValue(strategy = GenerationType.SEQUENCE, 
	generator = "member_seq") // 기본 키 생성을 데이터베이스에 위임하는 전략을 설정
	private Long memberNo;

	@Column(name = "ID", nullable = true) // OAuth2 사용자의 경우 ID가 없을 수 있음
	private String id;

	@Column(name = "NICKNAME", nullable = false)
	private String nickname;

	@Column(name = "NAME", nullable = true)
	private String name;

	@Column(name = "EMAIL", unique = true, nullable = false) // DB 컬럼 속성 지정. 중복 불가, null 불가
	private String email;

	@Column(name = "PASSWORD", nullable = true) // OAuth2 사용자의 경우 비밀번호가 없을 수 있음
	private String password; // 암호화된 비밀번호 저장

	@Column(name = "TEL", nullable = true)
	private String tel;

	@Column(name = "ADDRESS", nullable = true)
	private String address;

	@Column(name = "PROFILE_IMAGE", nullable = true)
	private String profileImage;

	@Column(name = "SOCIAL_ID", nullable = true) 
	private String socialId;

	@Column(name = "ROLE", nullable = false)
	private String role;

	@Column(name = "MEMBER_DEL_FL", nullable = false)
	@Builder.Default
	private String memberDelFl = "N";

}
