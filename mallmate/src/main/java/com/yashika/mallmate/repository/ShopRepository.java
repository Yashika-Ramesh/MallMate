
package com.yashika.mallmate.repository;

import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.entity.ShopCategory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findByShopNumber(String shopNumber);

    List<Shop> findByNameContainingIgnoreCase(String name);

    List<Shop> findByFloor(Floor floor);

    List<Shop> findByCategory(ShopCategory category);

    List<Shop> findByCategory_NameIgnoreCase(String categoryName);
        
    Optional<Shop> findByIdAndOwner_Username(Long id, String username);

    List<Shop> findByOwner_Username(String username);

}
