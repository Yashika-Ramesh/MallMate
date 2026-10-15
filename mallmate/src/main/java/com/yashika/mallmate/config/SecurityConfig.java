package com.yashika.mallmate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.function.Supplier;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider authenticationProvider)
            throws Exception {

        CookieCsrfTokenRepository csrfRepository =
                CookieCsrfTokenRepository.withHttpOnlyFalse();

        http
            .authenticationProvider(authenticationProvider)

            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfRepository)
                .csrfTokenRequestHandler(
                    new SpaCsrfTokenRequestHandler()
                )
            )

            .authorizeHttpRequests(auth -> auth
            // Public frontend files
            .requestMatchers(
                "/",
                "/index.html",
                "/style.css",
                "/app.js",
                "/register.html",
                "/register.js"
            ).permitAll()

            // Authentication endpoints
            .requestMatchers(
                "/api/auth/csrf",
                "/api/auth/login"
            ).permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/roles",
                    "/api/roles/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/roles/**"
                ).hasRole("ADMIN")

                // Signed-in users can access their own /me endpoint
                .requestMatchers("/api/users/me").authenticated()

                // Only admins can update other user records
                .requestMatchers(HttpMethod.PUT, "/api/users/*").hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/register"
                ).permitAll()

                // All other user-management endpoints are admin-only
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                
                .requestMatchers(HttpMethod.GET, "/api/shops/my-shop").hasRole("SHOP_OWNER")
                .requestMatchers(HttpMethod.POST, "/api/shops", "/api/shops/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/shops", "/api/shops/**").hasRole("ADMIN")                    
                .requestMatchers(HttpMethod.PUT, "/api/shops/*/owner/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/shops/*").hasAnyRole("ADMIN", "SHOP_OWNER")
                .requestMatchers(HttpMethod.PATCH, "/api/shops/*/details").hasRole("SHOP_OWNER")
                .requestMatchers(HttpMethod.PATCH, "/api/shops/**").hasRole("ADMIN")

                
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/floors", "/api/floors/**",
                    "/api/categories", "/api/categories/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/floors/**",
                    "/api/categories/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/floors/**",
                    "/api/categories/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/floors/**",
                    "/api/categories/**"
                ).hasRole("ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/tenants/my-lease").hasRole("SHOP_OWNER")
                .requestMatchers("/api/tenants", "/api/tenants/**").hasRole("ADMIN")

                // Only admins can delete incidents
                .requestMatchers(
                    HttpMethod.DELETE, "/api/incidents/**"
                ).hasRole("ADMIN")

                // Only admins can edit incident records
                .requestMatchers(
                    HttpMethod.PUT, "/api/incidents/**"
                ).hasRole("ADMIN")

                // These roles can access other incident operations
               
                // These roles can access incident operations.
                // Customers can submit reports and view only their own incidents.
                .requestMatchers(
                    "/api/incidents", "/api/incidents/**"
                ).hasAnyRole("ADMIN", "STAFF", "SECURITY", "SHOP_OWNER", "CUSTOMER")


        
                // Only admins can delete maintenance requests
                .requestMatchers(
                    HttpMethod.DELETE, "/api/maintenance/**"
                ).hasRole("ADMIN")

                // Only admins can edit maintenance request records
                .requestMatchers(
                    HttpMethod.PUT, "/api/maintenance/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.GET, "/api/maintenance/my-requests"
                ).hasRole("SHOP_OWNER")

                // These roles can access other maintenance operations
                .requestMatchers(
                    "/api/maintenance", "/api/maintenance/**"
                ).hasAnyRole("ADMIN", "STAFF", "SECURITY")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/announcements", "/api/announcements/**",
                    "/api/facilities", "/api/facilities/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/announcements/**",
                    "/api/facilities/**"
                ).hasRole("ADMIN")

                // Only admins can edit facilities
                .requestMatchers(
                    HttpMethod.PUT, "/api/facilities/**"
                ).hasRole("ADMIN")

                // Only admins can edit announcements
                .requestMatchers(
                    HttpMethod.PUT, "/api/announcements/**"
                ).hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            .formLogin(form -> form
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .successHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        "{\"message\":\"Login successful\"}"
                    );
                })
                .failureHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        "{\"message\":\"Invalid username or password\"}"
                    );
                })
                .permitAll()
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT)
                )
            )

            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        "{\"message\":\"Authentication required\"}"
                    );
                })
                .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        "{\"message\":\"Access denied\"}"
                    );
                })
            );

        return http.build();
    }

    private static final class SpaCsrfTokenRequestHandler
            implements CsrfTokenRequestHandler {

        private final CsrfTokenRequestHandler plain =
                new CsrfTokenRequestAttributeHandler();

        private final CsrfTokenRequestHandler xor =
                new XorCsrfTokenRequestAttributeHandler();

        @Override
        public void handle(
                HttpServletRequest request,
                HttpServletResponse response,
                Supplier<org.springframework.security.web.csrf.CsrfToken> csrfToken) {

            xor.handle(request, response, csrfToken);
            csrfToken.get();
        }

        @Override
        public String resolveCsrfTokenValue(
                HttpServletRequest request,
                org.springframework.security.web.csrf.CsrfToken csrfToken) {

            if (StringUtils.hasText(
                    request.getHeader(csrfToken.getHeaderName()))) {
                return plain.resolveCsrfTokenValue(request, csrfToken);
            }

            return xor.resolveCsrfTokenValue(request, csrfToken);
        }
    }
}

