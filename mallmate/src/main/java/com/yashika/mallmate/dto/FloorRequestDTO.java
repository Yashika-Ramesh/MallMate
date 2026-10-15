
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FloorRequestDTO {

    @NotNull(message = "Floor number is required")
    @PositiveOrZero(message = "Floor number cannot be negative")
    private Integer floorNumber;

    @NotBlank(message = "Floor name is required")
    @Size(max = 100, message = "Floor name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
