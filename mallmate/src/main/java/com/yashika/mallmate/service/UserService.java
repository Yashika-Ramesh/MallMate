package com.yashika.mallmate.service;

import com.yashika.mallmate.entity.Role;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleService roleService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user, Long roleId) {

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Username already exists"
            );
        }

        Role role = roleService.getRoleById(roleId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role not found with ID: " + roleId
            ));

        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setActive(true);

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public void deleteUser(Long id, String currentUsername) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + id));

        // Prevent deleting the currently logged-in account
        if (user.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot deactivate your own account");
        }

        if (user.isActive()
                && user.getRole() != null
                && "ADMIN".equalsIgnoreCase(user.getRole().getName())
                && userRepository.countByRole_NameAndActiveTrue("ADMIN") <= 1) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot deactivate the last active administrator"
            );
        }
        // Deactivate instead of permanently deleting
        user.setActive(false);
        userRepository.save(user);
    }


    public User updateUser(User user) {
        return userRepository.save(user);
    }
}
