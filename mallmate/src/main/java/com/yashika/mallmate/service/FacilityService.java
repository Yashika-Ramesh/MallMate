
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Facility;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.repository.FacilityRepository;
import com.yashika.mallmate.repository.FloorRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;

    public FacilityService(
            FacilityRepository facilityRepository,
            FloorRepository floorRepository) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
    }

    @Transactional
    public Facility createFacility(Facility facility, Long floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Floor not found with ID: " + floorId));

        facility.setFloor(floor);
        return facilityRepository.save(facility);
    }

    @Transactional(readOnly = true)
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Facility getFacilityById(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Facility not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Facility> searchFacilitiesByName(String name) {
        return facilityRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional(readOnly = true)
    public List<Facility> getFacilitiesByType(String type) {
        return facilityRepository.findByTypeIgnoreCase(type);
    }

    @Transactional(readOnly = true)
    public List<Facility> getFacilitiesByFloor(Floor floor) {
        return facilityRepository.findByFloor(floor);
    }

    @Transactional(readOnly = true)
    public List<Facility> getFacilitiesByFloorAndType(
            Floor floor, String type) {
        return facilityRepository.findByFloorAndTypeIgnoreCase(floor, type);
    }

    @Transactional
    public void deleteFacility(Long id) {
        if (!facilityRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Facility not found with ID: " + id);
        }

        facilityRepository.deleteById(id);
    }
}
