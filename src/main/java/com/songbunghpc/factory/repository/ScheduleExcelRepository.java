package com.songbunghpc.factory.repository;

import com.songbunghpc.factory.repository.ScheduleExcelRepository;
import com.songbunghpc.factory.entity.ScheduleRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Repository;

import java.io.*;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Repository
public class ScheduleExcelRepository {

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private String getFilePath(String factory) {
        return "database/lichtruc" + factory.toLowerCase() + ".xlsx";
    }

    private String getSheetName(String factory) {
        return "lichtruc" + factory.toLowerCase();
    }

    private void initFile(String factory) {
        File dir = new File("database");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        String filePath = getFilePath(factory);
        File file = new File(filePath);
        if (!file.exists()) {
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet(getSheetName(factory));
                Row headerRow = sheet.createRow(0);
                String[] columns = {"id", "thang_nam", "data_json", "doica", "kip_truc", "ngay_tao", "truc_dap"};
                for (int i = 0; i < columns.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(columns[i]);
                }
                try (FileOutputStream fileOut = new FileOutputStream(filePath)) {
                    workbook.write(fileOut);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public ScheduleExcelRepository() {
        initFile("sb2");
        initFile("sb4");
    }

    public Optional<ScheduleRecord> findByThangNam(String factory, String thangNam) {
        lock.readLock().lock();
        try (FileInputStream fis = new FileInputStream(getFilePath(factory));
             Workbook workbook = new XSSFWorkbook(fis)) {
            Sheet sheet = workbook.getSheet(getSheetName(factory));
            if (sheet == null) return Optional.empty();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    ScheduleRecord record = parseRow(row);
                    if (record != null && thangNam.equals(record.getThangNam())) {
                        return Optional.of(record);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.readLock().unlock();
        }
        return Optional.empty();
    }

    public void save(String factory, ScheduleRecord record) {
        lock.writeLock().lock();
        try {
            initFile(factory); // ensure file exists
            String filePath = getFilePath(factory);
            try (FileInputStream fis = new FileInputStream(filePath);
                 Workbook workbook = new XSSFWorkbook(fis)) {
                
                Sheet sheet = workbook.getSheet(getSheetName(factory));
                if (sheet == null) sheet = workbook.createSheet(getSheetName(factory));

                if (record.getId() == null) {
                    // Insert new
                    long maxId = 0;
                    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        Row r = sheet.getRow(i);
                        if (r != null) {
                            Cell idCell = r.getCell(0);
                            if (idCell != null) {
                                try {
                                    long currentId = (long) idCell.getNumericCellValue();
                                    if (currentId > maxId) maxId = currentId;
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                    record.setId(maxId + 1);
                    Row newRow = sheet.createRow(sheet.getLastRowNum() + 1);
                    updateRow(newRow, record);
                } else {
                    // Update
                    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        Row r = sheet.getRow(i);
                        if (r != null) {
                            Cell idCell = r.getCell(0);
                            if (idCell != null) {
                                try {
                                    long currentId = (long) idCell.getNumericCellValue();
                                    if (currentId == record.getId()) {
                                        updateRow(r, record);
                                        break;
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }

                try (FileOutputStream fos = new FileOutputStream(filePath)) {
                    workbook.write(fos);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private ScheduleRecord parseRow(Row row) {
        ScheduleRecord record = new ScheduleRecord();
        try {
            Cell idCell = row.getCell(0);
            if (idCell == null) return null;
            record.setId((long) idCell.getNumericCellValue());
            record.setThangNam(getCellValueAsString(row.getCell(1)));
            record.setDataJson(getCellValueAsString(row.getCell(2)));
            record.setDoica(getCellValueAsString(row.getCell(3)));
            record.setKipTruc(getCellValueAsString(row.getCell(4)));
            record.setNgayTao(getCellValueAsString(row.getCell(5)));
            record.setTrucDap(getCellValueAsString(row.getCell(6)));
            return record;
        } catch (Exception e) {
            return null;
        }
    }

    private void updateRow(Row row, ScheduleRecord record) {
        Cell c0 = row.createCell(0); c0.setCellValue(record.getId());
        Cell c1 = row.createCell(1); c1.setCellValue(record.getThangNam() != null ? record.getThangNam() : "");
        Cell c2 = row.createCell(2); c2.setCellValue(record.getDataJson() != null ? record.getDataJson() : "");
        Cell c3 = row.createCell(3); c3.setCellValue(record.getDoica() != null ? record.getDoica() : "");
        Cell c4 = row.createCell(4); c4.setCellValue(record.getKipTruc() != null ? record.getKipTruc() : "");
        Cell c5 = row.createCell(5); c5.setCellValue(record.getNgayTao() != null ? record.getNgayTao() : "");
        Cell c6 = row.createCell(6); c6.setCellValue(record.getTrucDap() != null ? record.getTrucDap() : "");
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        String result = "";
        switch (cell.getCellType()) {
            case STRING: 
                result = cell.getStringCellValue();
                break;
            case NUMERIC: 
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    result = String.valueOf((long)val);
                } else {
                    result = String.valueOf(val);
                }
                break;
            case BOOLEAN: 
                result = String.valueOf(cell.getBooleanCellValue());
                break;
            default: 
                result = "";
        }
        return result != null ? result.trim() : "";
    }
}
