
package com.yashika.mallmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FloorResponseDTO {

    private Long id;

    private Integer floorNumber;

    private String name;

    private String description;
}
