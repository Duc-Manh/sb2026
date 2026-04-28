package com.songbunghpc.factory.controller;

import com.songbunghpc.factory.entity.Login;
import com.songbunghpc.factory.service.LoginService;
import com.songbunghpc.factory.dto.ChangePasswordRequest;
import com.songbunghpc.factory.dto.ResponseMessage;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // Cần import thêm cái này để dùng Map.of

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private LoginService loginService;

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Login user = (Login) session.getAttribute("user"); 
        if (user != null) {
            return ResponseEntity.ok(user); 
        }
        return ResponseEntity.status(401).body("Chưa đăng nhập");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        boolean success = loginService.changePassword(
            request.getUsername(), 
            request.getOldPassword(), 
            request.getNewPassword()
        );

        if (success) {
            return ResponseEntity.ok(new ResponseMessage("Thành công"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body(new ResponseMessage("Thông tin không chính xác hoặc mật khẩu cũ sai"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        // Hủy toàn bộ phiên làm việc của người dùng trên Server
        session.invalidate(); 
        
        // Trả về JSON để Frontend biết đã xong và chuyển trang
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }
    
}