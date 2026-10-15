package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Incident;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.repository.IncidentRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;

    public IncidentService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public Incident createIncident(Incident incident) {
        return incidentRepository.save(incident);
    }

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }

    public List<Incident> getIncidentsByStatus(String status) {
        return incidentRepository.findByStatusIgnoreCase(status);
    }

    public List<Incident> getIncidentsByType(String incidentType) {
        return incidentRepository
                .findByIncidentTypeIgnoreCase(incidentType);
    }

    public List<Incident> getIncidentsBySeverity(String severity) {
        return incidentRepository.findBySeverityIgnoreCase(severity);
    }

    public List<Incident> getIncidentsReportedBy(User user) {
        return incidentRepository.findByReportedBy(user);
    }

    public void deleteIncident(Long id) {
        incidentRepository.deleteById(id);
    }
}

