package com.songbunghpc.factory.service;

import com.songbunghpc.factory.entity.Login;
import com.songbunghpc.factory.repository.LoginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class LoginService {

    @Autowired
    private LoginRepository loginRepository;

    // Khởi tạo encoder dùng chung cho toàn bộ class
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Xử lý đăng nhập: Hỗ trợ cả mật khẩu thuần và mật khẩu đã mã hóa BCrypt
     */
    public String authenticate(String user, String password, String captcha) {
        // 1. Kiểm tra mã xác thực (Captcha)
        if (!"8X2P".equalsIgnoreCase(captcha)) {
            return "Bạn nhập mã xác thực sai";
        }

        // 2. Kiểm tra tài khoản tồn tại trong DB
        Optional<Login> account = loginRepository.findByUser(user);
        if (account.isEmpty()) {
            return "Bạn nhập sai thông tin";
        }

        Login loginEntry = account.get();
        String dbPassword = loginEntry.getPassword();
        boolean authSuccess = false;

        // 3. Kiểm tra Password thông minh
        // Nếu mật khẩu trong DB bắt đầu bằng $2a$, đó là BCrypt
        if (dbPassword != null && dbPassword.startsWith("$2a$")) {
            authSuccess = encoder.matches(password, dbPassword);
        } else {
            // Ngược lại, so sánh trực tiếp (dành cho dữ liệu cũ chưa mã hóa)
            authSuccess = password.equals(dbPassword);
            if (authSuccess) {
                // Tính năng nâng cấp bảo mật âm thầm (Seamless Upgrade)
                loginEntry.setPassword(encoder.encode(password));
                loginRepository.save(loginEntry);
            }
        }

        if (!authSuccess) {
            return "Bạn nhập sai password";
        }

        return "SUCCESS";
    }

    /**
     * Xử lý đổi mật khẩu: Sau khi đổi, mật khẩu mới LUÔN được mã hóa BCrypt
     */
    public boolean changePassword(String user, String oldPassword, String newPassword) {
        Optional<Login> account = loginRepository.findByUser(user);
        
        if (account.isPresent()) {
            Login loginEntry = account.get();
            String currentDbPassword = loginEntry.getPassword();
            boolean isCorrectOldPassword = false;

            // Kiểm tra mật khẩu cũ để xác minh chính chủ
            if (currentDbPassword != null && currentDbPassword.startsWith("$2a$")) {
                isCorrectOldPassword = encoder.matches(oldPassword, currentDbPassword);
            } else {
                isCorrectOldPassword = oldPassword.equals(currentDbPassword);
            }

            // Nếu mật khẩu cũ khớp, tiến hành mã hóa mật khẩu mới và lưu
            if (isCorrectOldPassword) {
                String encodedPassword = encoder.encode(newPassword);
                loginEntry.setPassword(encodedPassword);
                loginRepository.save(loginEntry);
                return true;
            }
        }
        return false; 
    }
}