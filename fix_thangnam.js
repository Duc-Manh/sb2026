const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('thangNam: monthKey,')) {
    content = content.replace(/thangNam: monthKey,/g, 'monthKey: monthKey,');
    fs.writeFileSync(filePath, content);
    console.log('Fixed thangNam -> monthKey in pxvhtruongca.html');
} else {
    console.log('Not found');
}
