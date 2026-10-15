
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.MaintenanceRequest;
import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.repository.MaintenanceRequestRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceRequestService {

    private final MaintenanceRequestRepository maintenanceRequestRepository;

    public MaintenanceRequestService(
            MaintenanceRequestRepository maintenanceRequestRepository) {
        this.maintenanceRequestRepository = maintenanceRequestRepository;
    }

    public MaintenanceRequest createRequest(MaintenanceRequest request) {
        return maintenanceRequestRepository.save(request);
    }

    public List<MaintenanceRequest> getAllRequests() {
        return maintenanceRequestRepository.findAll();
    }

    public Optional<MaintenanceRequest> getRequestById(Long id) {
        return maintenanceRequestRepository.findById(id);
    }

    public List<MaintenanceRequest> getRequestsByShop(Shop shop) {
        return maintenanceRequestRepository.findByShop(shop);
    }

    public List<MaintenanceRequest> getRequestsByStatus(String status) {
        return maintenanceRequestRepository.findByStatusIgnoreCase(status);
    }

    public List<MaintenanceRequest> getShopRequestsByStatus(
            Shop shop, String status) {
        return maintenanceRequestRepository
                .findByShopAndStatusIgnoreCase(shop, status);
    }

    public void deleteRequest(Long id) {
        maintenanceRequestRepository.deleteById(id);
    }
}

