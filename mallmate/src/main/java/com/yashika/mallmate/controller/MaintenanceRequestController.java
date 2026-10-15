
package com.yashika.mallmate.controller;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.MaintenanceRequestDTO;
import com.yashika.mallmate.dto.MaintenanceRequestRequestDTO;
import com.yashika.mallmate.entity.MaintenanceRequest;
import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.service.MaintenanceRequestService;
import com.yashika.mallmate.service.ShopService;

import org.springframework.security.core.Authentication;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.service.UserService;


import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceRequestController {

    private final MaintenanceRequestService maintenanceService;
    private final ShopService shopService;
    private final UserService userService;

    public MaintenanceRequestController(
            MaintenanceRequestService maintenanceService,
            ShopService shopService,
            UserService userService) {
        this.maintenanceService = maintenanceService;
        this.shopService = shopService;
        this.userService = userService;
    }

    private MaintenanceRequestDTO convertToDTO(
            MaintenanceRequest request) {

        return new MaintenanceRequestDTO(
            request.getId(),
            request.getTitle(),
            request.getDescription(),
            request.getCategory(),
            request.getPriority(),
            request.getStatus(),
            request.getCreatedAt() != null
                ? request.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null,
            request.getShop() != null ? request.getShop().getId() : null,
            request.getShop() != null ? request.getShop().getName() : null,
            request.getRequestedBy() != null ? request.getRequestedBy().getId() : null
        );
    }

   @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaintenanceRequestDTO createRequest(
            @Valid @RequestBody MaintenanceRequestRequestDTO dto,
            Authentication authentication) {

        Shop shop = shopService.getShopById(dto.getShopId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            shop = shopService.getOwnedShop(
                    shop.getId(), authentication.getName());
        }

        User requester = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Authenticated user not found"
                ));

        MaintenanceRequest request = new MaintenanceRequest();
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setCategory(dto.getCategory());
        request.setPriority(dto.getPriority());
        request.setStatus("PENDING");
        request.setShop(shop);
        request.setRequestedBy(requester);

        MaintenanceRequest savedRequest =
                maintenanceService.createRequest(request);

        return convertToDTO(savedRequest);
    }

    @GetMapping
    public List<MaintenanceRequestDTO> getAllRequests(
            Authentication authentication) {

        if (hasRole(authentication, "ADMIN")
                || hasRole(authentication, "STAFF")
                || hasRole(authentication, "SECURITY")) {

            return maintenanceService.getAllRequests()
                    .stream()
                    .map(this::convertToDTO)
                    .toList();
        }

        return shopService.getShopsOwnedBy(authentication.getName())
                .stream()
                .flatMap(shop -> maintenanceService.getRequestsByShop(shop).stream())
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public MaintenanceRequestDTO getRequestById(
            @PathVariable Long id,
            Authentication authentication) {

        MaintenanceRequest request = maintenanceService.getRequestById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Maintenance request not found"
                ));

        if (!hasRole(authentication, "ADMIN")
                && !hasRole(authentication, "STAFF")
                && !hasRole(authentication, "SECURITY")) {

            shopService.getOwnedShop(
                    request.getShop().getId(),
                    authentication.getName());
        }

        return convertToDTO(request);
    }

 
    @GetMapping("/shop/{shopId}")
    public List<MaintenanceRequestDTO> getRequestsByShop(
            @PathVariable Long shopId,
            Authentication authentication) {

        Shop shop = shopService.getShopById(shopId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        if (!hasRole(authentication, "ADMIN")
                && !hasRole(authentication, "STAFF")
                && !hasRole(authentication, "SECURITY")) {

            shopService.getOwnedShop(shopId, authentication.getName());
        }

        return maintenanceService.getRequestsByShop(shop)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    
    @GetMapping("/status/{status}")
    public List<MaintenanceRequestDTO> getRequestsByStatus(
            @PathVariable String status,
            Authentication authentication) {

        if (hasRole(authentication, "ADMIN")
                || hasRole(authentication, "STAFF")
                || hasRole(authentication, "SECURITY")) {

            return maintenanceService.getRequestsByStatus(status)
                    .stream()
                    .map(this::convertToDTO)
                    .toList();
        }

        return shopService.getShopsOwnedBy(authentication.getName())
                .stream()
                .flatMap(shop ->
                    maintenanceService.getShopRequestsByStatus(shop, status).stream())
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/shop/{shopId}/status/{status}")
    public List<MaintenanceRequestDTO> getShopRequestsByStatus(
            @PathVariable Long shopId,
            @PathVariable String status,
            Authentication authentication) {

        Shop shop = shopService.getShopById(shopId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        if (!hasRole(authentication, "ADMIN")
                && !hasRole(authentication, "STAFF")
                && !hasRole(authentication, "SECURITY")) {

            shopService.getOwnedShop(shopId, authentication.getName());
        }

        return maintenanceService.getShopRequestsByStatus(shop, status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @PutMapping("/{id}")
    public MaintenanceRequestDTO updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestRequestDTO dto,
            Authentication authentication) {

        MaintenanceRequest request = maintenanceService.getRequestById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Maintenance request not found"));

        boolean isAdmin = hasRole(authentication, "ADMIN");
        boolean isStaff = hasRole(authentication, "STAFF");
        boolean isSecurity = hasRole(authentication, "SECURITY");

        if (!isAdmin && !isStaff && !isSecurity) {
            shopService.getOwnedShop(
                    request.getShop().getId(),
                    authentication.getName());
        }

        Shop shop = shopService.getShopById(dto.getShopId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shop not found"));

        if (!isAdmin && !isStaff && !isSecurity) {
            shopService.getOwnedShop(shop.getId(), authentication.getName());
        }

        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setCategory(dto.getCategory());
        request.setPriority(dto.getPriority());
        request.setShop(shop);

        MaintenanceRequest updatedRequest =
                maintenanceService.createRequest(request);

        return convertToDTO(updatedRequest);
    }

    @GetMapping("/my-requests")
    public List<MaintenanceRequestDTO> getMyMaintenanceRequests(
            Authentication authentication) {

        // Admin/Staff/Security continue using their existing authorized endpoints.
        // This endpoint is specifically for the signed-in Shop Owner's own submissions.
        if (!hasRole(authentication, "SHOP_OWNER")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This endpoint is for Shop Owners only");
        }

        return shopService.getShopsOwnedBy(authentication.getName())
                .stream()
                .flatMap(shop -> maintenanceService.getRequestsByShop(shop).stream())
                .filter(request -> request.getRequestedBy() != null
                        && authentication.getName().equals(
                                request.getRequestedBy().getUsername()))
                .map(this::convertToDTO)
                .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRequest(@PathVariable Long id) {
        if (maintenanceService.getRequestById(id).isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Maintenance request not found"
            );
        }

        maintenanceService.deleteRequest(id);
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
