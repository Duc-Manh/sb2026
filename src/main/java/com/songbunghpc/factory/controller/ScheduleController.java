package com.songbunghpc.factory.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.songbunghpc.factory.entity.ScheduleRecord;
import com.songbunghpc.factory.repository.ScheduleExcelRepository;
import com.songbunghpc.factory.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    @Autowired
    private LoginService loginService;

    @Autowired
    private com.songbunghpc.factory.repository.LoginRepository loginRepository;

    @Autowired
    private ScheduleExcelRepository scheduleExcelRepository;

    private final ObjectMapper mapper = new ObjectMapper();
    private static final String DB_DIR = "database/schedule/";

    public ScheduleController() {
        File dir = new File(DB_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    private File getFile(String prefix, String factory, String thangNam) {
        String safeThangNam = thangNam.replace("/", "-");
        return new File(DB_DIR + prefix + "_" + factory.toLowerCase().trim() + "_" + safeThangNam + ".json");
    }

    private Map<String, Object> readData(File file) {
        if (!file.exists()) return new HashMap<>();
        try {
            return mapper.readValue(file, new TypeReference<Map<String, Object>>() {});
        } catch (IOException e) {
            return new HashMap<>();
        }
    }

    private void writeData(File file, Map<String, Object> data) throws IOException {
        mapper.writeValue(file, data);
    }

    @GetMapping("/get-attendance/{factory}/{thangNam}")
    public ResponseEntity<?> getAttendance(@PathVariable String factory, @PathVariable String thangNam) {
        File file = getFile("chamcong", factory, thangNam);
        if (!file.exists()) {
            return ResponseEntity.ok(Map.of("data", ""));
        }
        Map<String, Object> row = readData(file);
        return ResponseEntity.ok(Map.of(
            "data", row.getOrDefault("content", ""),
            "hotennop", row.getOrDefault("hotennop", ""),
            "thoigiannop", row.getOrDefault("thoigiannop", "")
        ));
    }

    @PostMapping("/attendance-action/{factory}")
    public ResponseEntity<?> handleAttendance(@PathVariable String factory, @RequestBody Map<String, Object> payload) {
        String thangNam = (String) payload.get("thangNam");
        String content = (String) payload.get("content");
        String userName = (String) payload.get("hoten");
        String timeStr = (String) payload.get("time");
        String mode = (String) payload.get("mode");

        File file = getFile("chamcong", factory, thangNam);
        boolean exists = file.exists();
        Map<String, Object> data = readData(file);

        try {
            if ("create".equals(mode)) {
                if (exists) return ResponseEntity.status(400).body(Map.of("message", "Bạn đã tạo bảng này rồi"));
                data.put("thang_nam", thangNam);
                data.put("content", content);
                data.put("hotentaobang", userName);
                data.put("thoigiantaobang", timeStr);
                writeData(file, data);
                return ResponseEntity.ok(Map.of("message", "Tạo bảng thành công"));
            } else {
                if (!exists) return ResponseEntity.status(400).body(Map.of("message", "Bạn chưa tạo bảng"));
                data.put("content", content);
                data.put("hotenluu", userName);
                data.put("thoigianluu", timeStr);
                writeData(file, data);
                return ResponseEntity.ok(Map.of("message", "Lưu bảng thành công"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    private String getColumnName(int index) {
        StringBuilder columnName = new StringBuilder();
        while (index >= 0) {
            columnName.insert(0, (char) ('A' + (index % 26)));
            index = (index / 26) - 1;
        }
        return columnName.toString();
    }

    @PostMapping("/create-excel-attendance/{factory}")
    public ResponseEntity<?> createExcelAttendance(@PathVariable String factory, @RequestBody Map<String, String> payload) {
        String thangNam = payload.get("thangNam");
        if (thangNam == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tháng năm"));
        
        String[] parts = thangNam.split("-");
        if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng năm sai"));
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        
        String sheetName = "t" + month + "-" + year;
        String filePath = "database/pxvhchamcong.xlsx";
        
        java.io.File file = new java.io.File(filePath);
        org.apache.poi.ss.usermodel.Workbook workbook = null;
        java.io.FileInputStream fis = null;
        java.io.FileOutputStream fos = null;
        try {
            if (file.exists()) {
                fis = new java.io.FileInputStream(file);
                workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(fis);
            } else {
                workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            }
            
            if (workbook.getSheet(sheetName) != null) {
                if (fis != null) fis.close();
                workbook.close();
                return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã tạo bảng chấm công rồi"));
            }
            
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet(sheetName);
            
            java.time.YearMonth yearMonthObject = java.time.YearMonth.of(year, month);
            int daysInMonth = yearMonthObject.lengthOfMonth();
            
            int LV = 3 + daysInMonth;
            
            // Styles
            org.apache.poi.ss.usermodel.CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            borderStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            borderStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            borderStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            borderStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            borderStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            borderStyle.setWrapText(true);
            
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.cloneStyleFrom(borderStyle);
            org.apache.poi.ss.usermodel.Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            headerStyle.setFont(boldFont);
            
            // Row 0
            org.apache.poi.ss.usermodel.Row row0 = sheet.createRow(0);
            row0.createCell(15).setCellValue("KO XÓA CỘT DO CÓ CÔNG THỨC TÍNH CÔNG!");
            row0.createCell(LV + 2).setCellValue("Giờ tiêu chuẩn TC:");
            row0.getCell(LV + 2).setCellStyle(boldFont != null ? headerStyle : borderStyle);
            org.apache.poi.ss.usermodel.Cell cAM1_8 = row0.createCell(LV + 3);
            cAM1_8.setCellFormula(getColumnName(LV + 5) + "1*8");
            row0.createCell(LV + 4).setCellValue("Công TC:");
            row0.getCell(LV + 4).setCellStyle(headerStyle);
            row0.createCell(LV + 5).setCellValue(22.0);
            
            // Row 1
            org.apache.poi.ss.usermodel.Row row1 = sheet.createRow(1);
            row1.setHeight((short) 800);
            
            String[] headers = {"STT", "Họ tên nhân viên"};
            for (int i = 0; i < 2; i++) {
                org.apache.poi.ss.usermodel.Cell c = row1.createCell(i + 1);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }
            
            for (int d = 1; d <= daysInMonth; d++) {
                org.apache.poi.ss.usermodel.Cell c = row1.createCell(d + 2);
                java.time.DayOfWeek dow = java.time.LocalDate.of(year, month, d).getDayOfWeek();
                if (dow == java.time.DayOfWeek.SATURDAY) {
                    c.setCellValue("T7");
                } else if (dow == java.time.DayOfWeek.SUNDAY) {
                    c.setCellValue("CN");
                } else {
                    c.setCellValue((double)d);
                }
                c.setCellStyle(headerStyle);
            }
            
            String[] calcHeaders = {
                "LV\n(1)", "KK\n(2)", "Tổng giờ\n(3)=(1)+(2)", "Chênh lệch so với GIỜ TC\n(4)=(3)-TC",
                "Tổng công\n(5)=(3)/8", "Chênh lệch so với CÔNG TC\n(6)=(5)-TC"
            };
            for (int i = 0; i < calcHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell c = row1.createCell(LV + i);
                c.setCellValue(calcHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            
            java.util.List<com.songbunghpc.factory.entity.Login> allEmps = loginRepository.findAll();
            java.util.List<com.songbunghpc.factory.entity.Login> factoryEmps = new java.util.ArrayList<>(allEmps);
            
            int currentRowIdx = 2;
            int stt = 1;
            for (com.songbunghpc.factory.entity.Login emp : factoryEmps) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(currentRowIdx++);
                org.apache.poi.ss.usermodel.Cell cSTT = row.createCell(1); cSTT.setCellValue((double)stt++); cSTT.setCellStyle(borderStyle);
                org.apache.poi.ss.usermodel.Cell cName = row.createCell(2); cName.setCellValue(emp.getHoten()); cName.setCellStyle(borderStyle);
                
                for (int d = 1; d <= daysInMonth; d++) {
                    org.apache.poi.ss.usermodel.Cell cDay = row.createCell(d + 2);
                    cDay.setCellStyle(borderStyle);
                }
                
                StringBuilder midFormula = new StringBuilder();
                for (int d = 0; d < daysInMonth; d++) {
                    if (d > 0) midFormula.append("+");
                    midFormula.append("MID(").append(getColumnName(3 + d)).append(currentRowIdx).append(",1,2)");
                }
                
                org.apache.poi.ss.usermodel.Cell cLV = row.createCell(LV);
                cLV.setCellFormula(midFormula.toString());
                cLV.setCellStyle(borderStyle);
                
                org.apache.poi.ss.usermodel.Cell cKK = row.createCell(LV + 1);
                cKK.setCellStyle(borderStyle); // empty initially
                
                org.apache.poi.ss.usermodel.Cell cTongGio = row.createCell(LV + 2);
                cTongGio.setCellFormula(getColumnName(LV) + currentRowIdx + "+" + getColumnName(LV + 1) + currentRowIdx);
                cTongGio.setCellStyle(borderStyle);
                
                org.apache.poi.ss.usermodel.Cell cChenhGio = row.createCell(LV + 3);
                cChenhGio.setCellFormula(getColumnName(LV + 2) + currentRowIdx + "-$" + getColumnName(LV + 3) + "$1");
                cChenhGio.setCellStyle(borderStyle);
                
                org.apache.poi.ss.usermodel.Cell cTongCong = row.createCell(LV + 4);
                cTongCong.setCellFormula(getColumnName(LV + 2) + currentRowIdx + "/8");
                cTongCong.setCellStyle(borderStyle);
                
                org.apache.poi.ss.usermodel.Cell cChenhCong = row.createCell(LV + 5);
                cChenhCong.setCellFormula(getColumnName(LV + 4) + currentRowIdx + "-$" + getColumnName(LV + 5) + "$1");
                cChenhCong.setCellStyle(borderStyle);
            }
            
            // Auto size columns
            sheet.setColumnWidth(2, 6000); // Tên nhân viên
            for (int i = 0; i < calcHeaders.length; i++) {
                sheet.setColumnWidth(LV + i, 3500);
            }
            
            if (fis != null) fis.close();
            fos = new java.io.FileOutputStream(file);
            workbook.write(fos);
            return ResponseEntity.ok(Map.of("message", "Tạo bảng thành công"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        } finally {
            try {
                if (workbook != null) workbook.close();
                if (fis != null) fis.close();
                if (fos != null) fos.close();
            } catch (Exception ex) {}
        }
    }

    @GetMapping("/get-personal-excel/{monthKey}/{hoten}")
    public ResponseEntity<?> getPersonalExcel(@PathVariable String monthKey, @PathVariable String hoten) {
        String[] parts = monthKey.split("-");
        if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng không hợp lệ"));
        String sheetName = "t" + Integer.parseInt(parts[1]) + "-" + parts[0];

        java.io.File file = new java.io.File("database/pxvhchamcong.xlsx");
        if (!file.exists()) return ResponseEntity.ok(Map.of("days", new HashMap<>()));

        try (java.io.FileInputStream fis = new java.io.FileInputStream(file);
             org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(fis)) {
            
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Bảng chấm công tháng này chưa được tạo"));
            }

            int daysInMonth = java.time.YearMonth.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1])).lengthOfMonth();
            Map<String, String> daysData = new HashMap<>();

            for (org.apache.poi.ss.usermodel.Row row : sheet) {
                org.apache.poi.ss.usermodel.Cell nameCell = row.getCell(2);
                if (nameCell != null && nameCell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                    if (hoten.equals(nameCell.getStringCellValue().trim())) {
                        for (int i = 1; i <= daysInMonth; i++) {
                            org.apache.poi.ss.usermodel.Cell c = row.getCell(2 + i);
                            if (c != null) {
                                c.setCellType(org.apache.poi.ss.usermodel.CellType.STRING);
                                String val = c.getStringCellValue();
                                if (val != null && !val.trim().isEmpty()) {
                                    daysData.put(String.valueOf(i), val.trim());
                                }
                            }
                        }
                        break;
                    }
                }
            }
            return ResponseEntity.ok(Map.of("days", daysData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đọc file Excel: " + e.getMessage()));
        }
    }

    @PostMapping("/save-personal-excel")
    public synchronized ResponseEntity<?> savePersonalExcel(@RequestBody Map<String, Object> payload) {
        String monthKey = (String) payload.get("monthKey");
        String hoten = (String) payload.get("hoten");
        Map<String, String> daysData = (Map<String, String>) payload.get("days");

        String[] parts = monthKey.split("-");
        if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng không hợp lệ"));
        String sheetName = "t" + Integer.parseInt(parts[1]) + "-" + parts[0];

        java.io.File file = new java.io.File("database/pxvhchamcong.xlsx");
        if (!file.exists()) return ResponseEntity.status(404).body(Map.of("message", "File pxvhchamcong.xlsx không tồn tại"));

        java.io.FileInputStream fis = null;
        java.io.FileOutputStream fos = null;
        org.apache.poi.ss.usermodel.Workbook workbook = null;
        try {
            fis = new java.io.FileInputStream(file);
            workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(fis);
            
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Bảng chấm công tháng này chưa được tạo. Vui lòng nhờ admin tạo bảng trước!"));
            }

            int daysInMonth = java.time.YearMonth.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1])).lengthOfMonth();
            boolean found = false;

            for (org.apache.poi.ss.usermodel.Row row : sheet) {
                org.apache.poi.ss.usermodel.Cell nameCell = row.getCell(2);
                if (nameCell != null && nameCell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                    if (hoten.equals(nameCell.getStringCellValue().trim())) {
                        found = true;
                        for (int i = 1; i <= daysInMonth; i++) {
                            org.apache.poi.ss.usermodel.Cell c = row.getCell(2 + i);
                            if (c == null) c = row.createCell(2 + i);
                            String val = daysData.get(String.valueOf(i));
                            if (val != null && !val.trim().isEmpty()) {
                                c.setCellValue(val.trim());
                            } else {
                                c.setCellValue("");
                            }
                        }
                        break;
                    }
                }
            }

            if (!found) {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy nhân viên trong bảng tháng này. Vui lòng nhờ admin tạo lại bảng!"));
            }

            // Force recalculate formulas
            org.apache.poi.ss.usermodel.FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            evaluator.clearAllCachedResultValues();

            fis.close();
            fis = null;
            fos = new java.io.FileOutputStream(file);
            workbook.write(fos);

            return ResponseEntity.ok(Map.of("message", "Lưu chấm công cá nhân thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lưu file Excel: " + e.getMessage()));
        } finally {
            try {
                if (workbook != null) workbook.close();
                if (fis != null) fis.close();
                if (fos != null) fos.close();
            } catch (Exception ex) {}
        }
    }

    @PostMapping("/submit-final/{factoryCode}")
    public ResponseEntity<?> submitFinal(@PathVariable String factoryCode, @RequestBody Map<String, String> body) {
        String user = body.get("user");
        String pass = body.get("password");
        String thangNam = body.get("thangNam");
        String hotennop = body.get("hotennop");
        String thoigiannop = body.get("thoigiannop");

        String auth = loginService.authenticate(user, pass, "8X2P"); 
        if (!"SUCCESS".equals(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Mật khẩu xác nhận không chính xác!"));
        }

        File file = getFile("chamcong", factoryCode, thangNam);
        if (!file.exists()) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy dữ liệu tháng để nộp!"));
        }

        try {
            Map<String, Object> data = readData(file);
            data.put("hotennop", hotennop);
            data.put("thoigiannop", thoigiannop);
            writeData(file, data);
            return ResponseEntity.ok(Map.of("message", "Thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/get/{factory}/{thangNam}")
    public ResponseEntity<?> getSchedule(@PathVariable String factory, @PathVariable String thangNam) {
        java.util.Optional<ScheduleRecord> record = scheduleExcelRepository.findByThangNam(factory, thangNam);
        if (record.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "data", record.get().getDataJson() != null ? record.get().getDataJson() : "",
                "doica", record.get().getDoica() != null ? record.get().getDoica() : "",
                "kip_truc", record.get().getKipTruc() != null ? record.get().getKipTruc() : "",
                "truc_dap", record.get().getTrucDap() != null ? record.get().getTrucDap() : ""
            ));
        } else {
            return ResponseEntity.ok(Map.of("data", "", "doica", "", "kip_truc", "", "truc_dap", ""));
        }
    }

    @PostMapping("/save/{factory}")
    public ResponseEntity<?> saveSchedule(@PathVariable String factory, @RequestBody Map<String, Object> payload) {
        String thangNam = (String) payload.get("thangNam");
        String content = (String) payload.get("content");
        String kipTruc = (String) payload.get("kipTruc");
        String doiCa = (String) payload.get("doiCa");
        String trucDap = (String) payload.get("trucDap");

        try {
            java.util.Optional<ScheduleRecord> optRecord = scheduleExcelRepository.findByThangNam(factory, thangNam);
            ScheduleRecord record = optRecord.orElseGet(ScheduleRecord::new);
            
            record.setThangNam(thangNam);
            if (content != null) record.setDataJson(content);
            if (kipTruc != null) record.setKipTruc(kipTruc);
            if (doiCa != null) record.setDoica(doiCa);
            if (trucDap != null) record.setTrucDap(trucDap);
            
            boolean exists = optRecord.isPresent();
            if (!exists) {
                record.setNgayTao(String.valueOf(System.currentTimeMillis()));
            }

            scheduleExcelRepository.save(factory, record);
            return ResponseEntity.ok(Map.of("message", exists ? "Cập nhật dữ liệu thành công" : "Tạo mới dữ liệu thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi Server: " + e.getMessage()));
        }
    }

    @PostMapping("/save-doica/{factory}")
    public ResponseEntity<?> saveDoiCa(@PathVariable String factory, @RequestBody Map<String, String> payload) {
        String monthYear = payload.get("thangNam");
        String content = payload.get("doica");

        try {
            java.util.Optional<ScheduleRecord> optRecord = scheduleExcelRepository.findByThangNam(factory, monthYear);
            ScheduleRecord record = optRecord.orElseGet(ScheduleRecord::new);

            record.setThangNam(monthYear);
            record.setDoica(content);

            boolean exists = optRecord.isPresent();
            if (!exists) {
                record.setNgayTao(String.valueOf(System.currentTimeMillis()));
            }

            scheduleExcelRepository.save(factory, record);
            return ResponseEntity.ok(Map.of("message", exists ? "Đã lưu thông tin đổi ca" : "Đã tạo mới và lưu thông tin đổi ca"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/get-excel-attendance-all/{monthKey}")
    public ResponseEntity<?> getExcelAttendanceAll(@PathVariable String monthKey) {
        String[] parts = monthKey.split("-");
        if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng không hợp lệ"));
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        String sheetName = "t" + month + "-" + year;

        java.io.File file = new java.io.File("database/pxvhchamcong.xlsx");
        if (!file.exists()) return ResponseEntity.ok(Map.of("data", new java.util.ArrayList<>()));

        try (java.io.FileInputStream fis = new java.io.FileInputStream(file);
             org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(fis)) {
             
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Bảng chấm công tháng này chưa được tạo"));
            }

            int daysInMonth = java.time.YearMonth.of(year, month).lengthOfMonth();
            int LV = 3 + daysInMonth;

            org.apache.poi.ss.usermodel.FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();

            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();

            for (int i = 2; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null) continue;
                
                org.apache.poi.ss.usermodel.Cell nameCell = row.getCell(2);
                if (nameCell == null || nameCell.getCellType() != org.apache.poi.ss.usermodel.CellType.STRING) continue;
                String name = nameCell.getStringCellValue().trim();
                if (name.isEmpty()) continue;

                Map<String, Object> empData = new HashMap<>();
                empData.put("hoten", name);
                
                Map<String, String> daysData = new HashMap<>();
                for (int d = 1; d <= daysInMonth; d++) {
                    org.apache.poi.ss.usermodel.Cell c = row.getCell(2 + d);
                    String val = "";
                    if (c != null) {
                        try {
                            if (c.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
                                double num = c.getNumericCellValue();
                                if (num == Math.floor(num)) {
                                    val = String.valueOf((int)num);
                                } else {
                                    val = String.valueOf(num);
                                }
                            } else {
                                c.setCellType(org.apache.poi.ss.usermodel.CellType.STRING);
                                val = c.getStringCellValue();
                            }
                        } catch(Exception ignored) {}
                    }
                    daysData.put(String.valueOf(d), val != null ? val.trim() : "");
                }
                empData.put("days", daysData);

                String[] calcs = new String[6];
                for (int cIdx = 0; cIdx < 6; cIdx++) {
                    org.apache.poi.ss.usermodel.Cell c = row.getCell(LV + cIdx);
                    String val = "";
                    if (c != null) {
                        try {
                            org.apache.poi.ss.usermodel.CellValue cellValue = evaluator.evaluate(c);
                            if (cellValue != null) {
                                if (cellValue.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
                                    double num = cellValue.getNumberValue();
                                    val = String.format(java.util.Locale.US, "%.2f", num).replace(".00", "");
                                } else if (cellValue.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                                    val = cellValue.getStringValue();
                                }
                            } else {
                                if (c.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
                                    double num = c.getNumericCellValue();
                                    val = String.format(java.util.Locale.US, "%.2f", num).replace(".00", "");
                                } else if (c.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                                    val = c.getStringCellValue();
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    calcs[cIdx] = val;
                }
                empData.put("calcs", calcs);
                
                result.add(empData);
            }

            // Sắp xếp result theo thứ tự trong login.xlsx
            java.util.List<com.songbunghpc.factory.entity.Login> allEmps = loginRepository.findAll();
            java.util.Map<String, Integer> orderMap = new HashMap<>();
            int idx = 0;
            for (com.songbunghpc.factory.entity.Login emp : allEmps) {
                orderMap.put(emp.getHoten(), idx++);
            }

            result.sort((m1, m2) -> {
                String name1 = (String) m1.get("hoten");
                String name2 = (String) m2.get("hoten");
                Integer idx1 = orderMap.getOrDefault(name1, Integer.MAX_VALUE);
                Integer idx2 = orderMap.getOrDefault(name2, Integer.MAX_VALUE);
                return idx1.compareTo(idx2);
            });

            return ResponseEntity.ok(Map.of("data", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đọc file Excel: " + e.getMessage()));
        }
    }

    @PostMapping("/save-excel-attendance-all")
    public synchronized ResponseEntity<?> saveExcelAttendanceAll(@RequestBody Map<String, Object> payload) {
        String monthKey = (String) payload.get("monthKey");
        java.util.List<Map<String, Object>> data = (java.util.List<Map<String, Object>>) payload.get("data");

        String[] parts = monthKey.split("-");
        if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng không hợp lệ"));
        String sheetName = "t" + Integer.parseInt(parts[1]) + "-" + parts[0];

        java.io.File file = new java.io.File("database/pxvhchamcong.xlsx");
        if (!file.exists()) return ResponseEntity.status(404).body(Map.of("message", "File pxvhchamcong.xlsx không tồn tại"));

        java.io.FileInputStream fis = null;
        java.io.FileOutputStream fos = null;
        org.apache.poi.ss.usermodel.Workbook workbook = null;
        try {
            fis = new java.io.FileInputStream(file);
            workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(fis);
            
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Bảng chấm công tháng này chưa được tạo!"));
            }

            int daysInMonth = java.time.YearMonth.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1])).lengthOfMonth();

            for (Map<String, Object> empData : data) {
                String hoten = (String) empData.get("hoten");
                Map<String, String> daysData = (Map<String, String>) empData.get("days");

                for (org.apache.poi.ss.usermodel.Row row : sheet) {
                    org.apache.poi.ss.usermodel.Cell nameCell = row.getCell(2);
                    if (nameCell != null && nameCell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                        if (hoten.equals(nameCell.getStringCellValue().trim())) {
                            for (int i = 1; i <= daysInMonth; i++) {
                                org.apache.poi.ss.usermodel.Cell c = row.getCell(2 + i);
                                if (c == null) c = row.createCell(2 + i);
                                String val = daysData.get(String.valueOf(i));
                                if (val != null && !val.trim().isEmpty()) {
                                    c.setCellValue(val.trim());
                                } else {
                                    c.setCellValue("");
                                }
                            }
                            break;
                        }
                    }
                }
            }

            org.apache.poi.ss.usermodel.FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            evaluator.clearAllCachedResultValues();

            fis.close();
            fis = null;
            fos = new java.io.FileOutputStream(file);
            workbook.write(fos);

            return ResponseEntity.ok(Map.of("message", "Lưu chỉnh sửa bảng chấm công thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lưu file Excel: " + e.getMessage()));
        } finally {
            try {
                if (workbook != null) workbook.close();
                if (fis != null) fis.close();
                if (fos != null) fos.close();
            } catch (Exception ex) {}
        }
    }
}