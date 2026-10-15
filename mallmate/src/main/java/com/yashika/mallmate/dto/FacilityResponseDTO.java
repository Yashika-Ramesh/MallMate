
package com.yashika.mallmate.dto;

import lombok.Data;

@Data
public class FacilityResponseDTO {

    private Long id;
    private String name;
    private String type;
    private String description;
    private String locationDescription;
    private Long floorId;
    private Integer floorNumber;
    private String floorName;
}
