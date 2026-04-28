import java.io.FileInputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.File;

public class TestExcel {
    public static void main(String[] args) throws Exception {
        FileInputStream fis = new FileInputStream(new File("database/pxvhchamcong.xlsx"));
        Workbook workbook = new XSSFWorkbook(fis);
        Sheet sheet = workbook.getSheet("t5-2026");
        if (sheet == null) {
            System.out.println("Sheet not found");
            return;
        }
        for (int r = 0; r < 5; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                Cell cell = row.getCell(c);
                if (cell != null) {
                    System.out.print(cell.toString() + " | ");
                } else {
                    System.out.print("NULL | ");
                }
            }
            System.out.println();
        }
        workbook.close();
        fis.close();
    }
}
