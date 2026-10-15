
package com.yashika.mallmate.controller;

import com.yashika.mallmate.dto.AnnouncementRequestDTO;
import com.yashika.mallmate.dto.AnnouncementResponseDTO;
import com.yashika.mallmate.entity.Announcement;
import com.yashika.mallmate.service.AnnouncementService;

import org.springframework.security.core.Authentication;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserService userService;

    public AnnouncementController(
            AnnouncementService announcementService,
            UserService userService) {
        this.announcementService = announcementService;
        this.userService = userService;
    }

    private AnnouncementResponseDTO toResponseDTO(
            Announcement announcement) {

        AnnouncementResponseDTO dto = new AnnouncementResponseDTO();

        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setMessage(announcement.getMessage());
        dto.setTargetAudience(announcement.getTargetAudience());

        dto.setCreatedAt(
                announcement.getCreatedAt() == null
                        ? null
                        : announcement.getCreatedAt().toString());

        dto.setExpiresAt(
                announcement.getExpiresAt() == null
                        ? null
                        : announcement.getExpiresAt().toString());

        dto.setActive(announcement.isActive());

        if (announcement.getCreatedBy() != null) {
            dto.setCreatedById(announcement.getCreatedBy().getId());
            dto.setCreatedByName(announcement.getCreatedBy().getName());
        }

        return dto;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementResponseDTO createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO request,
            Authentication authentication) {

        User creator = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Authenticated user not found"
                ));

        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle());
        announcement.setMessage(request.getMessage());
        announcement.setTargetAudience(request.getTargetAudience());
        announcement.setExpiresAt(request.getExpiresAt());
        announcement.setActive(true);
        announcement.setCreatedBy(creator);

        Announcement saved =
                announcementService.createAnnouncement(announcement);

        return toResponseDTO(saved);
    }

    @GetMapping
    public List<AnnouncementResponseDTO> getActiveAnnouncements() {
        return announcementService.getAllActiveAnnouncements()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public AnnouncementResponseDTO getAnnouncementById(
            @PathVariable Long id) {

        Announcement announcement = announcementService
                .getAnnouncementById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Announcement not found with ID: " + id));

        return toResponseDTO(announcement);
    }

    @GetMapping("/audience/{targetAudience}")
    public List<AnnouncementResponseDTO> getAnnouncementsByAudience(
            @PathVariable String targetAudience) {

        return announcementService
                .getAnnouncementsByAudience(targetAudience)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @PutMapping("/{id}")
    public AnnouncementResponseDTO updateAnnouncement(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequestDTO request) {

        Announcement announcement = announcementService
                .getAnnouncementById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Announcement not found with ID: " + id));

        announcement.setTitle(request.getTitle());
        announcement.setMessage(request.getMessage());
        announcement.setTargetAudience(request.getTargetAudience());
        announcement.setExpiresAt(request.getExpiresAt());

        Announcement updatedAnnouncement =
                announcementService.createAnnouncement(announcement);

        return toResponseDTO(updatedAnnouncement);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
    }
}
