package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.Tenant;
import com.yashika.mallmate.entity.Shop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByShop(Shop shop);

    List<Tenant> findByBusinessNameContainingIgnoreCase(String businessName);

    boolean existsByShop(Shop shop);

    boolean existsByShop_IdAndIdNot(Long shopId, Long tenantId);
}