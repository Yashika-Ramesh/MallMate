
package com.yashika.mallmate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.ShopRequestDTO;
import com.yashika.mallmate.dto.ShopResponseDTO;
import com.yashika.mallmate.dto.ShopOwnerUpdateDTO;
import com.yashika.mallmate.entity.Floor;
import com.yashika.mallmate.entity.Shop;
import com.yashika.mallmate.entity.ShopCategory;
import com.yashika.mallmate.service.FloorService;
import com.yashika.mallmate.service.ShopCategoryService;
import com.yashika.mallmate.service.ShopService;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.service.UserService;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/shops")
public class ShopController {

        private final ShopService shopService;
        private final FloorService floorService;
        private final ShopCategoryService categoryService;
        private final UserService userService;

        public ShopController(
                ShopService shopService,
                FloorService floorService,
                ShopCategoryService categoryService,
                UserService userService) {
                this.shopService = shopService;
                this.floorService = floorService;
                this.categoryService = categoryService;
                this.userService = userService;
        }


        private ShopResponseDTO convertToDTO(Shop shop) {
                return new ShopResponseDTO(
                        shop.getId(),
                        shop.getName(),
                        shop.getShopNumber(),
                        shop.getDescription(),
                        shop.getStatus(),
                        shop.isUnderMaintenance(),
                        shopService.getOperatingStatus(shop),
                        shop.getOpeningTime(),
                        shop.getClosingTime(),
                        shop.getImageUrl(),
                        shop.getFloor() != null ? shop.getFloor().getFloorNumber() : null,
                        shop.getFloor() != null ? shop.getFloor().getName() : null,
                        shop.getCategory() != null ? shop.getCategory().getName() : null,
                        shop.getOwner() != null ? shop.getOwner().getName() : null
                );
        }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShopResponseDTO createShop(
            @Valid @RequestBody ShopRequestDTO request) {

        Floor floor = floorService.getFloorById(request.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Floor not found"
                ));

        ShopCategory category =
                categoryService.getCategoryById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop category not found"
                ));

        Shop shop = new Shop();
        shop.setName(request.getName());
        shop.setShopNumber(request.getShopNumber());
        shop.setDescription(request.getDescription());
        shop.setStatus(request.getStatus());
        shop.setOpeningTime(request.getOpeningTime());
        shop.setClosingTime(request.getClosingTime());
        shop.setImageUrl(request.getImageUrl());
        shop.setFloor(floor);
        shop.setCategory(category);

        if (request.getOwnerUsername() != null
                && !request.getOwnerUsername().isBlank()) {
            User owner = userService.getUserByUsername(request.getOwnerUsername())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Shop owner account not found"));

            if (owner.getRole() == null
                    || !"SHOP_OWNER".equalsIgnoreCase(owner.getRole().getName())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "The selected user must have the SHOP_OWNER role");
            }
            if (!owner.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "The selected shop-owner account is inactive");
            }
            shop.setOwner(owner);
        }

        return convertToDTO(shopService.createShop(shop));
    }

    @GetMapping
    public List<ShopResponseDTO> getAllShops() {
        return shopService.getAllShops()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ShopResponseDTO getShopById(
            @PathVariable Long id,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isShopOwner = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SHOP_OWNER"));

        Shop shop;

        if (isAdmin) {
            shop = shopService.getShopById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Shop not found"));
        } else if (isShopOwner) {
            shop = shopService.getOwnedShop(
                    id, authentication.getName());
        } else {
            shop = shopService.getShopById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Shop not found"));
        }

        return convertToDTO(shop);
    }

    @GetMapping("/search")
    public List<ShopResponseDTO> searchShops(@RequestParam String name) {
        return shopService.searchShopsByName(name)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/number/{shopNumber}")
    public ShopResponseDTO getShopByNumber(
            @PathVariable String shopNumber) {
        Shop shop = shopService.getShopByNumber(shopNumber)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop not found"
                ));

        return convertToDTO(shop);
    }

    @GetMapping("/category/{categoryName}")
    public List<ShopResponseDTO> getShopsByCategory(
            @PathVariable String categoryName) {
        return shopService.getShopsByCategoryName(categoryName)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/floor/{floorId}")
    public List<ShopResponseDTO> getShopsByFloor(
            @PathVariable Long floorId) {
        Floor floor = floorService.getFloorById(floorId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Floor not found"
                ));

        return shopService.getShopsByFloor(floor)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/category-id/{categoryId}")
    public List<ShopResponseDTO> getShopsByCategoryId(
            @PathVariable Long categoryId) {
        ShopCategory category =
                categoryService.getCategoryById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Shop category not found"
                ));

        return shopService.getShopsByCategory(category)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShop(@PathVariable Long id) {
        if (shopService.getShopById(id).isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Shop not found"
            );
        }

        shopService.deleteShop(id);
    }

    @PutMapping("/{shopId}/owner/{username}")
    public ShopResponseDTO assignShopOwner(
        @PathVariable Long shopId,
        @PathVariable String username) {

        Shop shop = shopService.assignOwner(shopId, username);
        return convertToDTO(shop);
    }

        @GetMapping("/my-shop")
        public ShopResponseDTO getMyShop(Authentication authentication) {

        Shop shop = shopService.getShopsOwnedBy(authentication.getName())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No shop assigned to this owner"));

        return convertToDTO(shop);
        }

    @PutMapping("/{id}")
    public ShopResponseDTO updateShopAsAdmin(
            @PathVariable Long id,
            @Valid @RequestBody ShopRequestDTO request,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only ADMIN can use this endpoint");
        }

        Shop shop = shopService.getShopById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shop not found"));

        shop.setName(request.getName());
        shop.setShopNumber(request.getShopNumber());
        shop.setDescription(request.getDescription());
        shop.setStatus(request.getStatus());
        shop.setOpeningTime(request.getOpeningTime());
        shop.setClosingTime(request.getClosingTime());
        shop.setImageUrl(request.getImageUrl());

        Floor floor = floorService.getFloorById(request.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Floor not found"));

        ShopCategory category = categoryService
                .getCategoryById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shop category not found"));

        shop.setFloor(floor);
        shop.setCategory(category);

        return convertToDTO(shopService.createShop(shop));
    }

    @PatchMapping("/{id}/details")
    public ShopResponseDTO updateShopDetails(
            @PathVariable Long id,
            @Valid @RequestBody ShopOwnerUpdateDTO request,
            Authentication authentication) {

        boolean isShopOwner = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SHOP_OWNER"));

        if (!isShopOwner) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only SHOP_OWNER can use this endpoint");
        }

        Shop shop = shopService.getOwnedShop(id, authentication.getName());

        shop.setName(request.getName());
        shop.setDescription(request.getDescription());
        shop.setOpeningTime(request.getOpeningTime());
        shop.setClosingTime(request.getClosingTime());
        shop.setImageUrl(request.getImageUrl());

        return convertToDTO(shopService.createShop(shop));
    }

        
        @PatchMapping("/{id}/maintenance")
        public ShopResponseDTO updateShopMaintenance(
                @PathVariable Long id,
                @RequestParam boolean underMaintenance,
                Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Only ADMIN can change maintenance status");
        }

        Shop shop = shopService.setMaintenance(id, underMaintenance);

        return convertToDTO(shop);
        }


}
