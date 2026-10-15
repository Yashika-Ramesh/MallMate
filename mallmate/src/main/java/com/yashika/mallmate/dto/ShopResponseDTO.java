
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShopResponseDTO {

    private Long id;

    private String name;

    private String shopNumber;

    private String description;

    // Existing record status: ACTIVE or INACTIVE
    private String status;

    // New maintenance flag controlled by admin
    private boolean underMaintenance;

    // Calculated from maintenance flag and operating hours
    private String operatingStatus;

    private String openingTime;

    private String closingTime;

    private String imageUrl;

    private Integer floorNumber;

    private String floorName;

    private String categoryName;

    // Display name of the assigned shop owner in Admin shop listings
    private String ownerName;
}
