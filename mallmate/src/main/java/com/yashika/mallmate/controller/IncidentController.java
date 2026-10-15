package com.yashika.mallmate.controller;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.IncidentRequestDTO;
import com.yashika.mallmate.dto.IncidentResponseDTO;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.entity.Incident;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.service.FloorService;
import com.yashika.mallmate.service.IncidentService;
import com.yashika.mallmate.service.UserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {
    private final IncidentService incidentService;
    private final FloorService floorService;
    private final UserService userService;

    public IncidentController(IncidentService incidentService, FloorService floorService, UserService userService) {
        this.incidentService = incidentService;
        this.floorService = floorService;
        this.userService = userService;
    }

    private IncidentResponseDTO convertToDTO(Incident incident) {
        return new IncidentResponseDTO(
            incident.getId(), incident.getTitle(), incident.getDescription(),
            incident.getIncidentType(), incident.getSeverity(), incident.getStatus(),
            incident.getReportedAt() != null ? incident.getReportedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
            incident.getReportedBy() != null ? incident.getReportedBy().getId() : null,
            incident.getReportedBy() != null ? incident.getReportedBy().getName() : null,
            incident.getFloor() != null ? incident.getFloor().getId() : null,
            incident.getFloor() != null ? incident.getFloor().getFloorNumber() : null
        );
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private boolean canViewAll(Authentication authentication) {
        return hasRole(authentication, "ADMIN") || hasRole(authentication, "STAFF") || hasRole(authentication, "SECURITY");
    }

    private boolean reportedByCurrentUser(Incident incident, Authentication authentication) {
        User reporter = incident.getReportedBy();
        return reporter != null && reporter.getUsername() != null
                && reporter.getUsername().equals(authentication.getName());
    }

    private Incident requireVisibleIncident(Long id, Authentication authentication) {
        Incident incident = incidentService.getIncidentById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
        if (!canViewAll(authentication) && !reportedByCurrentUser(incident, authentication)) {
            // Return 404 rather than reveal that another user's incident exists.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found");
        }
        return incident;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentResponseDTO createIncident(@Valid @RequestBody IncidentRequestDTO dto, Authentication authentication) {
        Floor floor = floorService.getFloorById(dto.getFloorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found"));
        User reporter = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
        Incident incident = new Incident();
        incident.setTitle(dto.getTitle());
        incident.setDescription(dto.getDescription());
        incident.setIncidentType(dto.getIncidentType());
        incident.setSeverity(dto.getSeverity());
        incident.setStatus("REPORTED");
        incident.setFloor(floor);
        incident.setReportedBy(reporter);
        return convertToDTO(incidentService.createIncident(incident));
    }

    @GetMapping
    public List<IncidentResponseDTO> getIncidents(Authentication authentication) {
        return incidentService.getAllIncidents().stream()
            .filter(i -> canViewAll(authentication) || reportedByCurrentUser(i, authentication))
            .map(this::convertToDTO).toList();
    }

    @GetMapping("/{id}")
    public IncidentResponseDTO getIncidentById(@PathVariable Long id, Authentication authentication) {
        return convertToDTO(requireVisibleIncident(id, authentication));
    }

    @GetMapping("/status/{status}")
    public List<IncidentResponseDTO> getIncidentsByStatus(@PathVariable String status, Authentication authentication) {
        return incidentService.getIncidentsByStatus(status).stream()
            .filter(i -> canViewAll(authentication) || reportedByCurrentUser(i, authentication))
            .map(this::convertToDTO).toList();
    }

    @GetMapping("/type/{incidentType}")
    public List<IncidentResponseDTO> getIncidentsByType(@PathVariable String incidentType, Authentication authentication) {
        return incidentService.getIncidentsByType(incidentType).stream()
            .filter(i -> canViewAll(authentication) || reportedByCurrentUser(i, authentication))
            .map(this::convertToDTO).toList();
    }

    @GetMapping("/severity/{severity}")
    public List<IncidentResponseDTO> getIncidentsBySeverity(@PathVariable String severity, Authentication authentication) {
        return incidentService.getIncidentsBySeverity(severity).stream()
            .filter(i -> canViewAll(authentication) || reportedByCurrentUser(i, authentication))
            .map(this::convertToDTO).toList();
    }

    @PutMapping("/{id}")
    public IncidentResponseDTO updateIncident(@PathVariable Long id, @Valid @RequestBody IncidentRequestDTO dto) {
        Incident incident = incidentService.getIncidentById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
        Floor floor = floorService.getFloorById(dto.getFloorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found"));
        incident.setTitle(dto.getTitle());
        incident.setDescription(dto.getDescription());
        incident.setIncidentType(dto.getIncidentType());
        incident.setSeverity(dto.getSeverity());
        incident.setFloor(floor);
        return convertToDTO(incidentService.createIncident(incident));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIncident(@PathVariable Long id) {
        if (incidentService.getIncidentById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found");
        }
        incidentService.deleteIncident(id);
    }
}
