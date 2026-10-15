
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShopRequestDTO {

    @NotBlank(message = "Shop name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Shop number is required")
    @Size(max = 30)
    private String shopNumber;

    @Size(max = 1000)
    private String description;

    // Record status only — NOT the daily operating status
    @NotBlank(message = "Shop record status is required")
    @Pattern(
        regexp = "ACTIVE|INACTIVE",
        flags = Pattern.Flag.CASE_INSENSITIVE,
        message = "Status must be ACTIVE or INACTIVE"
    )
    private String status;

    private String openingTime;

    private String closingTime;

    @Size(max = 500)
    private String imageUrl;

    @NotNull(message = "Floor ID is required")
    private Long floorId;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    // Optional existing SHOP_OWNER username for admin shop creation
    private String ownerUsername;
}
