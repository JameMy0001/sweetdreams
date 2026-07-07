let customTasks = [
    { id: 1, name: "ทบทวนข้อสอบวิชาหลัก", priority: "A", hours: 2 },
    { id: 2, name: "เคลียร์การบ้านกลุ่ม GE011", priority: "B", hours: 2.5 },
    { id: 3, name: "เล่นเกม ROV กับเพื่อน", priority: "C", hours: 2 }
];

function updateSleepLabels() {
    const sleepHoursVal = document.getElementById("input-sleep-hours").value;
    document.getElementById("label-sleep-hours").innerText = sleepHoursVal + " ชม.";
    runSleepPlannerAlgorithm();
}

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes) {
    let m = minutes % 60;
    let h = Math.floor(minutes / 60) % 24;
    if (minutes < 0) {
        h = (Math.floor(minutes / 60) % 24 + 24) % 24;
        m = (minutes % 60 + 60) % 60;
    }
    const hStr = h.toString().padStart(2, "0");
    const mStr = m.toString().padStart(2, "0");
    return `${hStr}:${mStr}`;
}

function addCustomTask(event) {
    event.preventDefault();
    const taskNameInput = document.getElementById("sim-task-name");
    const prioritySelect = document.getElementById("sim-task-priority");
    const hoursInput = document.getElementById("sim-task-hours");

    const newTask = {
        id: Date.now(),
        name: taskNameInput.value.trim(),
        priority: prioritySelect.value,
        hours: parseFloat(hoursInput.value)
    };

    customTasks.push(newTask);
    taskNameInput.value = "";
    hoursInput.value = "2";
    
    runSleepPlannerAlgorithm();
}

function deleteCustomTask(id) {
    customTasks = customTasks.filter(task => task.id !== id);
    runSleepPlannerAlgorithm();
}

function runSleepPlannerAlgorithm() {
    const wakeTimeStr = document.getElementById("input-wake-time").value;
    const targetSleepHours = parseFloat(document.getElementById("input-sleep-hours").value);
    
    const doneCaffeine = document.getElementById("chk-caffeine").checked;
    const doneFood = document.getElementById("chk-food").checked;
    const doneStudy = document.getElementById("chk-study").checked;
    const doneScreen = document.getElementById("chk-screen").checked;

    const wakeMinutes = timeToMinutes(wakeTimeStr);
    const sleepTargetMinutes = targetSleepHours * 60;
    const bedtimeMinutes = wakeMinutes - sleepTargetMinutes;
    const bedtimeStr = minutesToTime(bedtimeMinutes);

    document.getElementById("dash-bedtime").innerText = bedtimeStr + " น.";

    const tasksA = customTasks.filter(t => t.priority === "A");
    const tasksB = customTasks.filter(t => t.priority === "B");
    const tasksC = customTasks.filter(t => t.priority === "C");

    const totalHoursA = tasksA.reduce((sum, t) => sum + t.hours, 0);
    const totalHoursB = tasksB.reduce((sum, t) => sum + t.hours, 0);
    const totalHoursC = tasksC.reduce((sum, t) => sum + t.hours, 0);
    const totalTaskHours = totalHoursA + totalHoursB + totalHoursC;

    const availableHours = 24 - targetSleepHours; 

    let logs = [];
    logs.push(`<div class="log-line log-info">[PROCESS] INPUT WAKE-UP TIME: ${wakeTimeStr}</div>`);
    logs.push(`<div class="log-line log-info">[PROCESS] SLEEP TARGET: ${targetSleepHours} ชม. (เข้านอน: ${bedtimeStr} น.)</div>`);
    logs.push(`<div class="log-line log-info">[PROCESS] AVAILABLE ACTIVE TIME: ${availableHours} ชม.</div>`);
    logs.push(`<div class="log-line log-info">[PROCESS] TOTAL PLANNED TASKS TIME: ${totalTaskHours} ชม. (A: ${totalHoursA} ชม., B: ${totalHoursB} ชม., C: ${totalHoursC} ชม.)</div>`);

    let routedTasks = [...customTasks];
    let healthShieldActive = false;
    let deferredTasks = [];

    if (totalTaskHours > availableHours) {
        healthShieldActive = true;
        logs.push(`<div class="log-line log-warning">[HEALTH SHIELD] WARNING: ภารกิจทั้งหมดล้นเวลาชีวิต! เริ่มรันระเบียบความสำคัญ A-B-C...</div>`);
        
        let remainingHours = availableHours;
        routedTasks = [];

        tasksA.forEach(t => {
            if (remainingHours >= t.hours) {
                routedTasks.push(t);
                remainingHours -= t.hours;
            } else {
                routedTasks.push(t);
                remainingHours -= t.hours;
                logs.push(`<div class="log-line log-error">[CRITICAL] งานด่วนเกรด A ล้นเวลานอน! ร่างกายเริ่มเผชิญความเสี่ยงง่วงสะสม</div>`);
            }
        });

        tasksB.forEach(t => {
            if (remainingHours >= t.hours) {
                routedTasks.push(t);
                remainingHours -= t.hours;
            } else {
                deferredTasks.push(t);
                logs.push(`<div class="log-line log-warning">[ROUTING] เลื่อนงานรอง B: "${t.name}" ไปทำวันพรุ่งนี้ เพื่อปกป้องเวลานอน</div>`);
            }
        });

        tasksC.forEach(t => {
            if (remainingHours >= t.hours) {
                routedTasks.push(t);
                remainingHours -= t.hours;
            } else {
                deferredTasks.push(t);
                logs.push(`<div class="log-line log-warning">[ROUTING] ยกเลิก/สละกิจกรรมผ่อนคลาย C: "${t.name}" เพื่อความปลอดภัยนอนหลับ</div>`);
            }
        });
    } else {
        logs.push(`<div class="log-line log-success">[HEALTH SHIELD] PASS: ตารางงานปกติ ไม่ล้นเวลานอน ระบบมีความปลอดภัย</div>`);
    }

    let score = 100;
    let qualityDeductionReasons = [];

    if (!doneCaffeine) {
        score -= 15;
        qualityDeductionReasons.push("ดื่มคาเฟอีนกระตุ้นหัวใจใกล้เวลานอน");
        logs.push(`<div class="log-line log-error">[CHECK] บกพร่อง: ดื่มกาแฟ/ชาหลังบ่ายโมง (-15%)</div>`);
    }
    if (!doneFood) {
        score -= 15;
        qualityDeductionReasons.push("ทานมื้อหนักก่อนนอน ร่างกายไม่ได้พักย่อย");
        logs.push(`<div class="log-line log-error">[CHECK] บกพร่อง: ทานมื้อหนักใกล้เวลานอน (-15%)</div>`);
    }
    if (doneStudy) {
        score -= 25;
        qualityDeductionReasons.push("สมองเครียดตื่นตัวสะสมจากการปั่นงานสอบดึก");
        logs.push(`<div class="log-line log-error">[CHECK] บกพร่อง: ปั่นการบ้าน/อ่านหนังสือก่อนนอน 2 ชม. (-25%)</div>`);
    }
    if (doneScreen) {
        score -= 25;
        qualityDeductionReasons.push("รับแสงสีฟ้าจากจอมือถือยับยั้งเมลาโทนิน");
        logs.push(`<div class="log-line log-error">[CHECK] บกพร่อง: เล่นมือถือ/หน้าจอก่อนนอน 1 ชม. (-25%)</div>`);
    }
    
    if (targetSleepHours < 7.5) {
        const deficit = 7.5 - targetSleepHours;
        const deficitPenalty = Math.floor(deficit / 0.5) * 10;
        score -= deficitPenalty;
        if (deficitPenalty > 0) {
            qualityDeductionReasons.push(`เวลานอนเฉลี่ยต่ำกว่าขีดจำกัดร่างกาย (-${deficitPenalty}%)`);
            logs.push(`<div class="log-line log-error">[CHECK] บกพร่อง: ชั่วเวลานอน ${targetSleepHours} ชม. ต่ำกว่าระดับล้างพิษสมอง 7.5 ชม.</div>`);
        }
    }

    if (score < 0) score = 0;

    document.getElementById("dash-score").innerText = `${score}/100`;
    
    const dashScoreIcon = document.getElementById("dash-score-icon");
    const dashQuality = document.getElementById("dash-quality");
    
    if (score >= 80) {
        dashQuality.innerText = "ดีเยี่ยม (Optimal)";
        dashScoreIcon.className = "metric-icon bg-light-green";
        dashScoreIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    } else if (score >= 50) {
        dashQuality.innerText = "พอใช้ (Moderate)";
        dashScoreIcon.className = "metric-icon bg-light-yellow";
        dashScoreIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
    } else {
        dashQuality.innerText = "อันตราย (Circadian Risk!)";
        dashScoreIcon.className = "metric-icon bg-light-red";
        dashScoreIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
    }

    const timelineContainer = document.getElementById("sleep-timeline");
    timelineContainer.innerHTML = "";

    const milestones = [
        { hours: -10, title: "งดคาเฟอีนทุกชนิด (No Caffeine)", desc: "ฤทธิ์คาเฟอีนสลายตัวเฉลี่ยใช้เวลา 10 ชม. เพื่อป้องกันการรบกวนคลื่นสมองหลับลึก", status: doneCaffeine, icon: "fa-mug-hot" },
        { hours: -3, title: "งดอาหารมื้อหนัก & แอลกอฮอล์ (No Heavy Food)", desc: "กระเพาะใช้เวลาย่อยอาหารมื้อดึก 3 ชม. ป้องกันอาการกรดไหลย้อน", status: doneFood, icon: "fa-utensils" },
        { hours: -2, title: "ยุติเรื่องเรียน & งานสอบที่เครียด (No Study)", desc: "หยุดการเรียนเครียดก่อนนอน 2 ชม. เพื่อระดับฮอร์โมน Cortisol ลดระดับลง", status: !doneStudy, icon: "fa-book-open" },
        { hours: -1, title: "ปิดสมาร์ทโฟน/หน้าจอยุติแสงสีฟ้า (No Screens)", desc: "แสงสีฟ้า (Blue Light) ยับยั้งเมลาโทนิน แนะนำให้จดบันทึกลงบนเช็คลิสต์กระดาษอนาล็อกข้างเตียงแทนโทรศัพท์มือถือ เพื่อป้องกันแสงสีฟ้ายับยั้งเมลาโทนิน 100%", status: !doneScreen, icon: "fa-mobile-screen" },
        { hours: 0, title: "เวลานอนหลับเป้าหมาย (T-Sleep Bedtime)", desc: "เข้านอนทันทีในห้องนอนที่หรี่ไฟ มืดสนิท และเงียบสงบอุณหภูมิเย็นพอดี", status: true, icon: "fa-bed" },
        { hours: targetSleepHours, title: "เวลาตื่นนอนปลุกคงที่ (T-Wake Anchor)", desc: "ตื่นนอนทันทีเพื่อรักษานาฬิกาชีวิตธรรมชาติ ร่างกายจะตื่นมาพร้อมพลังงานเต็มเปี่ยม", status: true, icon: "fa-clock" }
    ];

    milestones.forEach(m => {
        const mMinutes = bedtimeMinutes + (m.hours * 60);
        const mTimeStr = minutesToTime(mMinutes);

        const item = document.createElement("div");
        item.className = "timeline-item";

        const statusColorClass = m.status ? "text-color-green" : "text-color-red";
        const statusIconClass = m.status ? "fa-circle-check" : "fa-circle-xmark";

        item.innerHTML = `
            <div class="timeline-info">
                <span class="time-badge">${mTimeStr} น.</span>
                <div>
                    <span class="item-text"><i class="fa-solid ${m.icon}"></i> ${m.title}</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${m.desc}</p>
                </div>
            </div>
            <i class="fa-solid ${statusIconClass} ${statusColorClass} item-action-icon"></i>
        `;
        timelineContainer.appendChild(item);
    });

    renderTasksList(routedTasks, deferredTasks);

    const consoleOutput = document.getElementById("sleep-output");
    if (healthShieldActive) {
        logs.push(`<div class="log-divider">--------------------------------------</div>`);
        logs.push(`<div class="log-line log-error">[SHIELD OUTPUT] ระบบทำการคัดกรองงาน เพื่อรักษาเวลานอนหลับเป้าหมายที่ 7.5 ชั่วโมงสำเร็จ!</div>`);
    } else {
        logs.push(`<div class="log-divider">--------------------------------------</div>`);
        logs.push(`<div class="log-line log-success">[SHIELD OUTPUT] ตารางเวลาปกติ สมองพักผ่อนได้สมบูรณ์แบบไร้ความเสี่ยงสะสม</div>`);
    }
    consoleOutput.innerHTML = logs.join("");
}

function renderTasksList(routed, deferred) {
    const listContainer = document.getElementById("added-tasks-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (customTasks.length === 0) {
        listContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; margin-top: 1rem;">ไม่มีภารกิจถูกแอดในวันนี้</p>`;
        return;
    }

    routed.forEach(t => {
        const item = document.createElement("div");
        item.className = "added-task-item";
        item.innerHTML = `
            <div class="task-meta">
                <span class="task-priority-badge badge-sim-${t.priority.toLowerCase()}">${t.priority}</span>
                <div>
                    <span class="task-name-text">${t.name}</span>
                    <span class="task-hours-text"><i class="fa-solid fa-clock"></i> ${t.hours} ชม.</span>
                </div>
            </div>
            <button class="delete-sim-task-btn" onclick="deleteCustomTask(${t.id})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        listContainer.appendChild(item);
    });

    deferred.forEach(t => {
        const item = document.createElement("div");
        item.className = "added-task-item";
        item.style.opacity = "0.55";
        item.style.background = "#fee2e2";
        item.style.border = "1.5px dashed #f87171";
        item.innerHTML = `
            <div class="task-meta">
                <span class="task-priority-badge badge-sim-${t.priority.toLowerCase()}" style="text-decoration: line-through;">${t.priority}</span>
                <div>
                    <span class="task-name-text" style="text-decoration: line-through;">${t.name}</span>
                    <span class="task-hours-text">[เลื่อนวันอื่น]</span>
                </div>
            </div>
            <button class="delete-sim-task-btn" onclick="deleteCustomTask(${t.id})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        listContainer.appendChild(item);
    });
}

window.onload = function() {
    runSleepPlannerAlgorithm();
};
