package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository
        extends JpaRepository<Announcement, Long> {

    List<Announcement> findByActiveTrue();

    List<Announcement> findByTargetAudienceIgnoreCase(String targetAudience);

    List<Announcement> findByActiveTrueAndTargetAudienceIgnoreCase(
            String targetAudience);
}
