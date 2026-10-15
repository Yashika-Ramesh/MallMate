
package com.yashika.mallmate.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
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
public class TenantRequestDTO {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name must not exceed 150 characters")
    private String businessName;

    @NotBlank(message = "Contact person is required")
    @Size(max = 100, message = "Contact person must not exceed 100 characters")
    private String contactPerson;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 254, message = "Email must not exceed 254 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    @NotBlank(message = "Lease start date is required")
    @Pattern(
        regexp = "\\d{4}-\\d{2}-\\d{2}",
        message = "Lease start date must use YYYY-MM-DD format"
    )
    private String leaseStartDate;

    @NotBlank(message = "Lease end date is required")
    @Pattern(
        regexp = "\\d{4}-\\d{2}-\\d{2}",
        message = "Lease end date must use YYYY-MM-DD format"
    )
    private String leaseEndDate;

    @NotNull(message = "Monthly rent is required")
    @PositiveOrZero(message = "Monthly rent cannot be negative")
    private Double monthlyRent;

    @NotNull(message = "Shop ID is required")
    @Positive(message = "Shop ID must be positive")
    private Long shopId;
}
