
package com.yashika.mallmate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.yashika.mallmate.dto.ShopCategoryRequestDTO;
import com.yashika.mallmate.dto.ShopCategoryResponseDTO;
import com.yashika.mallmate.entity.ShopCategory;
import com.yashika.mallmate.service.ShopCategoryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/categories")
public class ShopCategoryController {

    private final ShopCategoryService categoryService;

    public ShopCategoryController(ShopCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private ShopCategoryResponseDTO convertToDTO(ShopCategory category) {
        return new ShopCategoryResponseDTO(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getIcon()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShopCategoryResponseDTO createCategory(
            @Valid @RequestBody ShopCategoryRequestDTO request) {

        ShopCategory category = new ShopCategory();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        return convertToDTO(categoryService.createCategory(category));
    }

    @GetMapping
    public List<ShopCategoryResponseDTO> getAllCategories() {
        return categoryService.getAllCategories()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ShopCategoryResponseDTO getCategoryById(@PathVariable Long id) {
        ShopCategory category = categoryService.getCategoryById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Category not found"
                ));

        return convertToDTO(category);
    }

    @GetMapping("/search")
    public List<ShopCategoryResponseDTO> searchCategories(
            @RequestParam String name) {

        return categoryService.searchCategories(name)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        if (categoryService.getCategoryById(id).isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Category not found"
            );
        }

        categoryService.deleteCategory(id);
    }

    @PutMapping("/{id}")
    public ShopCategoryResponseDTO updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody ShopCategoryRequestDTO request) {

        ShopCategory category = categoryService.getCategoryById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        return convertToDTO(categoryService.createCategory(category));
    }
}
