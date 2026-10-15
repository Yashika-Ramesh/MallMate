
package com.yashika.mallmate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.TenantRequestDTO;
import com.yashika.mallmate.dto.TenantResponseDTO;
import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.entity.Tenant;
import com.yashika.mallmate.service.ShopService;
import com.yashika.mallmate.service.TenantService;
import org.springframework.security.core.Authentication;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantService tenantService;
    private final ShopService shopService;

    public TenantController(
            TenantService tenantService,
            ShopService shopService) {
        this.tenantService = tenantService;
        this.shopService = shopService;
    }

 
    private TenantResponseDTO convertToDTO(Tenant tenant) {
        return new TenantResponseDTO(
            tenant.getId(),
            tenant.getBusinessName(),
            tenant.getContactPerson(),
            tenant.getEmail(),
            tenant.getPhone(),
            tenant.getLeaseStartDate(),
            tenant.getLeaseEndDate(),
            tenant.getMonthlyRent(),
            tenant.getShop() != null ? tenant.getShop().getId() : null,
            tenant.getShop() != null ? tenant.getShop().getName() : null
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponseDTO createTenant(
            @Valid @RequestBody TenantRequestDTO request) {

        Shop shop = shopService.getShopById(request.getShopId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        Tenant tenant = new Tenant();
        tenant.setBusinessName(request.getBusinessName());
        tenant.setContactPerson(request.getContactPerson());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());
        tenant.setLeaseStartDate(request.getLeaseStartDate());
        tenant.setLeaseEndDate(request.getLeaseEndDate());
        tenant.setMonthlyRent(request.getMonthlyRent());
        tenant.setShop(shop);

        return convertToDTO(tenantService.createTenant(tenant));
    }

    @GetMapping
    public List<TenantResponseDTO> getAllTenants() {
        return tenantService.getAllTenants()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public TenantResponseDTO getTenantById(@PathVariable Long id) {
        Tenant tenant = tenantService.getTenantById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Tenant not found"
                ));

        return convertToDTO(tenant);
    }

    @GetMapping("/search")
    public List<TenantResponseDTO> searchTenants(
            @RequestParam String businessName) {

        return tenantService.searchTenantsByBusinessName(businessName)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/shop/{shopId}")
    public TenantResponseDTO getTenantByShop(@PathVariable Long shopId) {
        Shop shop = shopService.getShopById(shopId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        Tenant tenant = tenantService.getTenantByShop(shop)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Tenant not found"
                ));

        return convertToDTO(tenant);
    }

    @GetMapping("/my-lease")
    public TenantResponseDTO getMyLease(Authentication authentication) {

        List<Shop> shops =
                shopService.getShopsOwnedBy(authentication.getName());

        Shop shop = shops.stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No shop assigned to this owner"));

        Tenant tenant = tenantService.getTenantByShop(shop)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No lease found for your shop"));

        return convertToDTO(tenant);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTenant(@PathVariable Long id) {
        if (tenantService.getTenantById(id).isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Tenant not found"
            );
        }

        tenantService.deleteTenant(id);
    }

@PutMapping("/{id}")
public TenantResponseDTO updateTenant(
        @PathVariable Long id,
        @Valid @RequestBody TenantRequestDTO request) {

    Tenant tenant = tenantService.getTenantById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Tenant not found"));

    Shop shop = shopService.getShopById(request.getShopId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"));

    tenant.setBusinessName(request.getBusinessName());
    tenant.setContactPerson(request.getContactPerson());
    tenant.setEmail(request.getEmail());
    tenant.setPhone(request.getPhone());
    tenant.setLeaseStartDate(request.getLeaseStartDate());
    tenant.setLeaseEndDate(request.getLeaseEndDate());
    tenant.setMonthlyRent(request.getMonthlyRent());
    tenant.setShop(shop);

    return convertToDTO(tenantService.updateTenant(id, tenant));
}

}

