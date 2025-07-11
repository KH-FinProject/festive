package com.project.festive.festiveserver.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthKeyRequest {
  private String email;
  private String tel;
  private String authKey;
  private String authMethod;
}
