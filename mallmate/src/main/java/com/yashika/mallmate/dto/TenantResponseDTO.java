
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponseDTO {

    private Long id;

    private String businessName;

    private String contactPerson;

    private String email;

    private String phone;

    private String leaseStartDate;

    private String leaseEndDate;

    private Double monthlyRent;

    private Long shopId;

    private String shopName;

   
}
