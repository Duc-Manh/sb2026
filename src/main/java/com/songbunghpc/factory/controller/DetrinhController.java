package com.songbunghpc.factory.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.*;

@RestController
@RequestMapping("/api/detrinh")
public class DetrinhController {

    private final String EXCEL_FILE = "database/detrinhchamcong.xlsx";

    private synchronized Workbook getWorkbook() throws Exception {
        File file = new File(EXCEL_FILE);
        if (!file.exists()) {
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Data");
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("id");
            headerRow.createCell(1).setCellValue("taikhoan");
            headerRow.createCell(2).setCellValue("hoten");
            headerRow.createCell(3).setCellValue("thoigian");
            headerRow.createCell(4).setCellValue("chapnhan");
            headerRow.createCell(5).setCellValue("tuchoi");
            headerRow.createCell(6).setCellValue("thangnam");
            FileOutputStream fos = new FileOutputStream(file);
            workbook.write(fos);
            fos.close();
            return workbook;
        }
        return new XSSFWorkbook(new FileInputStream(file));
    }

    private synchronized void saveWorkbook(Workbook workbook) throws Exception {
        FileOutputStream fos = new FileOutputStream(EXCEL_FILE);
        workbook.write(fos);
        fos.close();
        workbook.close();
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody Map<String, String> payload) {
        try {
            String taikhoan = payload.get("taikhoan");
            String hoten = payload.get("hoten");
            String thoigian = payload.get("thoigian");
            String thangnam = payload.get("thangnam");

            Workbook workbook = getWorkbook();
            Sheet sheet = workbook.getSheetAt(0);

            int lastRow = sheet.getLastRowNum();
            int maxId = 0;
            if (lastRow > 0) {
                Row prevRow = sheet.getRow(lastRow);
                if (prevRow != null && prevRow.getCell(0) != null) {
                    try {
                        maxId = (int) prevRow.getCell(0).getNumericCellValue();
                    } catch(Exception e) {
                        try {
                            maxId = Integer.parseInt(prevRow.getCell(0).getStringCellValue());
                        } catch(Exception ex) {}
                    }
                }
            }
            int newId = maxId + 1;

            Row newRow = sheet.createRow(lastRow + 1);
            newRow.createCell(0).setCellValue(newId);
            newRow.createCell(1).setCellValue(taikhoan != null ? taikhoan : "");
            newRow.createCell(2).setCellValue(hoten != null ? hoten : "");
            newRow.createCell(3).setCellValue(thoigian != null ? thoigian : "");
            newRow.createCell(4).setCellValue(0);
            newRow.createCell(5).setCellValue(0);
            newRow.createCell(6).setCellValue(thangnam != null ? thangnam : "");

            saveWorkbook(workbook);

            return ResponseEntity.ok(Map.of("message", "Đã đệ trình thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> list() {
        try {
            File file = new File(EXCEL_FILE);
            if (!file.exists()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            Workbook workbook = new XSSFWorkbook(new FileInputStream(file));
            Sheet sheet = workbook.getSheetAt(0);
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, Object> data = new HashMap<>();
                data.put("id", getNumericOrStringVal(row.getCell(0)));
                data.put("taikhoan", getStringVal(row.getCell(1)));
                data.put("hoten", getStringVal(row.getCell(2)));
                data.put("thoigian", getStringVal(row.getCell(3)));
                data.put("chapnhan", getNumericOrStringVal(row.getCell(4)));
                data.put("tuchoi", getNumericOrStringVal(row.getCell(5)));
                data.put("thangnam", getStringVal(row.getCell(6)));
                
                result.add(data);
            }
            workbook.close();

            // Sắp xếp ID lớn nhất lên đầu (Mới nhất lên đầu)
            result.sort((a, b) -> {
                int idA = Integer.parseInt(a.get("id").toString());
                int idB = Integer.parseInt(b.get("id").toString());
                return Integer.compare(idB, idA);
            });

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    @PostMapping("/action")
    public ResponseEntity<?> action(@RequestBody Map<String, Object> payload) {
        try {
            int id = Integer.parseInt(payload.get("id").toString());
            String actionType = (String) payload.get("action"); // "approve" or "reject"

            Workbook workbook = getWorkbook();
            Sheet sheet = workbook.getSheetAt(0);

            boolean found = false;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                int rowId = Integer.parseInt(getNumericOrStringVal(row.getCell(0)).toString());
                if (rowId == id) {
                    found = true;
                    if ("approve".equals(actionType)) {
                        if (row.getCell(4) == null) row.createCell(4);
                        row.getCell(4).setCellValue(1);
                    } else if ("reject".equals(actionType)) {
                        if (row.getCell(5) == null) row.createCell(5);
                        row.getCell(5).setCellValue(1);
                    }
                    break;
                }
            }

            if (found) {
                saveWorkbook(workbook);
                return ResponseEntity.ok(Map.of("message", "Thành công"));
            } else {
                workbook.close();
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy yêu cầu"));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    private String getStringVal(Cell cell) {
        if (cell == null) return "";
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return String.valueOf(cell.getNumericCellValue());
            }
            return cell.getStringCellValue();
        } catch(Exception e) {
            return "";
        }
    }

    private Object getNumericOrStringVal(Cell cell) {
        if (cell == null) return 0;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            }
            return Integer.parseInt(cell.getStringCellValue());
        } catch (Exception e) {
            return 0;
        }
    }
}
