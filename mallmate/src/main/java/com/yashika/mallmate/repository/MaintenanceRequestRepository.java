package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.MaintenanceRequest;
import com.yashika.mallmate.entity.Shop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRequestRepository
        extends JpaRepository<MaintenanceRequest, Long> {

    List<MaintenanceRequest> findByShop(Shop shop);

    List<MaintenanceRequest> findByStatusIgnoreCase(String status);

    List<MaintenanceRequest> findByShopAndStatusIgnoreCase(
            Shop shop, String status);
}
