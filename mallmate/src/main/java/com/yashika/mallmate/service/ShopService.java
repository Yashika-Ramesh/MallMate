package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.entity.ShopCategory;
import com.yashika.mallmate.repository.ShopRepository;
import com.yashika.mallmate.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public ShopService(
            ShopRepository shopRepository,
            UserRepository userRepository) {
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
    }

    public Shop createShop(Shop shop) {
        return shopRepository.save(shop);
    }

    public List<Shop> getAllShops() {
        return shopRepository.findAll();
    }

    public Optional<Shop> getShopById(Long id) {
        return shopRepository.findById(id);
    }

    public Optional<Shop> getShopByNumber(String shopNumber) {
        return shopRepository.findByShopNumber(shopNumber);
    }

    public List<Shop> searchShopsByName(String name) {
        return shopRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Shop> getShopsByFloor(Floor floor) {
        return shopRepository.findByFloor(floor);
    }

    public List<Shop> getShopsByCategory(ShopCategory category) {
        return shopRepository.findByCategory(category);
    }

    public List<Shop> getShopsByCategoryName(String categoryName) {
        return shopRepository.findByCategory_NameIgnoreCase(categoryName);
    }

    public List<Shop> getShopsOwnedBy(String username) {
        return shopRepository.findByOwner_Username(username);
    }

    @Transactional
    public Shop assignOwner(Long shopId, String username) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shop not found"));

        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (owner.getRole() == null
                || !"SHOP_OWNER".equalsIgnoreCase(owner.getRole().getName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected user must have the SHOP_OWNER role");
        }

        shop.setOwner(owner);
        return shopRepository.save(shop);
    }

    public Shop getOwnedShop(Long shopId, String username) {
        return shopRepository.findByIdAndOwner_Username(shopId, username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shop not found or not assigned to you"));
    }

    /**
     * Calculates the current operating status of a shop.
     * Expected time format: HH:mm, for example 09:00 or 21:30.
     */
    
    public String getOperatingStatus(Shop shop) {

        // Inactive shops are always closed.
        if (shop.getStatus() == null
                || !"ACTIVE".equalsIgnoreCase(shop.getStatus())) {
            return "CLOSED";
        }

        // Maintenance takes priority for active shops.
        if (shop.isUnderMaintenance()) {
            return "UNDER_MAINTENANCE";
        }

        String openingTime = shop.getOpeningTime();
        String closingTime = shop.getClosingTime();

        if (openingTime == null || closingTime == null
                || openingTime.isBlank() || closingTime.isBlank()) {
            return "CLOSED";
        }

        try {
            LocalTime opening = LocalTime.parse(openingTime);
            LocalTime closing = LocalTime.parse(closingTime);
            LocalTime now = LocalTime.now();

            if (opening.equals(closing)) {
                return "CLOSED";
            }

            boolean isOpen;

            if (opening.isBefore(closing)) {
                // Example: 09:00–21:00
                isOpen = !now.isBefore(opening) && now.isBefore(closing);
            } else {
                // Example: 22:00–06:00
                isOpen = !now.isBefore(opening) || now.isBefore(closing);
            }

            return isOpen ? "OPEN" : "CLOSED";

        } catch (DateTimeParseException exception) {
            return "CLOSED";
        }
    }

    /**
     * Changes the maintenance flag.
     * The controller must restrict access to this operation to admins.
     */
    @Transactional
    public Shop setMaintenance(Long shopId, boolean underMaintenance) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shop not found"));

        shop.setUnderMaintenance(underMaintenance);
        return shopRepository.save(shop);
    }

    public void deleteShop(Long id) {
        shopRepository.deleteById(id);
    }
}