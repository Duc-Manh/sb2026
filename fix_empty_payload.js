const fs = require('fs');
const path = require('path');

const files = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html', 'pxvhcansu.html', 'pxvhtruongca.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // For savePersonalExcel
    if (content.includes('savePersonalExcel()')) {
        const target = "const res = await fetch('/api/schedule/save-personal-excel'";
        if (content.includes(target) && !content.includes("Object.keys(payload.days).length === 0")) {
            content = content.replace(target, 
                "if (Object.keys(payload.days).length === 0) {\n" +
                "                      alert('Không có dữ liệu mới để lưu!');\n" +
                "                      btn.innerText = oldText;\n" +
                "                      btn.disabled = false;\n" +
                "                      return;\n" +
                "                  }\n                  " + target);
            fs.writeFileSync(filePath, content);
            console.log('Fixed empty payload skip in ' + file);
        }
    }

    // For saveTeamExcel
    if (content.includes('saveTeamExcel()')) {
        const target = "await fetch('/api/schedule/save-personal-excel', {";
        if (content.includes(target) && !content.includes("Object.keys(payload.days).length === 0")) {
            content = content.replace(target, 
                "if (Object.keys(payload.days).length > 0) {\n                  " + target);
            content = content.replace(/body: JSON\.stringify\(payload\)\n\s*\}\);/g, "body: JSON.stringify(payload)\n                  });\n                  }");
            fs.writeFileSync(filePath, content);
            console.log('Fixed empty payload skip in ' + file);
        }
    }
});
