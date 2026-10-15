
package com.yashika.mallmate.controller;

import com.yashika.mallmate.dto.RoleRequestDTO;
import com.yashika.mallmate.dto.RoleResponseDTO;
import com.yashika.mallmate.entity.Role;
import com.yashika.mallmate.service.RoleService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
// import java.util.Locale;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    private RoleResponseDTO toResponseDTO(Role role) {
        return new RoleResponseDTO(role.getId(), role.getName());
    }

    @GetMapping
    public List<RoleResponseDTO> getAllRoles() {
        return roleService.getAllRoles()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public RoleResponseDTO getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Role not found with ID: " + id));

        return toResponseDTO(role);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponseDTO createRole(
            @Valid @RequestBody RoleRequestDTO request) {

        String roleName = request.getName().trim().toUpperCase();

        if (!List.of(
            "ADMIN",
            "STAFF",
            "SHOP_OWNER",
            "SECURITY",
            "CUSTOMER"
        ).contains(roleName)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid role name"
            );
        }

        Role role = new Role();
        role.setName(roleName);

        return toResponseDTO(roleService.createRole(role));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable Long id) {
        if (roleService.getRoleById(id).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Role not found"
            );
        }

        roleService.deleteRole(id);
    }

}
