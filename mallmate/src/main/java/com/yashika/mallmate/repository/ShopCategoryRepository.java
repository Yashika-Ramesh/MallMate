package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.ShopCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopCategoryRepository
        extends JpaRepository<ShopCategory, Long> {

    Optional<ShopCategory> findByName(String name);

    boolean existsByName(String name);

    List<ShopCategory> findByNameContainingIgnoreCase(String name);
}
