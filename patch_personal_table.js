const fs = require('fs');
const path = require('path');

const chamcongPath = path.join(__dirname, 'src/main/resources/templates/pxvhchamcong.html');
const chamcongContent = fs.readFileSync(chamcongPath, 'utf8');

const match = chamcongContent.match(/async function renderPersonalTable\(\)\s*\{[\s\S]*?(?=async function savePersonalExcel)/);
if (!match) {
    console.log("Could not find renderPersonalTable in pxvhchamcong.html");
    process.exit(1);
}

const renderPersonalTableCode = match[0];

const filesToFix = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html'];

filesToFix.forEach(file => {
    let p = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(p)) return;
    
    let content = fs.readFileSync(p, 'utf8');
    
    // Check if renderPersonalTable is already there
    if (content.includes('function renderPersonalTable')) {
        console.log(file + " already has renderPersonalTable");
        return;
    }
    
    // Insert renderPersonalTable right before savePersonalExcel
    content = content.replace(/async function savePersonalExcel\(\)/, renderPersonalTableCode + '\n      async function savePersonalExcel()');
    
    fs.writeFileSync(p, content);
    console.log('Fixed ' + file);
});
