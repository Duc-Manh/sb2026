const fs = require('fs');
const path = require('path');

const files = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html', 'pxvhcansu.html', 'pxvhtruongca.html', 'pxvhchamcong.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(filePath)) {
        console.log(file + ' not found');
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // For lead, dap, cansu: savePersonalExcel() 
    if (file !== 'pxvhtruongca.html') {
        if (content.includes('savePersonalExcel()')) {
            // Find the success block: alert(data.message);
            // Replace with: alert(data.message); renderAdminTable(); renderPersonalTable();
            if (content.includes('alert(data.message);') && !content.includes('alert(data.message);\n                  renderAdminTable();')) {
                // Notice there are two alert(data.message) depending on if btn exists
                content = content.replace(/alert\(data\.message\);/g, 'alert(data.message);\n                  if (typeof renderAdminTable === "function") renderAdminTable();\n                  if (typeof renderPersonalTable === "function") renderPersonalTable();');
                fs.writeFileSync(filePath, content);
                console.log('Fixed ' + file);
            }
        }
    } else {
        // For truongca: saveTeamExcel()
        if (content.includes('saveTeamExcel()')) {
            if (content.includes("alert('Lưu bảng chấm công kíp thành công!');") && !content.includes("alert('Lưu bảng chấm công kíp thành công!');\n              renderAttendanceTable();")) {
                content = content.replace(/alert\('Lưu bảng chấm công kíp thành công!'\);/g, "alert('Lưu bảng chấm công kíp thành công!');\n              if (typeof renderAttendanceTable === \"function\") renderAttendanceTable();");
                fs.writeFileSync(filePath, content);
                console.log('Fixed ' + file);
            }
        }
    }
});
