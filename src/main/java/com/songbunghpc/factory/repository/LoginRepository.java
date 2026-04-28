package com.songbunghpc.factory.repository;

import com.songbunghpc.factory.entity.Login;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Repository;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Repository
public class LoginRepository {

    private static final String FILE_PATH = "database/login.xlsx";
    private static final String SHEET_NAME = "employ";
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public LoginRepository() {
        initFile();
    }

    private void initFile() {
        File dir = new File("database");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File file = new File(FILE_PATH);
        if (!file.exists()) {
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet(SHEET_NAME);
                Row headerRow = sheet.createRow(0);
                String[] columns = {"id", "username", "password", "hoten", "chucdanh", "nhamay", "kip", "sodienthoai", "email", "role"};
                for (int i = 0; i < columns.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(columns[i]);
                }
                try (FileOutputStream fileOut = new FileOutputStream(FILE_PATH)) {
                    workbook.write(fileOut);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public List<Login> findAll() {
        lock.readLock().lock();
        List<Login> list = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(FILE_PATH);
             Workbook workbook = new XSSFWorkbook(fis)) {
            Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet == null) return list;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Login login = parseRow(row);
                    if (login != null) list.add(login);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.readLock().unlock();
        }
        return list;
    }

    public Optional<Login> findByUser(String username) {
        return findAll().stream()
                .filter(l -> username != null && username.equals(l.getUsername()))
                .findFirst();
    }

    public Optional<Login> findById(Long id) {
        return findAll().stream()
                .filter(l -> id != null && id.equals(l.getId()))
                .findFirst();
    }

    public boolean existsById(Long id) {
        return findById(id).isPresent();
    }

    public void save(Login login) {
        lock.writeLock().lock();
        try (FileInputStream fis = new FileInputStream(FILE_PATH);
             Workbook workbook = new XSSFWorkbook(fis)) {
            Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet == null) sheet = workbook.createSheet(SHEET_NAME);

            if (login.getId() == null) {
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
                login.setId(maxId + 1);
                Row newRow = sheet.createRow(sheet.getLastRowNum() + 1);
                updateRow(newRow, login);
            } else {
                // Update
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row r = sheet.getRow(i);
                    if (r != null) {
                        Cell idCell = r.getCell(0);
                        if (idCell != null) {
                            try {
                                long currentId = (long) idCell.getNumericCellValue();
                                if (currentId == login.getId()) {
                                    updateRow(r, login);
                                    break;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }

            try (FileOutputStream fos = new FileOutputStream(FILE_PATH)) {
                workbook.write(fos);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteById(Long id) {
        lock.writeLock().lock();
        try (FileInputStream fis = new FileInputStream(FILE_PATH);
             Workbook workbook = new XSSFWorkbook(fis)) {
            Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet != null) {
                int rowIndexToRemove = -1;
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row r = sheet.getRow(i);
                    if (r != null) {
                        Cell idCell = r.getCell(0);
                        if (idCell != null) {
                            try {
                                long currentId = (long) idCell.getNumericCellValue();
                                if (currentId == id) {
                                    rowIndexToRemove = i;
                                    break;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                }
                if (rowIndexToRemove != -1) {
                    Row r = sheet.getRow(rowIndexToRemove);
                    sheet.removeRow(r);
                    // Shift rows up
                    if (rowIndexToRemove < sheet.getLastRowNum()) {
                        sheet.shiftRows(rowIndexToRemove + 1, sheet.getLastRowNum(), -1);
                    }
                    try (FileOutputStream fos = new FileOutputStream(FILE_PATH)) {
                        workbook.write(fos);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private Login parseRow(Row row) {
        Login login = new Login();
        try {
            Cell idCell = row.getCell(0);
            if (idCell == null) return null;
            login.setId((long) idCell.getNumericCellValue());
            login.setUsername(getCellValueAsString(row.getCell(1)));
            login.setPassword(getCellValueAsString(row.getCell(2)));
            login.setHoten(getCellValueAsString(row.getCell(3)));
            login.setChucdanh(getCellValueAsString(row.getCell(4)));
            login.setNhamay(getCellValueAsString(row.getCell(5)));
            login.setKip(getCellValueAsString(row.getCell(6)));
            login.setSodienthoai(getCellValueAsString(row.getCell(7)));
            login.setEmail(getCellValueAsString(row.getCell(8)));
            login.setRole(getCellValueAsString(row.getCell(9)));
            return login;
        } catch (Exception e) {
            return null;
        }
    }

    private void updateRow(Row row, Login login) {
        Cell c0 = row.createCell(0); c0.setCellValue(login.getId());
        Cell c1 = row.createCell(1); c1.setCellValue(login.getUsername() != null ? login.getUsername() : "");
        Cell c2 = row.createCell(2); c2.setCellValue(login.getPassword() != null ? login.getPassword() : "");
        Cell c3 = row.createCell(3); c3.setCellValue(login.getHoten() != null ? login.getHoten() : "");
        Cell c4 = row.createCell(4); c4.setCellValue(login.getChucdanh() != null ? login.getChucdanh() : "");
        Cell c5 = row.createCell(5); c5.setCellValue(login.getNhamay() != null ? login.getNhamay() : "");
        Cell c6 = row.createCell(6); c6.setCellValue(login.getKip() != null ? login.getKip() : "");
        Cell c7 = row.createCell(7); c7.setCellValue(login.getSodienthoai() != null ? login.getSodienthoai() : "");
        Cell c8 = row.createCell(8); c8.setCellValue(login.getEmail() != null ? login.getEmail() : "");
        Cell c9 = row.createCell(9); c9.setCellValue(login.getRole() != null ? login.getRole() : "");
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        String result = "";
        switch (cell.getCellType()) {
            case STRING: 
                result = cell.getStringCellValue();
                break;
            case NUMERIC: 
                // Return without decimal if it's whole number
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