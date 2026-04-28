const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

const newScript = `
      let currentMonth = new Date().getMonth();
      let currentYear = new Date().getFullYear();
      let currentUser = null;
      let isSaved = false;

      document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
          } catch (error) {
            window.location.href = '/';
          }
        }
      });

      async function initPage() {
        try {
          const res = await fetch('/api/auth/current-user');
          if (!res.ok) {
              alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
              window.location.href = '/';
              return;
          }
          const data = await res.json();
          currentUser = {
            ...data,
            factoryCode: data.nhamay && data.nhamay.includes('4') ? 'sb4' : 'sb2',
          };
          
          const avatar = document.getElementById('user-avatar');
          if (avatar && data.hoten) {
              avatar.innerText = data.hoten.split(' ').pop().substring(0, 2).toUpperCase();
          }
          
          document.getElementById('user-fullname').innerText = currentUser.hoten;
          document.getElementById('user-job-title').innerText = currentUser.chucdanh;
          document.getElementById('header-subtitle').innerText = \`\${currentUser.nhamay} - \${currentUser.kip}\`;
          
          renderAttendanceTable();
        } catch (e) {
          console.error(e);
        }
      }

      function changeMonth(delta) {
          currentMonth += delta;
          if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
          } else if (currentMonth < 0) {
              currentMonth = 11;
              currentYear--;
          }
          renderAttendanceTable();
      }

      function goCurrentMonth() {
          currentMonth = new Date().getMonth();
          currentYear = new Date().getFullYear();
          renderAttendanceTable();
      }

      async function renderAttendanceTable() {
        const container = document.getElementById('table-container');
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthKey = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}\`;

        try {
          const [empRes, dataRes] = await Promise.all([
            fetch('/api/employee/all'),
            fetch(\`/api/schedule/get-excel-attendance-all/\${monthKey}\`),
          ]);
          const allEmployees = await empRes.json();
          const excelResult = await dataRes.json();
          const allExcelData = excelResult.data || [];

          const teamMembers = allEmployees
            .filter(
              (e) =>
                String(e.nhamay).trim() === String(currentUser.nhamay).trim() &&
                String(e.kip).trim() === String(currentUser.kip).trim(),
            )
            .sort((a, b) => {
              const p = (t) => {
                const s = t.toUpperCase();
                if (s.includes('TRƯỞNG CA')) return 1;
                if (s.includes('ĐKTT')) return 2;
                if (s.includes('GIAN MÁY')) return 3;
                return 99;
              };
              return p(a.chucdanh) - p(b.chucdanh);
            });

          let tableHtml = \`
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 px-2">
          <div class="font-bold text-blue-900 text-base md:text-lg uppercase tracking-tight">
            Tháng \${(currentMonth + 1).toString().padStart(2, '0')}/\${currentYear}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="saveTeamExcel()" class="flex-1 sm:flex-none bg-blue-800 text-white px-4 py-2 rounded-lg text-[11px] md:text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
              Lưu kíp trực
            </button>
            <button onclick="window.print()" class="hidden sm:block bg-blue-800 text-white px-3 py-2 rounded-lg text-[11px] md:text-sm  hover:bg-white hover:text-blue-800 hover:border hover:border-blue-800 transition-all shadow-sm">
              In bảng
            </button>
          </div>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
            <table class="min-w-[1200px] w-full bg-white text-sm border-collapse">
                <thead>
                    <tr class="bg-slate-50">
                        <th class="border border-slate-800 py-3 px-2 w-10 text-slate-700">STT</th>
                        <th class="col-fixed border border-slate-800 py-3 text-slate-700 uppercase font-bold text-xs">Họ tên nhân viên</th>\`;

          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dayOfWeek = date.getDay();
            let text = d.toString();
            let textColor = 'text-slate-600';
            if (dayOfWeek === 6) {
                text = 'T7';
                textColor = 'text-red-500';
            } else if (dayOfWeek === 0) {
                text = 'CN';
                textColor = 'text-red-500';
            }
            tableHtml += \`<th class="min-w-[32px] text-xs border border-slate-800 font-bold \${textColor} bg-slate-50 hover:bg-blue-100 hover:text-blue-900 transition-colors cursor-default">\${text}</th>\`;
          }

          tableHtml += \`</tr></thead><tbody id="attendance-body">\`;
          
          teamMembers.forEach((emp, index) => {
            let empExcel = allExcelData.find(e => e.hoten === emp.hoten);
            if (!empExcel) {
                empExcel = { days: {}, calcs: ['', '', '', '', '', ''] };
            }
            
            tableHtml += \`<tr data-user-id="\${emp.user}" data-hoten="\${emp.hoten}">
                <td class="border border-slate-800 text-center font-bold text-slate-600">\${index + 1}</td>
                <td class="col-fixed text-left px-4 border border-slate-800">
                    <div class="font-bold text-blue-900">\${emp.hoten}</div>
                </td>\`;
                
            for (let d = 1; d <= daysInMonth; d++) {
              const v = empExcel.days[d] || '';
              tableHtml += \`<td class="border border-slate-800 p-0 text-center">
                                <input type="text" id="personal-day-\${emp.user}-\${d}" class="w-full h-full text-center border-none focus:ring-1 focus:ring-inset focus:ring-blue-300 uppercase font-bold text-xs m-0 p-1 bg-transparent" value="\${v}">
                            </td>\`;
            }
            
            tableHtml += \`</tr>\`;
          });
          
          tableHtml += \`</tbody></table></div>\`;
          
          // Thêm Legend theo yêu cầu
          tableHtml += \`
          <div class="mt-8">
              <div class="mb-4 text-slate-500 italic">Hiển thị dữ liệu tổng hợp của tất cả nhân sự</div>
                <table class="w-full max-w-5xl text-xs border-collapse border border-slate-800 text-center mb-4 bg-white">
                    <thead class="bg-[#e6f2ff] font-bold">
                        <tr>
                            <th class="border border-slate-800 py-1.5 text-red-600 uppercase">Ký hiệu</th>
                            <th class="border border-slate-800 py-1.5 text-black">Nội dung</th>
                            <th class="border border-slate-800 py-1.5 text-red-600 uppercase">Hệ số KK</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-slate-800 py-1 font-bold text-black">08B2; 09B2...</td>
                            <td class="border border-slate-800 py-1 text-black">Làm việc vận hành SB2</td>
                            <td class="border border-slate-800 py-1 font-bold text-red-600">0,15</td>
                        </tr>
                        <tr class="bg-[#e6f2ff]">
                            <td class="border border-slate-800 py-1 font-bold text-black">08B4; 09B4...</td>
                            <td class="border border-slate-800 py-1 text-black">Làm việc vận hành SB4</td>
                            <td class="border border-slate-800 py-1 font-bold text-red-600">0,1</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-800 py-1 font-bold text-black">08B2, 09B4....</td>
                            <td class="border border-slate-800 py-1 text-black">Làm việc hành chính, giám sát, sửa chữa, lái xe tại SB2,SB4 trên 3 công tiêu chuẩn trở lên</td>
                            <td class="border border-slate-800 py-1 font-bold text-red-600">0,1</td>
                        </tr>
                        <tr class="bg-[#e6f2ff]">
                            <td class="border border-slate-800 py-1 font-bold text-black">8; 9..; 08F; 08C; 08H, 08ND, 08NB, 08R, 08L</td>
                            <td class="border border-slate-800 py-1 text-black">Làm việc, Nghỉ phép, Công tác, Học, Nghỉ dưỡng, Nghỉ bù, Nghỉ chế độ, Nghỉ lễ (có tính công)</td>
                            <td class="border border-slate-800 py-1 bg-white" rowspan="2"></td>
                        </tr>
                        <tr>
                            <td class="border border-slate-800 py-1 font-bold text-black">00R0; 00O</td>
                            <td class="border border-slate-800 py-1 text-black">Nghỉ ko lương, Ốm... (ko có công)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          \`;
          
          container.innerHTML = tableHtml;
          
          // Sau khi render bảng tự chấm công, render bảng lịch trực
          renderFactorySchedule();
          
        } catch (e) {
          container.innerHTML = '<div class="p-10 text-red-500 text-center">Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối Server.</div>';
          console.error(e);
        }
      }

      async function saveTeamExcel() {
          const rows = document.querySelectorAll('#attendance-body tr');
          if(rows.length === 0) return;
          
          const monthKey = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}\`;
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          
          try {
              let btn = document.querySelector('button[onclick="saveTeamExcel()"]');
              let oldText = btn.innerText;
              btn.innerText = 'Đang lưu...';
              btn.disabled = true;
              
              for (let i = 0; i < rows.length; i++) {
                  const row = rows[i];
                  const empUser = row.dataset.userId;
                  const empHoten = row.dataset.hoten;
                  
                  const payload = {
                      thangNam: monthKey,
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
              
              alert('Lưu bảng chấm công kíp thành công!');
              btn.innerText = oldText;
              btn.disabled = false;
          } catch(err) {
              console.error(err);
              alert('Lỗi khi lưu bảng chấm công kíp');
              btn.innerText = oldText;
              btn.disabled = false;
          }
      }

      // --- PHẦN LỊCH TRỰC ---
      
      function renderDropdownCells(count, options, isMulti) {
        let html = '';
        for (let i = 1; i <= count; i++) {
            let optTags = \`<option value=""></option>\` + options.map((o) => \`<option value="\${o}">\${o}</option>\`).join('');
            html += \`<td class="border border-slate-800 p-0 h-8 text-center" style="width: 32px;">
                  <select class="no-arrow text-center font-bold w-full h-full bg-transparent cursor-pointer text-sm" disabled>\${optTags}</select></td>\`;
        }
        return html;
      }
      
      function getVNDay(date) {
        return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
      }

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
                    </tr>
                    <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-800 p-1">DL</td>
                        \${dlHtml}
                    </tr>
                    <tr class="bg-slate-50 font-bold">
                        <td class="border border-slate-800 p-1">Thứ</td>
                        \${thuHtml}
                    </tr>
                </thead>
                <tbody class="table-body">
                    <tr>
                        <td rowspan="3" class="border border-slate-800 p-1 font-bold text-center">1</td>
                        <td rowspan="3" class="border border-slate-800 p-1 font-bold \${titleColor} uppercase">Vận hành</td>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Ca ngày</td>
                        \${renderDropdownCells(daysInMonth, ['K1', 'K2', 'K3', 'K4', 'K5'], false)}
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
                    </tr>
                    <tr>
                        <td class="border border-slate-800 p-1 bg-slate-50/30">Hành chính</td>
                        \${renderDropdownCells(daysInMonth, ['N1', 'N2'], false)}
                    </tr>
                    <tr class="bg-slate-50">
                        <td colspan="2" class="border border-slate-800 p-1 font-bold text-left pl-2">Phương tiện</td>
                        \${renderDropdownCells(daysInMonth, ['xe'], false)}
                    </tr>
                </tbody>
            </table>
            <div class="p-4 border-t border-slate-800 bg-slate-50">
                <div class="flex gap-2 mb-2">
                    <button onclick="toggleExchangeInfo()" class="px-3 py-1.5 bg-blue-800 text-white rounded text-xs uppercase font-bold">
                        GHI CHÚ
                    </button>
                    <button onclick="saveExchangeInfo()" class="px-3 py-1.5 bg-blue-800 text-white rounded text-xs uppercase font-bold">
                        LƯU GHI CHÚ
                    </button>
                    <span id="msg-doica" class="text-xs text-green-600 font-bold self-center opacity-0 transition-opacity">✓ Đã lưu ghi chú</span>
                </div>
                <textarea id="textarea-doica" class="hidden w-full p-3 border border-slate-300 rounded-lg text-sm outline-none" rows="3" placeholder="Nhập ghi chú tại đây..."></textarea>
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
                        select.value = item.val || '';
                    }
                });
            }
            if (result.doica) {
                document.getElementById('textarea-doica').value = result.doica;
                document.getElementById('textarea-doica').classList.remove('hidden');
            }
        } catch(e) {
            console.error('Lỗi tải lịch trực', e);
        }
      }

      function toggleExchangeInfo() {
          const area = document.getElementById('textarea-doica');
          area.classList.toggle('hidden');
      }

      async function saveExchangeInfo() {
          const content = document.getElementById('textarea-doica').value;
          const monthYearStr = \`\${(currentMonth + 1).toString().padStart(2, '0')}-\${currentYear}\`;
          const code = currentUser.nhamay === 'Sông Bung 2' ? 'sb2' : 'sb4';
          const msg = document.getElementById('msg-doica');
          
          try {
              const res = await fetch(\`/api/schedule/save-doica/\${code}\`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      thangNam: monthYearStr,
                      doica: content
                  })
              });
              
              if (res.ok) {
                  msg.classList.replace('opacity-0', 'opacity-100');
                  setTimeout(() => msg.classList.replace('opacity-100', 'opacity-0'), 3000);
              } else {
                  alert('Lỗi khi lưu ghi chú!');
              }
          } catch (e) {
              alert('Lỗi kết nối!');
          }
      }

      function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('-translate-x-full');
        if(overlay) overlay.classList.toggle('hidden');
      }

      // Khởi chạy
      document.addEventListener('DOMContentLoaded', () => {
        initPage();
      });
`;

const startIndex = content.indexOf('<script>');
const endIndex = content.lastIndexOf('</script>');

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex + 8) + '\n' + newScript + '\n    ' + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Update successful!');
} else {
    console.log('Script tags not found');
}
