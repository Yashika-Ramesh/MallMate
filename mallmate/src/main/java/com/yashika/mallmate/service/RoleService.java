
package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Role;
import com.yashika.mallmate.repository.RoleRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }

    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    
    public Role getRoleByName(String name) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseThrow(() ->
                        new RuntimeException("Role not found: " + name));
    }

}
