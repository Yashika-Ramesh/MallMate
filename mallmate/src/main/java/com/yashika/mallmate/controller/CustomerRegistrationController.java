
package com.yashika.mallmate.controller;

import com.yashika.mallmate.dto.CustomerRegistrationDTO;
import com.yashika.mallmate.entity.User;
import com.yashika.mallmate.service.RoleService;
import com.yashika.mallmate.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class CustomerRegistrationController {

    private final UserService userService;
    private final RoleService roleService;

    public CustomerRegistrationController(
            UserService userService,
            RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public String registerCustomer(
            @Valid @RequestBody CustomerRegistrationDTO request) {

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(request.getPassword());
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPhone(request.getPhone().trim());

        var customerRole = roleService.getRoleByName("CUSTOMER");

        try {
            userService.createUser(user, customerRole.getId());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage()
            );
        }

        return "Customer account created successfully";
    }
}
