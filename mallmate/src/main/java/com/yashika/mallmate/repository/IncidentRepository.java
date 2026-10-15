package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.Incident;
import com.yashika.mallmate.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByStatusIgnoreCase(String status);

    List<Incident> findByIncidentTypeIgnoreCase(String incidentType);

    List<Incident> findBySeverityIgnoreCase(String severity);

    List<Incident> findByReportedBy(User reportedBy);
}
