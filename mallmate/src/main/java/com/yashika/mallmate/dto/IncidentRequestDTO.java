
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotBlank(message = "Incident type is required")
    @Size(max = 100, message = "Incident type must not exceed 100 characters")
    private String incidentType;

    @NotBlank(message = "Severity is required")
    @Pattern(
        regexp = "LOW|MEDIUM|HIGH|CRITICAL",
        flags = Pattern.Flag.CASE_INSENSITIVE,
        message = "Severity must be LOW, MEDIUM, HIGH, or CRITICAL"
    )
    private String severity;

    @NotNull(message = "Floor ID is required")
    @Positive(message = "Floor ID must be positive")
    private Long floorId;
}
