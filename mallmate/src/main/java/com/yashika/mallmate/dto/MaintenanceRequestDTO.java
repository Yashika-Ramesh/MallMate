
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequestDTO {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String createdAt;
    private Long shopId;
    private String shopName;
    private Long requestedById;
}
