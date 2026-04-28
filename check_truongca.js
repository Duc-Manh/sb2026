const fs = require('fs');
const content = fs.readFileSync('src/main/resources/templates/pxvhtruongca.html', 'utf8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    const code = scriptMatch[1];
    try {
        const acorn = require('acorn');
        acorn.parse(code, { ecmaVersion: 2020 });
        console.log("No syntax error found by acorn");
    } catch(e) {
        console.log("Syntax Error:", e.message);
        const lines = code.split('\n');
        const errLine = e.loc.line;
        console.log("Line " + errLine + ": " + lines[errLine - 1]);
        console.log("Context:");
        for(let i = Math.max(0, errLine - 5); i < Math.min(lines.length, errLine + 5); i++) {
            console.log(i+1, lines[i]);
        }
    }
}
