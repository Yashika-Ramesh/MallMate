
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;

import lombok.Data;

@Data
public class FacilityRequestDTO {

    @NotBlank(message = "Facility name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Facility type is required")
    @Size(max = 50, message = "Type cannot exceed 50 characters")
    private String type;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String locationDescription;

    @NotNull(message = "Floor ID is required")
    @Positive(message = "Floor ID must be positive")
    private Long floorId;
}

