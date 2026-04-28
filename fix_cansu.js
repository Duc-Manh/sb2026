const fs = require('fs');
const path = require('path');

const chamcongPath = path.join(__dirname, 'src/main/resources/templates/pxvhchamcong.html');
const chamcongContent = fs.readFileSync(chamcongPath, 'utf8');

const match = chamcongContent.match(/async function renderPersonalTable\(\)\s*\{[\s\S]*?(?=\/\/ KHỞI CHẠY TẤT CẢ|document\.addEventListener)/);
if (!match) {
    console.log("Could not find blocks in pxvhchamcong.html");
    process.exit(1);
}

const correctFunctions = match[0];

let cansuPath = path.join(__dirname, 'src/main/resources/templates/pxvhcansu.html');
let cansuContent = fs.readFileSync(cansuPath, 'utf8');

// The corrupted code started at "async function renderAdminTable()" and ended at the catch block.
const regex = /async function renderAdminTable\(\)\s*\{[\s\S]*?(?=\/\/ KHỞI CHẠY TẤT CẢ|document\.addEventListener)/;
if (regex.test(cansuContent)) {
    // But wait, does cansuContent have renderPersonalTable already?
    // Let's replace the whole chunk from renderPersonalTable (if exists) or renderAdminTable
    const fullRegex = /(?:async function renderPersonalTable\(\)\s*\{[\s\S]*?)?async function renderAdminTable\(\)\s*\{[\s\S]*?(?=\/\/ KHỞI CHẠY TẤT CẢ|document\.addEventListener)/;
    cansuContent = cansuContent.replace(fullRegex, correctFunctions + '\n\n        ');
    fs.writeFileSync(cansuPath, cansuContent);
    console.log('Fixed pxvhcansu.html');
} else {
    console.log('Could not find regex in pxvhcansu.html');
}
