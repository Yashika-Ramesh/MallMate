
package com.yashika.mallmate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.FloorRequestDTO;
import com.yashika.mallmate.dto.FloorResponseDTO;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.service.FloorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/floors")
public class FloorController {

    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    private FloorResponseDTO convertToDTO(Floor floor) {
        return new FloorResponseDTO(
            floor.getId(),
            floor.getFloorNumber(),
            floor.getName(),
            floor.getDescription()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FloorResponseDTO createFloor(
            @Valid @RequestBody FloorRequestDTO request) {

        Floor floor = new Floor();
        floor.setFloorNumber(request.getFloorNumber());
        floor.setName(request.getName());
        floor.setDescription(request.getDescription());

        return convertToDTO(floorService.createFloor(floor));
    }

    @GetMapping
    public List<FloorResponseDTO> getAllFloors() {
        return floorService.getAllFloors()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public FloorResponseDTO getFloorById(@PathVariable Long id) {
        Floor floor = floorService.getFloorById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Floor not found"
                ));

        return convertToDTO(floor);
    }

    @GetMapping("/number/{floorNumber}")
    public FloorResponseDTO getFloorByNumber(
            @PathVariable Integer floorNumber) {

        Floor floor = floorService.getFloorByNumber(floorNumber)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Floor not found"
                ));

        return convertToDTO(floor);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFloor(@PathVariable Long id) {
        if (floorService.getFloorById(id).isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Floor not found"
            );
        }

        floorService.deleteFloor(id);
    }

    @PutMapping("/{id}")
    public FloorResponseDTO updateFloor(
            @PathVariable Long id,
            @Valid @RequestBody FloorRequestDTO request) {

        Floor updatedFloor = new Floor();
        updatedFloor.setFloorNumber(request.getFloorNumber());
        updatedFloor.setName(request.getName());
        updatedFloor.setDescription(request.getDescription());

        return convertToDTO(
                floorService.updateFloor(id, updatedFloor));
    }

}
