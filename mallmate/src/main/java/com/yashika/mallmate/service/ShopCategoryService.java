
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.ShopCategory;
import com.yashika.mallmate.repository.ShopCategoryRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ShopCategoryService {

    private final ShopCategoryRepository shopCategoryRepository;

    public ShopCategoryService(
            ShopCategoryRepository shopCategoryRepository) {
        this.shopCategoryRepository = shopCategoryRepository;
    }

    public ShopCategory createCategory(ShopCategory category) {
        if (shopCategoryRepository.existsByName(category.getName())) {
            throw new IllegalArgumentException(
                    "A category with this name already exists");
        }

        return shopCategoryRepository.save(category);
    }

    public List<ShopCategory> getAllCategories() {
        return shopCategoryRepository.findAll();
    }

    public Optional<ShopCategory> getCategoryById(Long id) {
        return shopCategoryRepository.findById(id);
    }

    public List<ShopCategory> searchCategories(String name) {
        return shopCategoryRepository
                .findByNameContainingIgnoreCase(name);
    }

    public void deleteCategory(Long id) {
        shopCategoryRepository.deleteById(id);
    }
}
