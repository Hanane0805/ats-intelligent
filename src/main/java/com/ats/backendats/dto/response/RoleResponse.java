package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoleResponse {
    private Long id;
    private String nomRole;
    private String description;
}
