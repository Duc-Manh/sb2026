const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

// Find the saveTeamExcel success block and add renderAttendanceTable()
if (content.includes("alert('Lưu bảng chấm công kíp thành công!');") && !content.includes("renderAttendanceTable();\n              btn.innerText = oldText;")) {
    content = content.replace(
        "alert('Lưu bảng chấm công kíp thành công!');",
        "alert('Lưu bảng chấm công kíp thành công!');\n              renderAttendanceTable();"
    );
    fs.writeFileSync(filePath, content);
    console.log("Updated pxvhtruongca.html with renderAttendanceTable()");
} else {
    console.log("Already updated or couldn't find the target string.");
}
