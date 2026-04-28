package com.songbunghpc.factory.controller;

import com.songbunghpc.factory.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import com.songbunghpc.factory.entity.Login;
import com.songbunghpc.factory.repository.LoginRepository;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Controller
public class LoginController {

    @Autowired
    private LoginService loginService;
    @Autowired
    private LoginRepository loginRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // Trình duyệt gọi trang chủ
    @GetMapping("/")
    public String index() {
        return "index";
    }

    // Trang Dashboard sau khi đăng nhập thành công
    @GetMapping("/pxvhboss.html")
    public String dashboard() {
        return "pxvhboss";
    }

    @GetMapping("/pxvhaddemploy.html")
    public String addEmployee() {
        return "pxvhaddemploy";
    }

    @GetMapping("/pxvhlichtruc.html")
    public String lichTruc() {
        return "pxvhlichtruc";
    }

    @GetMapping("/pxvhchamcong.html")
    public String chamCong() {
        return "pxvhchamcong";
    }

    @GetMapping("/pxvhtruongca.html")
    public String truongCaPage() {
        return "pxvhtruongca";
    }

    @GetMapping("/pxvhcansu.html")
    public String cansuPage() {
        return "pxvhcansu";
    }

    @GetMapping("/pxvhlead.html")
    public String leadPage() {
        return "pxvhlead";
    }

    @GetMapping("/pxvhlead1.html")
    public String lead1Page() {
        return "pxvhlead1";
    }

    @GetMapping("/pxvhlead2.html")
    public String lead2Page() {
        return "pxvhlead2";
    }

    @GetMapping("/pxvhdap2.html")
    public String dap2Page() {
        return "pxvhdap2";
    }

    @GetMapping("/pxvhdap4.html")
    public String dap4Page() {
        return "pxvhdap4";
    }

    // API xử lý Logic Đăng nhập (Giao tiếp với AJAX trong index.html)
    @PostMapping("/api/auth/login")
    @ResponseBody
    public ResponseEntity<?> handleLogin(@RequestBody Map<String, String> loginData, HttpSession session) {
        String user = loginData.get("username");
        String password = loginData.get("password");
        String captcha = loginData.get("captcha");

        String result = loginService.authenticate(user, password, captcha);

        if ("SUCCESS".equals(result)) {
            // Lấy thông tin đầy đủ từ Database
            Login loggedInUser = loginRepository.findByUser(user).orElse(null);
            if (loggedInUser != null) {
                // Lưu vào Session để các trang sau có thể kiểm tra
                session.setAttribute("user", loggedInUser);

                // TRẢ VỀ THÊM ROLE CHO FRONTEND
                return ResponseEntity.ok(Map.of(
                        "status", "SUCCESS",
                        "role", loggedInUser.getRole() != null ? loggedInUser.getRole() : "",
                        "username", loggedInUser.getUsername() != null ? loggedInUser.getUsername() : "",
                        "nhamay", loggedInUser.getNhamay() != null ? loggedInUser.getNhamay() : ""));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", result));
    }

    @PostMapping("/api/employee/add")
    @ResponseBody
    public ResponseEntity<?> addEmployee(@RequestBody Login newEmployee) {
        try {
            // Mã hóa mật khẩu nếu có
            if (newEmployee.getPassword() != null && !newEmployee.getPassword().isEmpty()) {
                newEmployee.setPassword(encoder.encode(newEmployee.getPassword()));
            }
            // JPA sẽ tự động tạo ID mới (Auto Increment) và lưu hàng này vào bảng login
            loginRepository.save(newEmployee);
            return ResponseEntity.ok(Map.of("message", "Thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/api/employee/all")
    @ResponseBody
    public ResponseEntity<List<Login>> getAllEmployees() {
        return ResponseEntity.ok(loginRepository.findAll());
    }

    @PutMapping("/api/employee/update/{id}")
    @ResponseBody
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Login employeeDetails) {
        Optional<Login> optionalEmployee = loginRepository.findById(id);
        if (optionalEmployee.isPresent()) {
            Login employee = optionalEmployee.get();
            employee.setUsername(employeeDetails.getUsername());

            // Chỉ mã hóa nếu mật khẩu được gửi lên và nó không phải là hash BCrypt có sẵn
            String newPass = employeeDetails.getPassword();
            if (newPass != null && !newPass.isEmpty()) {
                if (!newPass.startsWith("$2a$")) {
                    employee.setPassword(encoder.encode(newPass));
                } else {
                    employee.setPassword(newPass);
                }
            }

            employee.setHoten(employeeDetails.getHoten());
            employee.setChucdanh(employeeDetails.getChucdanh());
            employee.setNhamay(employeeDetails.getNhamay());
            employee.setKip(employeeDetails.getKip());
            employee.setSodienthoai(employeeDetails.getSodienthoai());
            employee.setEmail(employeeDetails.getEmail());
            employee.setRole(employeeDetails.getRole());

            loginRepository.save(employee);
            return ResponseEntity.ok(Map.of("message", "Cập nhật thành công"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy nhân sự"));
        }
    }

    @DeleteMapping("/api/employee/delete/{id}") // Đảm bảo đường dẫn khớp với Fetch API ở frontend
    @ResponseBody // Thêm cái này nếu bạn muốn trả về dữ liệu JSON
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            // Kiểm tra xem ID có tồn tại trong DB không trước khi xoá
            if (loginRepository.existsById(id)) {
                loginRepository.deleteById(id); // Gọi loginRepository thay vì employeeService
                return ResponseEntity.ok(Map.of("message", "Xoá nhân sự thành công"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy nhân sự"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/api/employee/statistics")
    @ResponseBody
    public ResponseEntity<?> getStatistics() {
        List<Login> all = loginRepository.findAll();

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", all.size());

        // Thống kê theo chức danh chung
        stats.put("lanhDao", all.stream()
                .filter(e -> "Quản Đốc".equals(e.getChucdanh()) || "Q. Quản Đốc".equals(e.getChucdanh())
                        || "Phó Quản Đốc".equals(e.getChucdanh()))
                .count());
        stats.put("ktv", all.stream().filter(e -> "Kỹ thuật viên".equals(e.getChucdanh())).count());
        stats.put("canSu", all.stream().filter(e -> "Cán sự".equals(e.getChucdanh())).count());

        // Thống kê Sông Bung 2
        List<Login> sb2 = all.stream().filter(e -> "Sông Bung 2".equals(e.getNhamay()))
                .collect(java.util.stream.Collectors.toList());
        stats.put("sb2Total", sb2.size());
        stats.put("sb2Tc", sb2.stream().filter(e -> "Trưởng Ca".equals(e.getChucdanh())).count());
        stats.put("sb2Dktt", sb2.stream().filter(e -> "Trực ĐKTT".equals(e.getChucdanh())).count());
        stats.put("sb2Gm", sb2.stream().filter(e -> "Trực Gian Máy".equals(e.getChucdanh())).count());
        stats.put("sb2Dap", sb2.stream().filter(e -> "Trực Đập".equals(e.getChucdanh())).count());

        // Thống kê Sông Bung 4
        List<Login> sb4 = all.stream().filter(e -> "Sông Bung 4".equals(e.getNhamay()))
                .collect(java.util.stream.Collectors.toList());
        stats.put("sb4Total", sb4.size());
        stats.put("sb4Tc", sb4.stream().filter(e -> "Trưởng Ca".equals(e.getChucdanh())).count());
        stats.put("sb4Dktt", sb4.stream().filter(e -> "Trực ĐKTT".equals(e.getChucdanh())).count());
        stats.put("sb4Gm", sb4.stream().filter(e -> "Trực Gian Máy".equals(e.getChucdanh())).count());
        stats.put("sb4Dap", sb4.stream().filter(e -> "Trực Đập".equals(e.getChucdanh())).count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/api/employee/duty-roster")
    @ResponseBody
    public ResponseEntity<?> getDutyRoster() {
        List<Login> all = loginRepository.findAll();

        Map<String, Map<String, Map<String, String>>> roster = all.stream()
                .filter(e -> e.getNhamay() != null && e.getKip() != null && e.getChucdanh() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        Login::getNhamay,
                        java.util.stream.Collectors.groupingBy(
                                Login::getKip,
                                java.util.stream.Collectors.toMap(
                                        Login::getChucdanh,
                                        e -> e.getHoten() != null ? e.getHoten() : "",
                                        // SỬA Ở ĐÂY: Dùng <br> để ngắt dòng thay vì dấu phẩy
                                        (existing, replacement) -> existing + "<br>" + replacement))));

        return ResponseEntity.ok(roster);
    }

}