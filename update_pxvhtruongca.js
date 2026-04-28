const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/resources/templates/pxvhtruongca.html');
let content = fs.readFileSync(filePath, 'utf8');

// The new Javascript block that replaces the old one
const newScript = `
      let currentMonth = new Date().getMonth();
      let currentYear = new Date().getFullYear();
      let currentUser = null;

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
          renderFactorySchedule();
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
          renderFactorySchedule();
      }

      function goCurrentMonth() {
          currentMonth = new Date().getMonth();
          currentYear = new Date().getFullYear();
          renderAttendanceTable();
          renderFactorySchedule();
      }

      async function renderAttendanceTable() {
        const container = document.getElementById('table-container');
        const days = new Date(currentYear, currentMonth + 1, 0).getDate();
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
                        <th class="col-fixed border border-slate-800 py-3">Họ và tên</th>\`;

          for (let d = 1; d <= days; d++) {
            tableHtml += \`<th class="min-w-[40px] text-xs border border-slate-800 font-bold text-slate-600 bg-slate-50 hover:bg-blue-100 hover:text-blue-900 transition-colors cursor-default">\${d.toString().padStart(2, '0')}</th>\`;
          }

          const fixedCols = [
            'LV<br>(1)',
            'KK<br>(2)',
            'Tổng giờ<br>(3)=(1)+(2)',
            'Chênh lệch so với<br>giờ TC<br>(4)=(3)-176',
            'Tổng công<br>(5)=(3)/8',
            'Chênh lệch so với<br>công TC<br>(6)=(5)-22',
          ];
          fixedCols.forEach(
            (col, i) =>
              (tableHtml += \`<th class="\${i < 2 ? 'col-short' : i % 2 == 0 ? 'col-normal' : 'col-long'} text-xs border border-slate-800 py-2 uppercase leading-tight">\${col}</th>\`),
          );

          tableHtml += \`</tr></thead><tbody id="attendance-body">\`;
          
          teamMembers.forEach((emp) => {
            // Find employee's existing excel data
            let empExcel = allExcelData.find(e => e.hoten === emp.hoten);
            if (!empExcel) {
                empExcel = { days: {}, calcs: ['', '', '', '', '', ''] };
            }
            
            tableHtml += \`<tr data-user-id="\${emp.user}" data-hoten="\${emp.hoten}">
                <td class="col-fixed text-left px-4 border border-slate-800">
                    <div class="font-bold text-blue-900">\${emp.hoten}</div>
                    <div class="text-xs text-slate-500 uppercase">\${emp.chucdanh}</div>
                </td>\`;
                
            for (let d = 1; d <= days; d++) {
              const v = empExcel.days[d] || '';
              tableHtml += \`<td class="border border-slate-800 p-1">
                                <input type="text" id="personal-day-\${emp.user}-\${d}" class="w-full text-center border rounded py-1 px-1 text-xs focus:ring focus:ring-blue-300 uppercase font-bold" value="\${v}">
                            </td>\`;
            }
            
            // Hiển thị 6 ô tính toán từ Excel
            const displayCalcs = empExcel.calcs && empExcel.calcs.length === 6 ? empExcel.calcs : ['', '', '', '', '', ''];
            displayCalcs.forEach(
              (v) => (tableHtml += \`<td class="bg-slate-50 font-bold text-blue-700 border border-slate-800 calc-cell text-center">\${v}</td>\`),
            );
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
        } catch (e) {
          container.innerHTML = '<div class="p-10 text-red-500 text-center">Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối Server.</div>';
          console.error(e);
        }
      }

      async function saveTeamExcel() {
          const rows = document.querySelectorAll('#attendance-body tr');
          if(rows.length === 0) return;
          
          const monthKey = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}\`;
          const days = new Date(currentYear, currentMonth + 1, 0).getDate();
          
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
                  
                  for (let d = 1; d <= days; d++) {
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
              renderAttendanceTable(); // Tải lại bảng để xem calcs mới nhất
          } catch(err) {
              console.error(err);
              alert('Lỗi khi lưu bảng chấm công kíp');
          }
      }

      function renderFactorySchedule() {
        const scheduleContainer = document.getElementById('schedule-display-container');
        if (!currentUser) return;
        
        const fileToLoad = currentUser.nhamay === 'Sông Bung 2' ? '/lichtrucsb2.html' : '/lichtrucsb4.html';
        
        scheduleContainer.innerHTML = \`<iframe src="\${fileToLoad}" class="w-full h-[600px] border-0 mt-4 rounded shadow-sm"></iframe>\`;
      }

      function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
      }

      function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
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
