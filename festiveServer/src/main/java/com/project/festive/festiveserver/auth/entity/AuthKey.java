package com.project.festive.festiveserver.auth.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "AUTH_KEY")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthKey {
  
    @Id
    @Column(name = "KEY_NO" , nullable = false)
    @SequenceGenerator(
            name = "key_seq",
            sequenceName = "SEQ_KEY_NO",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "key_seq") // 기본 키 생성을 데이터베이스에 위임하는 전략을 설정
    private Long keyNo;
    
    @Column(name = "EMAIL", unique = true)  // 이메일 중복 방지
    private String email;
    
    @Column(name = "AUTH_KEY", nullable = false)
    private String authKey;
    
    @Column(name = "CREATE_TIME", nullable = false)
    private LocalDateTime createTime;
}
