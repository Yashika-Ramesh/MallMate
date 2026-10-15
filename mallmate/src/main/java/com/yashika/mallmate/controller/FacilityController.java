
package com.yashika.mallmate.controller;

import com.yashika.mallmate.dto.FacilityRequestDTO;
import com.yashika.mallmate.dto.FacilityResponseDTO;
import com.yashika.mallmate.entity.Facility;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.service.FacilityService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    private FacilityResponseDTO toResponseDTO(Facility facility) {
        FacilityResponseDTO dto = new FacilityResponseDTO();

        dto.setId(facility.getId());
        dto.setName(facility.getName());
        dto.setType(facility.getType());
        dto.setDescription(facility.getDescription());
        dto.setLocationDescription(facility.getLocationDescription());

        if (facility.getFloor() != null) {
            dto.setFloorId(facility.getFloor().getId());
            dto.setFloorNumber(facility.getFloor().getFloorNumber());
            dto.setFloorName(facility.getFloor().getName());
        }

        return dto;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FacilityResponseDTO createFacility(
            @Valid @RequestBody FacilityRequestDTO request) {

        Facility facility = new Facility();
        facility.setName(request.getName());
        facility.setType(request.getType());
        facility.setDescription(request.getDescription());
        facility.setLocationDescription(request.getLocationDescription());

        Facility savedFacility = facilityService.createFacility(
                facility, request.getFloorId());

        return toResponseDTO(savedFacility);
    }

    @GetMapping
    public List<FacilityResponseDTO> getAllFacilities() {
        return facilityService.getAllFacilities()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public FacilityResponseDTO getFacilityById(
            @PathVariable Long id) {
        return toResponseDTO(facilityService.getFacilityById(id));
    }

    @GetMapping("/search")
    public List<FacilityResponseDTO> searchFacilities(
            @RequestParam String name) {
        return facilityService.searchFacilitiesByName(name)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/type/{type}")
    public List<FacilityResponseDTO> getFacilitiesByType(
            @PathVariable String type) {
        return facilityService.getFacilitiesByType(type)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/floor/{floorId}")
    public List<FacilityResponseDTO> getFacilitiesByFloor(
            @PathVariable Long floorId) {

        Floor floor = new Floor();
        floor.setId(floorId);

        return facilityService.getFacilitiesByFloor(floor)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/floor/{floorId}/type/{type}")
    public List<FacilityResponseDTO> getFacilitiesByFloorAndType(
            @PathVariable Long floorId,
            @PathVariable String type) {

        Floor floor = new Floor();
        floor.setId(floorId);

        return facilityService
                .getFacilitiesByFloorAndType(floor, type)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @PutMapping("/{id}")
    public FacilityResponseDTO updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody FacilityRequestDTO request) {

        Facility facility = facilityService.getFacilityById(id);

        facility.setName(request.getName());
        facility.setType(request.getType());
        facility.setDescription(request.getDescription());
        facility.setLocationDescription(request.getLocationDescription());

        Facility updatedFacility = facilityService.createFacility(
                facility, request.getFloorId());

        return toResponseDTO(updatedFacility);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
    }
}
