
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Tenant;
import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.repository.TenantRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public Tenant createTenant(Tenant tenant) {
        if (tenant.getShop() != null
                && tenantRepository.existsByShop(tenant.getShop())) {
            throw new IllegalArgumentException(
                    "A tenant is already registered for this shop");
        }

        return tenantRepository.save(tenant);
    }

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Optional<Tenant> getTenantById(Long id) {
        return tenantRepository.findById(id);
    }

    public Optional<Tenant> getTenantByShop(Shop shop) {
        return tenantRepository.findByShop(shop);
    }

    public List<Tenant> searchTenantsByBusinessName(String businessName) {
        return tenantRepository
                .findByBusinessNameContainingIgnoreCase(businessName);
    }

    public void deleteTenant(Long id) {
        tenantRepository.deleteById(id);
    }

    public Tenant updateTenant(Long tenantId, Tenant updatedTenant) {

    Tenant existingTenant = tenantRepository.findById(tenantId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Tenant not found"));

    if (updatedTenant.getShop() != null
            && tenantRepository.existsByShop_IdAndIdNot(
                    updatedTenant.getShop().getId(), tenantId)) {

        throw new IllegalArgumentException(
                "A tenant is already registered for this shop");
    }

    existingTenant.setBusinessName(updatedTenant.getBusinessName());
    existingTenant.setContactPerson(updatedTenant.getContactPerson());
    existingTenant.setEmail(updatedTenant.getEmail());
    existingTenant.setPhone(updatedTenant.getPhone());
    existingTenant.setLeaseStartDate(updatedTenant.getLeaseStartDate());
    existingTenant.setLeaseEndDate(updatedTenant.getLeaseEndDate());
    existingTenant.setMonthlyRent(updatedTenant.getMonthlyRent());
    existingTenant.setShop(updatedTenant.getShop());

    return tenantRepository.save(existingTenant);
}
}
