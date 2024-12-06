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
    // Kiểm tra giá trị timeQuantum
    if (timeQuantum <= 0) {
        throw new Error("Time quantum phải là một số dương.");
    }

    let time = 0;  // Thời gian hiện tại
    let result = [];  // Lưu kết quả lên lịch
    let queue = [];  // Hàng đợi các tiến trình sẵn sàng thực thi
    let pending = [...processes];  // Danh sách các tiến trình đang chờ, sao chép từ processes

    // Sắp xếp các tiến trình theo thời gian đến ban đầu
    pending.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (queue.length > 0 || pending.length > 0) {
        // Thêm các tiến trình mới đến vào hàng đợi dựa trên thời gian đến
        while (pending.length > 0 && pending[0].arrivalTime <= time) {
            queue.push(pending.shift());
        }

        // Nếu hàng đợi trống nhưng vẫn còn tiến trình pending, nhảy tới thời gian đến của tiến trình tiếp theo
        if (queue.length === 0 && pending.length > 0) {
            // Cập nhật thời gian hiện tại tới thời gian đến của tiến trình pending tiếp theo
            time = pending[0].arrivalTime;
            continue;  // Bỏ qua phần còn lại của vòng lặp để kiểm tra lại các tiến trình mới đến
        }

        // Nếu hàng đợi trống và không còn tiến trình pending, dừng vòng lặp
        if (queue.length === 0) {
            break;
        }

        // Lấy tiến trình tiếp theo từ hàng đợi
        const process = queue.shift();  
        
        // Ghi lại thời gian bắt đầu và kết thúc của tiến trình này
        const timeToRun = Math.min(process.burstTime, timeQuantum);
        result.push({ id: process.id, start: time, end: time + timeToRun });

        // Cập nhật thời gian hiện tại
        time += timeToRun;

        // Giảm thời gian còn lại của tiến trình
        process.burstTime -= timeToRun;

        // Nếu tiến trình chưa hoàn thành, đưa lại vào hàng đợi
        if (process.burstTime > 0) {
            queue.push(process);
        }

        // Đảm bảo hàng đợi được thêm các tiến trình mới nếu thời gian đã qua
        // bằng cách thêm các tiến trình pending đã đến trong thời gian này
        while (pending.length > 0 && pending[0].arrivalTime <= time) {
            queue.push(pending.shift());
        }
    }

    return result;  // Trả về kết quả lịch trình
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

//Trang trí 
// Đóng Popup khi người dùng bấm nút
function closePopup() {
    const popup = document.getElementById("popup");
    popup.style.visibility = "hidden";
    popup.style.opacity = "0";
}

// Thêm hiệu ứng tuyết rơi động
document.addEventListener("DOMContentLoaded", function() {
    const snowflakes = ["❄️", "❆", "❅"];
    const numberOfSnowflakes = 100;

    for (let i = 0; i < numberOfSnowflakes; i++) {
        const snowflake = document.createElement("div");
        snowflake.classList.add("snowflake");
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + "%";
        snowflake.style.animationDuration = Math.random() * (12 - 8) + 8 + "s"; // Tạo tuyết rơi ngẫu nhiên
        document.body.appendChild(snowflake);
    }

    // Mở Popup sau 2 giây
    setTimeout(function() {
        const popup = document.getElementById("popup");
        popup.style.visibility = "visible";
        popup.style.opacity = "1";
    }, 2000);
});
