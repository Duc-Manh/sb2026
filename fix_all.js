const fs = require('fs');
const path = require('path');

const filesToFix = ['pxvhlead1.html', 'pxvhlead2.html', 'pxvhdap2.html', 'pxvhdap4.html'];

filesToFix.forEach(file => {
    let p = path.join(__dirname, 'src/main/resources/templates', file);
    if (!fs.existsSync(p)) return;
    
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace the broken renderAdminTable and savePersonalExcel with the correct ones
    const correctAdminTable = `
      async function renderAdminTable() {
          const container = document.getElementById('table-container');
          const submitInfo = document.getElementById('submit-info');

          container.innerHTML =
              '<div class="p-10 text-center text-slate-400 italic">Đang tải dữ liệu kíp trực...</div>';

          const days = new Date(currentYear, currentMonth + 1, 0).getDate();
          const monthKey = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}\`;

          document.getElementById('table-title').innerText =
              \`Bảng Chấm Công Tổng Hợp - Tháng \${currentMonth + 1}/\${currentYear}\`;

          try {
              const res = await fetch(\`/api/schedule/get-excel-attendance-all/\${monthKey}\`);
              if (res.status === 404) {
                  container.innerHTML = '<div class="p-10 text-center text-red-500 font-bold">Bảng chấm công tháng này chưa được tạo bởi admin!</div>';
                  return;
              }
              const resultObj = await res.json();
              const excelData = resultObj.data || [];

              if (excelData.length === 0) {
                  container.innerHTML = '<div class="p-10 text-center text-red-500 font-bold">Chưa có dữ liệu Excel. Vui lòng tạo bảng trước!</div>';
                  return;
              }

              submitInfo.innerHTML = \`<div class="mb-4 text-slate-500 italic">Hiển thị dữ liệu tổng hợp của tất cả nhân sự</div>
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
              </table>\`;

              let tableHtml = \`<table class="min-w-full bg-white text-xs text-center border-collapse border border-slate-800">
      <thead>
          <tr class="bg-blue-50">
              <th colspan="\${days + 2}" class="border border-slate-800 p-2 font-bold text-red-600 text-left"></th>
              <th class="border border-slate-800 p-2 font-bold uppercase">Giờ tiêu chuẩn TC:</th>
              <th class="border border-slate-800 p-2 font-bold text-red-600">176</th>
              <th class="border border-slate-800 p-2 font-bold uppercase">Công TC:</th>
              <th class="border border-slate-800 p-2 font-bold text-red-600">22</th>
          </tr>
          <tr class="bg-slate-100">
              <th class="border border-slate-800 w-8 py-2 text-xs">STT</th>
              <th class="col-fixed border border-slate-800 py-2 text-xs">Họ tên nhân viên</th>\`;

              for (let d = 1; d <= days; d++) {
                  let dow = new Date(currentYear, currentMonth, d).getDay();
                  let text = d.toString();
                  let classStr = "min-w-[32px] text-xs border border-slate-800";
                  if (dow === 6) { text = "T7"; classStr += " text-red-600"; }
                  else if (dow === 0) { text = "CN"; classStr += " text-red-600"; }
                  tableHtml += \`<th class="\${classStr}">\${text}</th>\`;
              }

              const fixedCols = [
                  'LV<br>(1)',
                  'KK<br>(2)',
                  'Tổng giờ<br>(3)=(1)+(2)',
                  'Chênh lệch so với<br>giờ TC<br>(4)=(3)-176',
                  'Tổng công<br>(5)=(3)/8',
                  'Chênh lệch so với<br>công TC<br>(6)=(5)-22',
              ];
              fixedCols.forEach((col, i) =>
                  (tableHtml += \`<th class="\${i < 2 ? 'w-10' : i % 2 == 0 ? 'w-16' : 'w-20'} text-[10px] border border-slate-800 py-2 uppercase leading-tight">\${col}</th>\`)
              );

              tableHtml += \`</tr></thead><tbody>\`;

              excelData.forEach((emp, index) => {
                  tableHtml += \`<tr class="hover:bg-slate-50 transition-colors">
                      <td class="border border-slate-800 p-1 font-bold text-slate-500">\${index + 1}</td>
                      <td class="col-fixed text-left px-2 py-1 border border-slate-800 font-bold text-blue-900">\${emp.hoten}</td>\`;
                  
                  for (let d = 1; d <= days; d++) {
                      let val = emp.days[d] || '';
                      tableHtml += \`<td class="border border-slate-800 p-1 font-medium">\${val}</td>\`;
                  }
                  
                  const calcs = emp.calcs || ['', '', '', '', '', ''];
                  calcs.forEach(c => {
                      tableHtml += \`<td class="bg-blue-50/50 font-bold text-blue-700 border border-slate-800 p-1">\${c}</td>\`;
                  });
                  
                  tableHtml += \`</tr>\`;
              });

              tableHtml += \`</tbody></table>\`;
              container.innerHTML = tableHtml;

          } catch (e) {
              container.innerHTML = '<div class="p-10 text-center text-red-500 font-bold">Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối Server.</div>';
              console.error(e);
          }
      }

      async function savePersonalExcel() {
          if (!currentUser || !currentUser.hoten) return;
          const days = new Date(currentYear, currentMonth + 1, 0).getDate();
          const monthKey = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}\`;
          
          const payload = {
              monthKey: monthKey,
              hoten: currentUser.hoten,
              days: {}
          };

          for (let d = 1; d <= days; d++) {
              const el = document.getElementById(\`personal-day-\${d}\`);
              if (el) {
                  payload.days[d.toString()] = el.value.trim();
              }
          }

          try {
              const btn = document.querySelector('button[onclick="savePersonalExcel()"]');
              if(btn) {
                  const oldText = btn.innerText;
                  btn.innerText = 'Đang lưu...';
                  btn.disabled = true;

                  const res = await fetch('/api/schedule/save-personal-excel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
                  
                  const data = await res.json();
                  alert(data.message);
                  
                  btn.innerText = oldText;
                  btn.disabled = false;
              } else {
                  const res = await fetch('/api/schedule/save-personal-excel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  alert(data.message);
              }
          } catch (err) {
              console.error(err);
              alert('Lỗi khi lưu dữ liệu cá nhân');
          }
      }
    `;

    // The corrupted code started at "async function renderAdminTable()" and ended at the catch block.
    // I will replace everything from "async function renderAdminTable()" to "document.addEventListener('DOMContentLoaded'" with the correct functions
    const regex = /async function renderAdminTable\(\)\s*\{[\s\S]*?(?=\/\/ KHỞI CHẠY TẤT CẢ|document\.addEventListener)/;
    if (regex.test(content)) {
        content = content.replace(regex, correctAdminTable + '\n\n        ');
        fs.writeFileSync(p, content);
        console.log('Fixed ' + file);
    } else {
        console.log('Could not find regex in ' + file);
    }
});
