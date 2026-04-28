const fs = require('fs');
const path = require('path');

const files = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html', 'pxvhcansu.html', 'pxvhtruongca.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add oninput handler to inputs generated in JS
    if (content.includes('id="personal-day-${d}"') && !content.includes('oninput="this.dataset.changed=\'true\'"')) {
        content = content.replace(/id="personal-day-\${d}"/g, 'id="personal-day-${d}" oninput="this.dataset.changed=\'true\'"');
        modified = true;
    }
    // For pxvhtruongca.html
    if (content.includes('id="personal-day-${emp.user}-${d}"') && !content.includes('oninput="this.dataset.changed=\'true\'"')) {
        content = content.replace(/id="personal-day-\${emp\.user}-\${d}"/g, 'id="personal-day-${emp.user}-${d}" oninput="this.dataset.changed=\'true\'"');
        modified = true;
    }

    // Modify the payload logic in savePersonalExcel
    if (content.includes('savePersonalExcel()')) {
        const regex1 = /for\s*\(\s*let\s*d\s*=\s*1\s*;\s*d\s*<=\s*days\s*;\s*d\+\+\s*\)\s*\{[\s\S]*?payload\.days\[d\.toString\(\)\]\s*=\s*el\.value\.trim\(\);\s*\}/;
        if (content.match(regex1)) {
            content = content.replace(regex1, 
                "for (let d = 1; d <= days; d++) {\n" +
                "                const el = document.getElementById(`personal-day-${d}`);\n" +
                "                if (el && el.dataset.changed === 'true') {\n" +
                "                    payload.days[d.toString()] = el.value.trim();\n" +
                "                }\n" +
                "            }");
            modified = true;
        }
    }

    // Modify the payload logic in saveTeamExcel (pxvhtruongca)
    if (content.includes('saveTeamExcel()')) {
        const regex2 = /for\s*\(\s*let\s*d\s*=\s*1\s*;\s*d\s*<=\s*daysInMonth\s*;\s*d\+\+\s*\)\s*\{[\s\S]*?payload\.days\[d\.toString\(\)\]\s*=\s*el\.value\.trim\(\);\s*\}/;
        if (content.match(regex2)) {
            content = content.replace(regex2, 
                "for (let d = 1; d <= daysInMonth; d++) {\n" +
                "                      const el = document.getElementById(`personal-day-${empUser}-${d}`);\n" +
                "                      if (el && el.dataset.changed === 'true') {\n" +
                "                          payload.days[d.toString()] = el.value.trim();\n" +
                "                      }\n" +
                "                  }");
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed inputs in ' + file);
    }
});
