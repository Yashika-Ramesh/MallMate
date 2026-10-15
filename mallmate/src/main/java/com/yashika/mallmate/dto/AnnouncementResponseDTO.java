
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponseDTO {

    private Long id;

    private String title;

    private String message;

    private String targetAudience;

    private String createdAt;

    private String expiresAt;

    private boolean active;

    private Long createdById;

    private String createdByName;
}

