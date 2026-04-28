const fs = require('fs');
const path = require('path');

const files = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html', 'pxvhcansu.html', 'pxvhtruongca.html', 'pxvhchamcong.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(filePath)) {
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // For lead, dap, cansu: savePersonalExcel() 
    if (file !== 'pxvhtruongca.html') {
        content = content.replace(/alert\(data\.message\);\n                  if \(typeof renderAdminTable === "function"\) renderAdminTable\(\);\n                  if \(typeof renderPersonalTable === "function"\) renderPersonalTable\(\);/g, 'alert(data.message);');
        fs.writeFileSync(filePath, content);
    } else {
        // For truongca: saveTeamExcel()
        content = content.replace(/alert\('Lưu bảng chấm công kíp thành công!'\);\n              if \(typeof renderAttendanceTable === "function"\) renderAttendanceTable\(\);/g, "alert('Lưu bảng chấm công kíp thành công!');");
        
        // Also FIX the bug where it doesn't save! `thangNam: monthKey` should be `monthKey: monthKey`
        content = content.replace(/thangNam: monthKey,/g, 'monthKey: monthKey,');
        fs.writeFileSync(filePath, content);
    }
    console.log('Reverted ' + file);
});
