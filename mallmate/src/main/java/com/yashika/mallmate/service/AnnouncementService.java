
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Announcement;
import com.yashika.mallmate.repository.AnnouncementRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(
            AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    public Announcement createAnnouncement(Announcement announcement) {
        return announcementRepository.save(announcement);
    }

    public List<Announcement> getAllActiveAnnouncements() {
        return announcementRepository.findByActiveTrue()
                .stream()
                .filter(announcement ->
                        announcement.getExpiresAt() == null
                        || announcement.getExpiresAt().isAfter(LocalDateTime.now()))
                .toList();
    }

    public Optional<Announcement> getAnnouncementById(Long id) {
        return announcementRepository.findById(id);
    }

    public List<Announcement> getAnnouncementsByAudience(String audience) {
        return announcementRepository
                .findByActiveTrueAndTargetAudienceIgnoreCase(audience)
                .stream()
                .filter(announcement ->
                        announcement.getExpiresAt() == null
                        || announcement.getExpiresAt().isAfter(LocalDateTime.now()))
                .toList();
    }

    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }
}
