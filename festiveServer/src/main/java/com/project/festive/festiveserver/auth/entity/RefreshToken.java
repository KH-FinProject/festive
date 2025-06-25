package com.project.festive.festiveserver.auth.entity;

import java.time.LocalDateTime;

import com.project.festive.festiveserver.member.entity.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "REFRESH_TOKEN", indexes = {
    @Index(name = "idx_refresh_token_expiration", columnList = "EXPIRATION_DATE")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

	@Id
	@Column(name = "MEMBER_NO")
	private Long memberNo;

	@Column(name = "REFRESH_TOKEN", nullable = false, length = 500)
	private String token;

	@Column(name = "EXPIRATION_DATE", nullable = false)
	private LocalDateTime expirationDate;

	// RefreshToken 엔티티와 Member 엔티티 간의 1:1 단방향 연관관계를 설정합니다.
	// @OneToOne(fetch = FetchType.LAZY):
	//   - RefreshToken과 Member는 1:1 관계입니다.
	//   - fetch = FetchType.LAZY 옵션을 통해 실제로 member 객체가 필요할 때(접근할 때)만 DB에서 데이터를 조회합니다.
	//   - 즉, RefreshToken 엔티티를 조회할 때는 member 정보가 즉시 로딩되지 않고, member 필드에 접근하는 시점에 쿼리가 실행됩니다.
	@OneToOne(fetch = FetchType.LAZY)
	// @MapsId:
	//   - RefreshToken의 기본키(memberNo)를 외래키로도 사용합니다.
	//   - 즉, RefreshToken의 PK이자 FK인 memberNo를 통해 Member 엔티티와 연결합니다.
	//   - 이로 인해 RefreshToken의 PK 값과 Member의 PK 값이 항상 동일하게 유지됩니다.
	@MapsId
	// @JoinColumn(name = "memberNo"):
	//   - RefreshToken 테이블의 memberNo 컬럼이 Member 테이블의 PK와 매핑되는 외래키임을 명시합니다.
	//   - 실제 DB 테이블에서 memberNo 컬럼이 외래키로 동작합니다.
	@JoinColumn(name = "MEMBER_NO")
	// 단방향 참조:
	//   - RefreshToken 엔티티에서만 Member 엔티티를 참조할 수 있습니다.
	//   - Member 엔티티에서는 RefreshToken을 알지 못합니다.
	// 읽기 전용 관계:
	//   - 이 관계는 읽기 전용으로 설계되어 있어, token.setMember(newMember)와 같이 member를 변경하는 코드는 허용되지 않습니다.
	private Member member;

	public void update(String token, LocalDateTime expirationDate) {
		this.token = token;
		this.expirationDate = expirationDate;
	}
}
