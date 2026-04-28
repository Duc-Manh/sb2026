const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

const newRenderFactorySchedule = `
      async function renderFactorySchedule() {
        const container = document.getElementById('schedule-display-container');
        if (!currentUser) return;
        
        const isSB2 = currentUser.nhamay === 'Sông Bung 2';
        const isSB4 = currentUser.nhamay === 'Sông Bung 4';
        const code = isSB2 ? 'sb2' : 'sb4';
        const title = isSB2 ? 'NM SB2' : 'NM SB4';
        const titleColor = isSB2 ? 'text-blue-900' : 'text-orange-700';
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthYearStr = \`\${(currentMonth + 1).toString().padStart(2, '0')}-\${currentYear}\`;
        
        let dlHtml = '', thuHtml = '';
        for (let i = 1; i <= daysInMonth; i++) {
            let d = new Date(currentYear, currentMonth, i);
            dlHtml += \`<td class="border border-slate-800 p-1 w-1 text-center">\${i.toString().padStart(2, '0')}</td>\`;
            let thuColor = d.getDay() === 0 ? 'text-red-500' : '';
            thuHtml += \`<td class="border border-slate-800 p-1 w-1 font-bold text-center \${thuColor}">\${getVNDay(d)}</td>\`;
        }
        
        let html = \`
        <div class="mt-8 border border-slate-800 shadow-inner bg-white overflow-x-auto custom-scrollbar">
            <table id="schedule-table-readonly" class="w-full border-collapse border border-slate-800 text-xs md:text-sm text-center font-medium min-w-[1200px] table-fixed">
                <thead>
                    <tr class="bg-slate-50">
                        <th rowspan="3" class="border border-slate-800 p-1 w-8"></th>
                        <th rowspan="3" class="border border-slate-800 p-1 \${titleColor} w-12 text-xs uppercase">\${title}</th>
                        <th class="border border-slate-800 p-1 w-12"></th>
                        <th colspan="\${daysInMonth}" class="border border-slate-800 p-1 font-bold bg-blue-50/30 tracking-widest uppercase text-xs">
                            THÁNG \${(currentMonth + 1).toString().padStart(2, '0')}
                        </th>
                        <th class="border border-slate-800 p-1 bg-slate-50 w-[250px] md:w-[300px]">Ghi chú kíp trực</th>
                    </tr>
                    <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-800 p-1">DL</td>
                        \${dlHtml}
                        <td class="border border-slate-800 bg-slate-50"></td>
                    </tr>
                    <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-800 p-1">Thứ</td>
                        \${thuHtml}
                        <td class="border border-slate-800 bg-slate-50"></td>
                    </tr>
                </thead>
                <tbody class="table-body">
                    <tr>
                        <td rowspan="3" class="border border-slate-800 p-1 font-bold text-center">1</td>
                        <td rowspan="3" class="border border-slate-800 p-1 font-bold \${titleColor} uppercase">Vận hành</td>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Ca ngày</td>
                        \${renderDropdownCells(daysInMonth, ['K1', 'K2', 'K3', 'K4', 'K5'], false)}
                        <td rowspan="3" class="border border-slate-800 p-2 align-top text-left bg-white" style="width: 450px;">
                            <div id="note-kip" class="outline-none min-h-[50px] whitespace-pre-wrap text-xs md:text-sm"></div>
                        </td>
                    </tr>
                    <tr>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Ca đêm</td>
                        \${renderDropdownCells(daysInMonth, ['K1', 'K2', 'K3', 'K4', 'K5'], false)}
                    </tr>
                    <tr>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Hành chính</td>
                        \${renderDropdownCells(daysInMonth, ['K1', 'K2', 'K3', 'K4', 'K5', 'PX'], true)}
                    </tr>
                    <tr>
                        <td rowspan="3" class="border border-slate-800 p-1 font-bold text-center">3</td>
                        <td rowspan="2" class="border border-slate-800 p-1 font-bold uppercase">Vận hành Đập</td>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Ca trực</td>
                        \${renderDropdownCells(daysInMonth, ['N1', 'N2'], false)}
                        <td id="note-dap" rowspan="2" class="border border-slate-800 p-2 align-top text-left bg-white outline-none whitespace-pre-wrap text-xs md:text-sm"></td> 
                    </tr>
                    <tr>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Hành chính</td>
                        \${renderDropdownCells(daysInMonth, ['N1', 'N2'], false)}
                    </tr>
                    <tr class="bg-slate-50">
                        <td colspan="2" class="border border-slate-800 p-1 font-bold text-left pl-2">Phương tiện</td>
                        \${renderDropdownCells(daysInMonth, ['xe'], false)}
                        <td class="border border-slate-800 bg-slate-50"></td>
                    </tr>
                </tbody>
            </table>
            <div class="p-4 border-t border-slate-800 bg-slate-50">
                <div class="flex gap-2 mb-2">
                    <button onclick="toggleExchangeInfo()" class="px-3 py-1.5 bg-blue-800 text-white rounded text-xs uppercase font-bold hover:bg-amber-700 transition-all">
                        THÔNG TIN ĐỔI CA
                    </button>
                    <button onclick="saveExchangeInfo()" class="px-3 py-1.5 bg-blue-800 text-white rounded text-xs uppercase font-bold hover:bg-green-800 transition-all">
                        LƯU ĐỔI CA
                    </button>
                    <span id="msg-doica" class="text-xs text-green-600 font-bold self-center opacity-0 transition-opacity">✓ Đã lưu ghi chú</span>
                </div>
                <textarea id="textarea-doica" class="hidden w-full p-3 border border-slate-300 rounded-lg text-sm outline-none shadow-inner" rows="3" placeholder="Nhập ghi chú đổi ca tại đây..."></textarea>
            </div>
        </div>
        \`;
        
        container.innerHTML = html;
        
        // Tải dữ liệu lịch trực
        try {
            const res = await fetch(\`/api/schedule/get/\${code}/\${monthYearStr}\`);
            const result = await res.json();
            
            if (result.data) {
                const savedData = JSON.parse(result.data);
                const selects = document.querySelectorAll('#schedule-table-readonly select');
                savedData.forEach((item, idx) => {
                    const select = selects[idx];
                    if (select) {
                        if (Array.isArray(item.val)) {
                            // Multiple values
                            const parent = select.parentElement;
                            parent.innerHTML = '';
                            item.val.forEach(v => {
                                const span = document.createElement('span');
                                span.innerText = v;
                                span.className = 'px-1 rounded text-xs text-black my-0.5 block w-full text-center font-bold bg-blue-100';
                                parent.appendChild(span);
                            });
                        } else {
                            // Single value
                            select.value = item.val || '';
                        }
                    }
                });
            }
            if (result.kip_truc) {
                document.getElementById('note-kip').innerHTML = result.kip_truc;
            }
            if (result.truc_dap) {
                document.getElementById('note-dap').innerHTML = result.truc_dap;
            }
            if (result.doica) {
                document.getElementById('textarea-doica').value = result.doica;
                document.getElementById('textarea-doica').classList.remove('hidden');
            }
        } catch(e) {
            console.error('Lỗi tải lịch trực', e);
        }
      }
`;

const regex = /async function renderFactorySchedule\(\)\s*\{[\s\S]*?(?=function toggleExchangeInfo\(\))/;
const newContent = content.replace(regex, newRenderFactorySchedule);

fs.writeFileSync(filePath, newContent);
console.log('Update successful!');
