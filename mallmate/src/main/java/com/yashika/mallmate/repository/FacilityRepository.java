package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.Facility;
import com.yashika.mallmate.entity.Floor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByFloor(Floor floor);

    List<Facility> findByTypeIgnoreCase(String type);

    List<Facility> findByNameContainingIgnoreCase(String name);

    List<Facility> findByFloorAndTypeIgnoreCase(Floor floor, String type);
}

