
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.repository.FloorRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

@Service
public class FloorService {

    private final FloorRepository floorRepository;

    public FloorService(FloorRepository floorRepository) {
        this.floorRepository = floorRepository;
    }

    public Floor createFloor(Floor floor) {
        if (floorRepository.existsByFloorNumber(
                floor.getFloorNumber())) {
            throw new IllegalArgumentException(
                    "A floor with this floor number already exists");
        }

        return floorRepository.save(floor);
    }

    @Transactional
    public Floor updateFloor(Long id, Floor updatedFloor) {
        Floor existingFloor = floorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Floor not found"));

        Optional<Floor> duplicate =
                floorRepository.findByFloorNumber(
                        updatedFloor.getFloorNumber());

        if (duplicate.isPresent()
                && !duplicate.get().getId().equals(id)) {
            throw new IllegalArgumentException(
                    "A floor with this floor number already exists");
        }

        existingFloor.setFloorNumber(updatedFloor.getFloorNumber());
        existingFloor.setName(updatedFloor.getName());
        existingFloor.setDescription(updatedFloor.getDescription());

        return floorRepository.save(existingFloor);
    }

    public List<Floor> getAllFloors() {
        return floorRepository.findAll();
    }

    public Optional<Floor> getFloorById(Long id) {
        return floorRepository.findById(id);
    }

    public Optional<Floor> getFloorByNumber(Integer floorNumber) {
        return floorRepository.findByFloorNumber(floorNumber);
    }

    public void deleteFloor(Long id) {
        floorRepository.deleteById(id);
    }
}
