const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /async function renderAttendanceTable\(\)\s*\{[\s\S]*?(?=\/\/ --- PHẦN LỊCH TRỰC ---)/;

const newBlock = `async function renderAttendanceTable() {
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
                                <input type="text" id="personal-day-\${emp.user}-\${d}" oninput="this.dataset.changed='true'" class="w-full h-full text-center border-none focus:ring-1 focus:ring-inset focus:ring-blue-300 uppercase font-bold text-xs m-0 p-1 bg-transparent" value="\${v}">
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
          
          let btn = document.querySelector('button[onclick="saveTeamExcel()"]');
          let oldText = btn ? btn.innerText : 'Lưu kíp trực';
          let hasChanges = false;
          
          try {
              if (btn) {
                  btn.innerText = 'Đang lưu...';
                  btn.disabled = true;
              }
              
              for (let i = 0; i < rows.length; i++) {
                  const row = rows[i];
                  const empUser = row.dataset.userId;
                  const empHoten = row.dataset.hoten;
                  
                  const payload = {
                      monthKey: monthKey,
                      hoten: empHoten,
                      days: {}
                  };
                  
                  for (let d = 1; d <= daysInMonth; d++) {
                      const el = document.getElementById(\`personal-day-\${empUser}-\${d}\`);
                      if (el && el.dataset.changed === 'true') {
                          payload.days[d.toString()] = el.value.trim();
                      }
                  }
                  
                  if (Object.keys(payload.days).length > 0) {
                      hasChanges = true;
                      await fetch('/api/schedule/save-personal-excel', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                      });
                  }
              }
              
              if (!hasChanges) {
                  alert('Không có dữ liệu mới để lưu!');
              } else {
                  alert('Lưu bảng chấm công kíp thành công!');
                  if (typeof renderAttendanceTable === "function") renderAttendanceTable();
              }
              
              if (btn) {
                  btn.innerText = oldText;
                  btn.disabled = false;
              }
          } catch(err) {
              console.error(err);
              alert('Lỗi khi lưu bảng chấm công kíp');
              if (btn) {
                  btn.innerText = oldText;
                  btn.disabled = false;
              }
          }
      }

      `;

if (regex.test(content)) {
    const replaced = content.replace(regex, newBlock);
    fs.writeFileSync(filePath, replaced);
    console.log('Fixed pxvhtruongca.html');
} else {
    console.log('Could not find regex');
}
