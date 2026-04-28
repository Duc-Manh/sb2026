const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

// Add oninput="this.closest('tr').dataset.changed='true'" if not exists
if (!content.includes("oninput=\"this.closest('tr').dataset.changed='true'\"")) {
    content = content.replace(
        /class="w-full h-full text-center border-none focus:ring-1 focus:ring-inset focus:ring-blue-300 uppercase font-bold text-xs m-0 p-1 bg-transparent"/g,
        'oninput="this.closest(\\\'tr\\\').dataset.changed=\\\'true\\\'" class="w-full h-full text-center border-none focus:ring-1 focus:ring-inset focus:ring-blue-300 uppercase font-bold text-xs m-0 p-1 bg-transparent"'
    );
}

// Modify saveTeamExcel
const regex = /for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*rows\.length;\s*i\+\+\s*\)\s*\{[\s\S]*?await\s+fetch\s*\(\s*'\/api\/schedule\/save-personal-excel'[\s\S]*?\}\s*\)\s*;\s*\}/;

const newSaveLoop = `
              let hasChanges = false;
              for (let i = 0; i < rows.length; i++) {
                  const row = rows[i];
                  if (row.dataset.changed !== 'true') continue;
                  
                  hasChanges = true;
                  const empUser = row.dataset.userId;
                  const empHoten = row.dataset.hoten;
                  
                  const payload = {
                      monthKey: monthKey,
                      hoten: empHoten,
                      days: {}
                  };
                  
                  for (let d = 1; d <= daysInMonth; d++) {
                      const el = document.getElementById(\`personal-day-\${empUser}-\${d}\`);
                      if (el) {
                          payload.days[d.toString()] = el.value.trim();
                      }
                  }
                  
                  await fetch('/api/schedule/save-personal-excel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
              }
              
              if (!hasChanges) {
                  alert('Không có thay đổi nào để lưu!');
                  if(btn) {
                      btn.innerText = oldText;
                      btn.disabled = false;
                  }
                  return;
              }`;

if (regex.test(content)) {
    content = content.replace(regex, newSaveLoop);
    fs.writeFileSync(filePath, content);
    console.log("Updated pxvhtruongca.html successfully.");
} else {
    console.log("Could not find the old loop in pxvhtruongca.html with regex");
}
