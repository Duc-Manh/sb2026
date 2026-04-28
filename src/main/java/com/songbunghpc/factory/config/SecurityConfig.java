package com.songbunghpc.factory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF để cho phép các request POST từ Frontend (AJAX/Fetch)
            .csrf(csrf -> csrf.disable())
            
            // Cho phép tất cả các request đi qua Spring Security 
            // để RoleInterceptor của bạn tự kiểm tra quyền
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            
            // Tắt trình quản lý đăng nhập mặc định của Spring Security
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}