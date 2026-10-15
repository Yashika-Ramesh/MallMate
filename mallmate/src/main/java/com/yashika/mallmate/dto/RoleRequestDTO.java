
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequestDTO {

    @NotBlank(message = "Role name is required")
    @Size(max = 50, message = "Role name must not exceed 50 characters")
    @Pattern(
        regexp = "(?i)^(ADMIN|SHOP_OWNER|SECURITY|CUSTOMER)$",
        message = "Role must be ADMIN, SHOP_OWNER, SECURITY, or CUSTOMER"
    )
    private String name;
}
