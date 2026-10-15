package com.yashika.mallmate.service;

import java.util.Locale;

import com.yashika.mallmate.entity.User;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MallMateUserDetailsService implements UserDetailsService {

    private final UserService userService;

    public MallMateUserDetailsService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                    "Invalid username or password"
                ));

        if (user.getRole() == null || user.getRole().getName() == null) {
            throw new UsernameNotFoundException(
                "User does not have a valid role"
            );
        }

        String authority = "ROLE_" +
                user.getRole().getName().toUpperCase(Locale.ROOT);

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(authority)
                .disabled(!user.isActive())
                .build();
    }
}
