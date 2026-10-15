package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class ShopOwnerUpdateDTO {

    @NotBlank(message = "Shop name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 1000)
    private String description;

    private String openingTime;

    private String closingTime;

    @Size(max = 500)
    private String imageUrl;
}
