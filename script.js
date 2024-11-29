// Đảm bảo các biến toàn cục
let processes = [];
let processCounter = 1;

document.getElementById("addProcessBtn").addEventListener("click", addProcess);
document.getElementById("runAlgorithmBtn").addEventListener("click", runAlgorithm);

function addProcess() {
    const table = document.getElementById("processTable");
    const row = table.insertRow();
    row.insertCell(0).innerHTML = `P${processCounter}`;
    row.insertCell(1).innerHTML = `<input type="number" placeholder="Thời Gian Đến">`;
    row.insertCell(2).innerHTML = `<input type="number" placeholder="Thời Gian Burst">`;

    // Thêm ô nhập Độ Ưu Tiên nếu cột Độ Ưu Tiên đang hiển thị
    const priorityColumn = document.getElementById("priorityColumn");
    if (priorityColumn.style.display !== "none") {
        row.insertCell(3).innerHTML = `<input type="number" placeholder="Độ Ưu Tiên">`;
    }

    processes.push({ id: `P${processCounter}`, arrivalTime: 0, burstTime: 0, priority: 0 });
    processCounter++;
}

function toggleTimeQuantum() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantumInput = document.getElementById("timeQuantum");

    // Hiển thị Time Quantum khi chọn Round Robin
    if (algorithm === "rr") {
        timeQuantumInput.style.display = "inline-block";
    } else {
        timeQuantumInput.style.display = "none";
    }
}

function togglePriorityColumn() {
    const algorithm = document.getElementById("algorithm").value;
    const priorityColumn = document.getElementById("priorityColumn");

    // Hiển thị cột Độ Ưu Tiên khi chọn Priority Scheduling, ẩn đi nếu không
    if (algorithm === "priority") {
        priorityColumn.style.display = "table-cell";
        
        // Thêm ô nhập Độ Ưu Tiên vào các hàng hiện tại
        Array.from(document.querySelectorAll("#processTable tr")).slice(1).forEach(row => {
            if (row.cells.length < 4) {
                row.insertCell(3).innerHTML = `<input type="number" placeholder="Độ Ưu Tiên">`;
            }
        });
    } else {
        priorityColumn.style.display = "none";
        
        // Xóa ô nhập Độ Ưu Tiên khỏi các hàng hiện tại nếu có
        Array.from(document.querySelectorAll("#processTable tr")).slice(1).forEach(row => {
            if (row.cells.length === 4) {
                row.deleteCell(3);
            }
        });
    }
}

function runAlgorithm() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantum = parseInt(document.getElementById("timeQuantum").value) || 1;

    // Cập nhật danh sách tiến trình từ bảng
    processes = Array.from(document.querySelectorAll("#processTable tr")).slice(1).map(row => {
        return {
            id: row.cells[0].innerText,
            arrivalTime: parseInt(row.cells[1].children[0].value) || 0,
            burstTime: parseInt(row.cells[2].children[0].value) || 0,
            priority: row.cells[3] ? parseInt(row.cells[3].children[0].value) || 0 : 0,
        };
    });

    let result;
    switch (algorithm) {
        case 'fcfs':
            result = fcfs();
            break;
        case 'sjf':
            result = sjf();
            break;
        case 'priority':
            result = priorityScheduling();
            break;
        case 'rr':
            result = roundRobin(timeQuantum);
            break;
        default:
            result = [];
    }
    displayResult(result);
}

function fcfs() {
    let time = 0;
    let result = [];
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);  // Sắp xếp theo thời gian đến
    processes.forEach(p => {
        result.push({ id: p.id, start: time, end: time + p.burstTime });
        time += p.burstTime;
    });
    return result;
}

function sjf() {
    let time = 0;
    let result = [];
    processes.sort((a, b) => a.burstTime - b.burstTime);  // Sắp xếp theo thời gian burst
    processes.forEach(p => {
        result.push({ id: p.id, start: time, end: time + p.burstTime });
        time += p.burstTime;
    });
    return result;
}

function priorityScheduling() {
    let time = 0;
    let completed = [];
    let result = [];
    while (completed.length < processes.length) {
        const available = processes.filter(p => p.arrivalTime <= time && !completed.includes(p));
        if (available.length === 0) {
            time++;
            continue;
        }
        const highestPriority = available.reduce((a, b) => a.priority < b.priority ? a : b);
        result.push({ id: highestPriority.id, start: time, end: time + highestPriority.burstTime });
        time += highestPriority.burstTime;
        completed.push(highestPriority);
    }
    return result;
}

// function roundRobin(timeQuantum) {
//     let time = 0;
//     let result = [];
//     let queue = [...processes];
//     while (queue.length > 0) {
//         const process = queue.shift();
//         const timeToRun = Math.min(process.burstTime, timeQuantum);
//         result.push({ id: process.id, start: time, end: time + timeToRun });
//         time += timeToRun;
//         process.burstTime -= timeToRun;
//         if (process.burstTime > 0) {
//             queue.push(process);
//         }
//     }
//     return result;
// }
function roundRobin(timeQuantum) {
    // Validate the time quantum
    if (timeQuantum <= 0) {
        throw new Error("Time quantum must be a positive number.");
    }

    let time = 0;  // Current time
    let result = [];  // Store the result of the scheduling
    let queue = [];  // Queue for processes that are ready to execute
    let pending = [...processes];  // Copy of processes to keep track of pending ones

    // Sort processes by arrival time initially
    pending.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (queue.length > 0 || pending.length > 0) {
        // Add newly arrived processes to the queue
        while (pending.length > 0 && pending[0].arrivalTime <= time) {
            queue.push(pending.shift());
        }

        // If the queue is empty, but there are pending processes, jump to the next pending process
        if (queue.length === 0) {
            // Move time forward to the next pending process's arrival
            time = pending[0].arrivalTime;
            continue;  // Skip the rest of the loop to re-check for new arrivals
        }

        const process = queue.shift();  // Get the next process from the queue
        const timeToRun = Math.min(process.burstTime, timeQuantum);  // Determine how long to run this process
        
        // Record the start and end times for this process
        result.push({ id: process.id, start: time, end: time + timeToRun });
        time += timeToRun;  // Increment the current time
        process.burstTime -= timeToRun;  // Decrease the remaining burst time

        // If the process is not finished, re-queue it
        if (process.burstTime > 0) {
            queue.push(process);
        }
    }
    
    return result;  // Return the scheduling result
}


function displayResult(result) {
    const output = document.getElementById("output");
    output.innerHTML = "<h3>Kết Quả:</h3>";
    result.forEach(r => {
        output.innerHTML += `<p>${r.id}: Bắt đầu ${r.start}, Kết thúc ${r.end}</p>`;
    });
    
    // Vẽ sơ đồ Gantt
    drawGanttChart(result);
}

function drawGanttChart(result) {
    const canvas = document.getElementById("ganttCanvas");
    const ctx = canvas.getContext("2d");

    const barHeight = 40; 
    const spaceBetweenBars = 5; 
    const timeScale = 20; 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    ctx.beginPath();
    ctx.moveTo(0, barHeight); 
    ctx.lineTo(canvas.width, barHeight); 
    ctx.stroke();

    result.forEach((r, index) => {
        const xStart = r.start * timeScale; 
        const width = (r.end - r.start) * timeScale; 
        const y = (canvas.height - barHeight) / 2; 

        ctx.fillStyle = "lightgrey"; 
        ctx.fillRect(xStart, y, width, barHeight);
        
        ctx.strokeStyle = "black"; 
        ctx.lineWidth = 1; 
        ctx.strokeRect(xStart, y, width, barHeight);
        
        ctx.fillStyle = "black";
        ctx.fillText(r.id, xStart + 5, y + barHeight / 2);

        ctx.font = "12px Arial";    
        ctx.fillStyle = "black";
        // // Thời gian bắt đầu
        // ctx.fillText(r.start, xStart, y - 5);
        // Thời gian kết thúc
        ctx.fillText(r.end, xStart + width - 25, y - 5);
    });
}



document.getElementById("startBtn").addEventListener("click", () => {
    const intro = document.getElementById("intro");
    const app = document.getElementById("app");

    intro.style.animation = "fadeOut 0.8s ease";
    setTimeout(() => {
        intro.style.display = "none"; // Ẩn intro
        app.style.display = "block"; // Hiển thị nội dung chính
        app.style.animation = "fadeInSlide 1s ease";
    }, 800);
});

// Hiệu ứng fade-out trong CSS
document.styleSheets[0].insertRule(`
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`, 0);


// Xử lý sự kiện khi nhấn nút Xóa Nội Dung
// document.getElementById("clearOutputBtn").addEventListener("click", clearOutput);

// function clearOutput() {
//     const output = document.getElementById("output");
//     const canvas = document.getElementById("ganttCanvas");
    
//     // Xóa nội dung hiển thị kết quả
//     output.innerHTML = "";
    
//     // Xóa nội dung sơ đồ Gantt
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// }
document.getElementById("clearOutputBtn").addEventListener("click", clearOutput);

// function clearOutput() {
//     // Xóa nội dung hiển thị kết quả
//     const output = document.getElementById("output");
//     output.innerHTML = "";

//     // Xóa nội dung sơ đồ Gantt
//     const canvas = document.getElementById("ganttCanvas");
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Xóa nội dung trong phần "Thêm Tiến Trình"
//     const processTable = document.getElementById("processTable");
    
//     // Xóa tất cả các hàng trong bảng (trừ tiêu đề)
//     while (processTable.rows.length > 1) {
//         processTable.deleteRow(1);
//     }

//     // Làm trống các trường nhập liệu nếu có (ví dụ tên tiến trình, thời gian đến, burst time)
//     const processNameInput = document.getElementById("processName");
//     const arrivalTimeInput = document.getElementById("arrivalTime");
//     const burstTimeInput = document.getElementById("burstTime");
//     const priorityInput = document.getElementById("priority");

//     processNameInput.value = '';
//     arrivalTimeInput.value = '';
//     burstTimeInput.value = '';
//     priorityInput.value = '';
// }


// Hàm xóa nội dung
function clearOutput() {
    // Xóa nội dung hiển thị
    const output = document.getElementById("output");
    output.innerHTML = "";

    // Xóa sơ đồ Gantt
    const canvas = document.getElementById("ganttCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Xóa các hàng trong bảng tiến trình (giữ lại tiêu đề)
    const processTable = document.getElementById("processTable");
    while (processTable.rows.length > 1) {
        processTable.deleteRow(1);
    }

    // Reset mảng và đếm tiến trình
    processes = [];
    processCounter = 1;

    // Ẩn cột độ ưu tiên nếu cần
    document.getElementById("priorityColumn").style.display = "none";

    // Reset trường nhập liệu
    document.getElementById("timeQuantum").style.display = "none";
    document.getElementById("timeQuantum").value = "";
}

// Liên kết nút "Xóa Nội Dung" với hàm clearOutput
document.getElementById("clearOutputBtn").addEventListener("click", clearOutput);



//báo lỗi 
function runAlgorithm() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantum = parseInt(document.getElementById("timeQuantum").value) || 1;

    // Kiểm tra nhập liệu hợp lệ
    let isValid = true;
    processes = Array.from(document.querySelectorAll("#processTable tr")).slice(1).map(row => {
        const arrivalTime = parseInt(row.cells[1].children[0].value) || 0;
        const burstTime = parseInt(row.cells[2].children[0].value) || 0;
        const priority = row.cells[3] ? parseInt(row.cells[3].children[0].value) || 0 : 0;

        if (arrivalTime < 0 || burstTime <= 0 || priority < 0) {
            isValid = false;
        }

        return { id: row.cells[0].innerText, arrivalTime, burstTime, priority };
    });

    if (!isValid) {
        alert("Vui lòng nhập dữ liệu hợp lệ: Thời gian đến không âm, Burst time phải lớn hơn 0.");
        return;
    }

    let result;
    switch (algorithm) {
        case 'fcfs':
            result = fcfs();
            break;
        case 'sjf':
            result = sjf();
            break;
        case 'priority':
            result = priorityScheduling();
            break;
        case 'rr':
            result = roundRobin(timeQuantum);
            break;
        default:
            result = [];
    }

    displayResult(result);
}


// Thêm mô tả thuật toán khi người dùng chọn
document.getElementById("algorithm").addEventListener("change", updateAlgorithmDescription);

function updateAlgorithmDescription() {
    const algorithm = document.getElementById("algorithm").value;
    const description = document.getElementById("algorithmInfo");

    switch (algorithm) {
        case 'fcfs':
            description.innerHTML = "First-Come, First-Served (FCFS) là thuật toán đơn giản, trong đó các tiến trình được thực thi theo thứ tự đến trước.";
            break;
        case 'sjf':
            description.innerHTML = "Shortest Job Next (sjf) thực hiện các tiến trình có burst time nhỏ nhất trước.";
            break;
        case 'priority':
            description.innerHTML = "Priority Scheduling chọn tiến trình có độ ưu tiên cao nhất để thực thi trước.";
            break;
        case 'rr':
            description.innerHTML = "Round Robin (RR) phân bổ thời gian cho mỗi tiến trình theo vòng tròn với một thời gian quantum nhất định.";
            break;
        default:
            description.innerHTML = "Chọn một thuật toán để xem thông tin chi tiết.";
    }
}

//phần bổ xung
function runAlgorithm() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantum = parseInt(document.getElementById("timeQuantum").value) || 1;

    // Hiển thị loading
    document.getElementById("loading").style.display = "block";

    // Kiểm tra nhập liệu hợp lệ
    let isValid = true;
    processes = Array.from(document.querySelectorAll("#processTable tr")).slice(1).map(row => {
        const arrivalTime = parseInt(row.cells[1].children[0].value) || 0;
        const burstTime = parseInt(row.cells[2].children[0].value) || 0;
        const priority = row.cells[3] ? parseInt(row.cells[3].children[0].value) || 0 : 0;

        if (arrivalTime < 0 || burstTime <= 0 || priority < 0) {
            isValid = false;
        }

        return { id: row.cells[0].innerText, arrivalTime, burstTime, priority };
    });

    if (!isValid) {
        alert("Vui lòng nhập dữ liệu hợp lệ: Thời gian đến không âm, Burst time phải lớn hơn 0.");
        document.getElementById("loading").style.display = "none"; // Ẩn loading nếu có lỗi
        return;
    }

    // Giả lập thời gian xử lý lâu hơn (ví dụ 2 giây)
    setTimeout(() => {
        let result;
        switch (algorithm) {
            case 'fcfs':
                result = fcfs();
                break;
            case 'sjf':
                result = sjf();
                break;
            case 'priority':
                result = priorityScheduling();
                break;
            case 'rr':
                result = roundRobin(timeQuantum);
                break;
            default:
                result = [];
        }

        // Ẩn loading và hiển thị kết quả
        document.getElementById("loading").style.display = "none";
        displayResult(result);
    }, 1500); // Đặt độ trễ 2 giây để hiển thị loading
}
