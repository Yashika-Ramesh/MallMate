
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponseDTO {

    private Long id;

    private String title;

    private String description;

    private String incidentType;

    private String severity;

    private String status;

    private String reportedAt;

    private Long reportedById;

    private String reportedByName;

    private Long floorId;

    private Integer floorNumber;
}
