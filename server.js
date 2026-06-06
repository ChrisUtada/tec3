const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 8080;

function jsEscape(s) {
    if (!s) return '';
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}
function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.url}`);

    // ── POST /api/save-card: 保存卡牌数据到 cards.js ──
    if (req.method === 'POST' && req.url === '/api/save-card') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { id, template } = JSON.parse(body);
                const filePath = './js/config/cards.js';
                let content = fs.readFileSync(filePath, 'utf-8');
                
                // 将 template 序列化为 JS 对象格式
                const fields = [];
                fields.push(`name: '${jsEscape(template.name)}'`);
                fields.push(`desc: '${jsEscape(template.desc || '')}'`);
                fields.push(`type: '${template.type}'`);
                const cls = Array.isArray(template.class) ? template.class.join(' ') : (template.class || 'item-card');
                fields.push(`class: '${cls}'`);
                if (template.consumable) fields.push('consumable: true');
                else if (template.consumable === false) fields.push('consumable: false');
                if (template.allowDuplicate) fields.push('allowDuplicate: true');
                if (template.corruptionTime) fields.push(`corruptionTime: ${template.corruptionTime}`);
                if (template.senseType) fields.push(`senseType: '${template.senseType}'`);
                if (template.recycleValue) fields.push(`recycleValue: ${template.recycleValue}`);
                if (template.value) fields.push(`value: ${template.value}`);
                if (template.realName) fields.push(`realName: '${jsEscape(template.realName)}'`);
                if (template.realDesc) fields.push(`realDesc: '${jsEscape(template.realDesc)}'`);
                if (template.targetSenses) fields.push(`targetSenses: ${JSON.stringify(template.targetSenses)}`);
                if (template.collectedSenses) fields.push(`collectedSenses: ${JSON.stringify(template.collectedSenses)}`);
                if (template.interactText) fields.push(`interactText: '${jsEscape(template.interactText)}'`);
                if (template.isRevealed !== undefined) fields.push(`isRevealed: ${template.isRevealed}`);
                
                // 匹配卡牌定义行（单行或多行），替换整段
                const regex = new RegExp(`(\\s*)'${escapeRegex(id)}'\\s*:\\s*\\{[^}]+\\},?`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, (match, leading) => {
                        return leading + `'${id}': { ${fields.join(', ')} },`;
                    });
                } else {
                    // 卡牌不存在，追加到 CARD_TEMPLATES 末尾的 }; 之前
                    content = content.replace(/\n\};(\s*)$/, '\n    ' + `'${id}': { ${fields.join(', ')} },` + '\n};$1');
                }
                
                fs.writeFileSync(filePath, content, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // 移除查询参数
    let filePath = '.' + req.url.split('?')[0];
    
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.error(`Error reading file ${filePath}:`, error.code);
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
