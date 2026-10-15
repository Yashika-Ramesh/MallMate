
package com.yashika.mallmate.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class AnnouncementRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "Message is required")
    @Size(max = 3000, message = "Message cannot exceed 3000 characters")
    private String message;

    @NotBlank(message = "Target audience is required")
    @Size(max = 50, message = "Target audience cannot exceed 50 characters")
    private String targetAudience;

    @Future(message = "Expiry date must be in the future")
    private LocalDateTime expiresAt;
}
