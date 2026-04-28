package com.songbunghpc.factory.config;
import org.springframework.lang.NonNull;
import com.songbunghpc.factory.entity.Login;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RoleInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,@NonNull Object handler) throws Exception {
        Login user = (Login) request.getSession().getAttribute("user");
        String path = request.getRequestURI();

        // Nếu chưa đăng nhập mà đòi vào các trang quản trị
        if (user == null) {
            response.sendRedirect("/");
            return false;
        }

        // Chặn User thường vào các trang nhạy cảm
        boolean isSensitivePage = path.contains("pxvhboss.html") || 
                                  path.contains("pxvhaddemploy.html") || 
                                  path.startsWith("/api/employee/add") || 
                                  path.startsWith("/api/employee/delete") || 
                                  path.startsWith("/api/employee/update");
                                  
        if (isSensitivePage) {
            boolean hasPermission = "admin".equalsIgnoreCase(user.getRole()) || "cs".equalsIgnoreCase(user.getRole());
            if (!hasPermission) {
                // Trả về lỗi 403 Forbidden nếu là gọi API, ngược lại chuyển hướng về trang chủ
                if (path.startsWith("/api/")) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\": \"Bạn không có quyền thực hiện hành động này\"}");
                } else {
                    response.sendRedirect("/");
                }
                return false;
            }
        }

        return true;
    }
}