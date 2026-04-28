package com.songbunghpc.factory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
@NonNull
    // Khai báo final để đảm bảo biến này không bị thay đổi và không bao giờ null
    private final RoleInterceptor roleInterceptor;

    // Tạo Constructor để Spring tự động inject RoleInterceptor
    public WebConfig(@NonNull RoleInterceptor roleInterceptor) {
        this.roleInterceptor = roleInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // Lúc này roleInterceptor đã được đảm bảo không null ngay từ khi khởi tạo WebConfig
        registry.addInterceptor(roleInterceptor)
                .addPathPatterns(
                    "/pxvhboss.html", 
                    "/pxvhaddemploy.html", 
                    "/pxvhtruongca.html", 
                    "/pxvhlichtruc.html", 
                    "/pxvhchamcong.html",
                    "/pxvhoffice.html",
                    "/api/employee/**"
                )
                .excludePathPatterns(
                    "/", 
                    "/api/auth/login", 
                    "/css/**", 
                    "/js/**", 
                    "/images/**", 
                    "/favicon.ico"
                );
    }
}