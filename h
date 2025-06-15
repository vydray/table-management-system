[1mdiff --git a/pages/attendance.tsx b/pages/attendance.tsx[m
[1mindex de3034c..b0ae03a 100644[m
[1m--- a/pages/attendance.tsx[m
[1m+++ b/pages/attendance.tsx[m
[36m@@ -141,7 +141,7 @@[m [mexport default function Attendance() {[m
   }[m
 [m
   // 行を更新（金額フォーマット対応）[m
[31m-  const updateRow = (index: number, field: keyof AttendanceRow, value: any) => {[m
[32m+[m[32m  const updateRow = (index: number, field: keyof AttendanceRow, value: string | number) => {[m
     const newRows = [...attendanceRows][m
     [m
     // 日払い金額の場合は特別処理[m
[36m@@ -262,8 +262,7 @@[m [mexport default function Attendance() {[m
       </Head>[m
 [m
       <div style={{[m
[31m-        width: '100%',[m
[31m-        maxWidth: '1024px',[m
[32m+[m[32m        width: '1024px',[m
         height: '768px',[m
         margin: '0 auto',[m
         backgroundColor: '#f2f2f7',[m
[36m@@ -364,13 +363,12 @@[m [mexport default function Attendance() {[m
         <div style={{[m
           flex: 1,[m
           backgroundColor: '#fff',[m
[31m-          margin: '0 16px',[m
[32m+[m[32m          margin: '0 8px',[m
           borderRadius: '12px',[m
           boxShadow: '0 2px 10px rgba(0,0,0,0.08)',[m
[31m-          overflow: 'auto',  // 'hidden'から'auto'に変更[m
[32m+[m[32m          overflow: 'hidden',[m
           display: 'flex',[m
[31m-          flexDirection: 'column',[m
[31m-          maxWidth: 'calc(100% - 32px)'[m
[32m+[m[32m          flexDirection: 'column'[m
         }}>[m
           {loading ? ([m
             <div style={{ [m
[36m@@ -385,6 +383,7 @@[m [mexport default function Attendance() {[m
           ) : ([m
             <div style={{ [m
               flex: 1,[m
[32m+[m[32m              overflowX: 'auto',[m
               overflowY: 'auto',[m
               WebkitOverflowScrolling: 'touch'[m
             }}>[m
[36m@@ -392,7 +391,7 @@[m [mexport default function Attendance() {[m
                 width: '100%',[m
                 borderCollapse: 'collapse',[m
                 tableLayout: 'fixed',[m
[31m-                fontSize: '11px'  // 全体的に小さく[m
[32m+[m[32m                fontSize: '11px'[m
               }}>[m
                 <thead style={{ [m
                   position: 'sticky',[m
[36m@@ -402,80 +401,86 @@[m [mexport default function Attendance() {[m
                 }}>[m
                   <tr>[m
                     <th style={{ [m
[31m-                      padding: '10px 4px', [m
[32m+[m[32m                      padding: '8px 2px',[m[41m [m
                       textAlign: 'left', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
                       backgroundColor: '#f2f2f7',[m
[31m-                      width: '20%'[m
[32m+[m[32m                      width: '18%'[m
                     }}>[m
                       名前[m
                     </th>[m
                     <th style={{ [m
[31m-                      padding: '10px 4px', [m
[32m+[m[32m                      padding: '8px 2px',[m[41m [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      width: '13%'[m
                     }}>[m
                       出勤[m
                     </th>[m
                     <th style={{ [m
                       padding: '10px 4px', [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      minWidth: '70px'[m
                     }}>[m
                       退勤[m
                     </th>[m
                     <th style={{ [m
                       padding: '10px 4px', [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      minWidth: '70px'[m
                     }}>[m
                       状況[m
                     </th>[m
                     <th style={{ [m
                       padding: '10px 4px', [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      minWidth: '70px'[m
                     }}>[m
                       遅刻[m
                     </th>[m
                     <th style={{ [m
                       padding: '10px 4px', [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      minWidth: '70px'[m
                     }}>[m
                       休憩[m
                     </th>[m
                     <th style={{ [m
                       padding: '10px 4px', [m
                       textAlign: 'center', [m
[31m-                      fontSize: '12px',[m
[32m+[m[32m                      fontSize: '11px',[m
                       fontWeight: '600',[m
                       color: '#3c3c43',[m
                       borderBottom: '1px solid #c6c6c8',[m
[31m-                      backgroundColor: '#f2f2f7'[m
[32m+[m[32m                      backgroundColor: '#f2f2f7',[m
[32m+[m[32m                      minWidth: '70px'[m
                     }}>[m
                       日払[m
                     </th>[m
[36m@@ -486,16 +491,16 @@[m [mexport default function Attendance() {[m
                     <tr key={row.id} style={{ [m
                       borderBottom: '1px solid #e5e5ea'[m
                     }}>[m
[31m-                      <td style={{ padding: '4px' }}>[m
[32m+[m[32m                      <td style={{ padding: '2px' }}>[m
                         <select[m
                           value={row.cast_name}[m
                           onChange={(e) => updateRow(index, 'cast_name', e.target.value)}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '4px',[m
[32m+[m[32m                            padding: '2px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '6px',[m
[31m-                            fontSize: '11px',[m
[32m+[m[32m                            borderRadius: '4px',[m
[32m+[m[32m                            fontSize: '10px',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
                             outline: 'none',[m
[36m@@ -514,10 +519,10 @@[m [mexport default function Attendance() {[m
                           onChange={(e) => updateRow(index, 'check_in_time', e.target.value)}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '6px 4px',[m
[32m+[m[32m                            padding: '2px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '13px',[m
[32m+[m[32m                            borderRadius: '4px',[m
[32m+[m[32m                            fontSize: '10px',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
                             outline: 'none',[m
[36m@@ -536,10 +541,10 @@[m [mexport default function Attendance() {[m
                           onChange={(e) => updateRow(index, 'check_out_time', e.target.value)}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '6px 4px',[m
[32m+[m[32m                            padding: '4px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '13px',[m
[32m+[m[32m                            borderRadius: '6px',[m
[32m+[m[32m                            fontSize: '11px',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
                             outline: 'none',[m
[36m@@ -558,10 +563,10 @@[m [mexport default function Attendance() {[m
                           onChange={(e) => updateRow(index, 'status', e.target.value)}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '6px 4px',[m
[32m+[m[32m                            padding: '2px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '13px',[m
[32m+[m[32m                            borderRadius: '4px',[m
[32m+[m[32m                            fontSize: '10px',[m
                             backgroundColor: row.status === '出勤' ? '#d1f2d1' : [m
                                            row.status === '欠勤' ? '#ffd1d1' : [m
                                            row.status === '遅刻' ? '#fff3cd' : '#f2f2f7',[m
[36m@@ -585,10 +590,10 @@[m [mexport default function Attendance() {[m
                           onChange={(e) => updateRow(index, 'late_minutes', Number(e.target.value))}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '6px 4px',[m
[32m+[m[32m                            padding: '4px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '13px',[m
[32m+[m[32m                            borderRadius: '6px',[m
[32m+[m[32m                            fontSize: '11px',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
                             outline: 'none',[m
[36m@@ -611,10 +616,10 @@[m [mexport default function Attendance() {[m
                           onChange={(e) => updateRow(index, 'break_minutes', Number(e.target.value))}[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '6px 4px',[m
[32m+[m[32m                            padding: '4px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '13px',[m
[32m+[m[32m                            borderRadius: '6px',[m
[32m+[m[32m                            fontSize: '11px',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
                             outline: 'none',[m
[36m@@ -639,10 +644,10 @@[m [mexport default function Attendance() {[m
                           placeholder="¥0"[m
                           style={{[m
                             width: '100%',[m
[31m-                            padding: '4px',[m
[32m+[m[32m                            padding: '1px 2px',[m
                             border: '1px solid #e5e5ea',[m
[31m-                            borderRadius: '8px',[m
[31m-                            fontSize: '12px',[m
[32m+[m[32m                            borderRadius: '4px',[m
[32m+[m[32m                            fontSize: '10px',[m
                             textAlign: 'right',[m
                             backgroundColor: '#f2f2f7',[m
                             color: '#000',[m
