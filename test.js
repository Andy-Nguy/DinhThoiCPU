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

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

let tg_cho = new Array(100);
let tg_hoantat = new Array(100);
let tg_cho_tb = 0;
let tg_ht_tb = 0;
let tamTT = new Array(100);
let tamDen = new Array(100);
let tgxl = new Array(100);
let tg_den = new Array(100);
let tien_trinh_nghi = new Array(100);
let tt = new Array(100);
let vtcu = new Array(100);
let sl_tt = 0;
let quantum = 0;
let sl = 0;

function NhapTienTrinh() {
    return new Promise((resolve) => {
        readline.question("Nhap so tien trinh: ", (sl) => {
            sl_tt = parseInt(sl);
            let promises = [];
            for (let i = 0; i < sl_tt; i++) {
                promises.push(new Promise((resolve) => {
                    readline.question(`\nNhap du lieu chi tiet cho tien trinh thu ${i + 1}\nThoi gian den hang doi: `, (tgDen) => {
                        tamDen[i] = parseInt(tgDen);
                        readline.question("Thoi gian xu ly: ", (tgXuLy) => {
                            tg_den[i] = tamDen[i];
                            tgxl[i] = parseInt(tgXuLy);
                            tamTT[i] = tgxl[i];
                            tg_cho[i] = 0;
                            tg_hoantat[i] = 0;
                            tt[i] = i + 1;
                            resolve();
                        });
                    });
                }));
            }
            Promise.all(promises).then(() => {
                readline.question("\nNhap thoi gian xoay vong (Time Quantum): ", (q) => {
                    quantum = parseInt(q);
                    resolve();
                });
            });
        });
    });
}

function XuatTienTrinh() {
    console.log("Tien trinh\tTG den RL\tTG xu ly\tTG cho\tTG hoan tat");
    for (let i = 0; i < sl_tt; i++) {
        console.log(`P[${tt[i]}]\t\t${tg_den[i]}\t\t${tgxl[i]}\t\t${tg_cho[i].toFixed(2)}\t${tg_hoantat[i].toFixed(2)}`);
    }
    console.log(`\nThoi gian cho trung binh: ${tg_cho_tb.toFixed(2)}`);
    console.log(`Thoi gian hoan tat trung binh: ${tg_ht_tb.toFixed(2)}`);
    console.log();
}

function xoa(vt) {
    for (let i = vt; i < sl; i++) {
        tamTT[i] = tamTT[i + 1];
        tamDen[i] = tamDen[i + 1];
        vtcu[i] = vtcu[i + 1];
    }
    sl--;
}

function chen(vt, gt, gtden, gtvtcu) {
    for (let i = sl; i > vt; i--) {
        tamTT[i] = tamTT[i - 1];
        tamDen[i] = tamDen[i - 1];
        vtcu[i] = vtcu[i - 1];
    }
    tamTT[vt] = gt;
    tamDen[vt] = gtden;
    vtcu[vt] = gtvtcu;
    sl++;
}

function RoundRobin() {
    tg_ht_tb = 0;
    tg_cho_tb = 0;
    tg_cho[0] = 0;
    let i, tong_tg_chay = 0;
    for (i = 0; i < sl_tt; i++) {
        let j = i + 1;
        for (; j < sl_tt; j++) {
            if (tg_den[i] > tg_den[j]) {
                let t = tg_den[i];
                tg_den[i] = tg_den[j];
                tg_den[j] = t;
                t = tgxl[i];
                tgxl[i] = tgxl[j];
                tgxl[j] = t;
                t = tt[i];
                tt[i] = tt[j];
                tt[j] = t;
                tien_trinh_nghi[i] = 0;
            }
        }
        vtcu[i] = i;
        tamTT[i] = tgxl[i];
        tamDen[i] = tg_den[i];
    }
    
    sl = sl_tt;
    let j = 0;
    
    while (sl > 0) {
        tg_cho[vtcu[0]] += tong_tg_chay - tamDen[0] - tien_trinh_nghi[vtcu[0]];
        tamDen[0] = 0;
        
        if (tamTT[0] > quantum) {
            tong_tg_chay += quantum;
            tien_trinh_nghi[vtcu[0]] = tong_tg_chay;
            tamTT[0] -= quantum;
            j = 1;
            while (tamDen[j] < tong_tg_chay && j < sl) {
                j++;
            }
            if (tamDen[j] != tong_tg_chay) {
                j = sl;
            }
            chen(j, tamTT[0], tamDen[0], vtcu[0]);
            xoa(0);
        } else {
            tong_tg_chay += tamTT[0];
            tg_cho_tb += tg_cho[vtcu[0]];
            tg_hoantat[vtcu[0]] = tong_tg_chay - tg_den[vtcu[0]];
            tg_ht_tb += tg_hoantat[vtcu[0]];
            xoa(0);
        }
        
        tg_cho_tb /= sl_tt;
        tg_ht_tb /= sl_tt;
    }
}



async function main() {
    await NhapTienTrinh();
    RoundRobin();
    XuatTienTrinh();
    readline.close();
}

main();
