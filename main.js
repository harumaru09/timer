const VERSION = '1.0';
const NUM_ROOMS = 11;
const WARNING_TIME = 180; // 3분 남았을 때
const rooms = document.getElementById("rooms");
let timers = [];

document.addEventListener('DOMContentLoaded', function() {
    let title = document.getElementsByTagName('h1')[0];
    title.textContent = title.textContent + " " + VERSION;

    createRooms();

    restoreTimers();
});

// 로컬 저장소에서 기존 데이터 불러오기
function loadTimers() {
    const savedData = JSON.parse(localStorage.getItem("timers")) || [];
    return savedData.length === NUM_ROOMS ? savedData : Array(NUM_ROOMS).fill(null);
}

function createRooms() {
    // 방 생성
    for (let i = 1; i <= NUM_ROOMS; i++) {
        let div = document.createElement("div");
        div.className = "room";
        div.id = "room" + i;

        let input = document.createElement("input");
        input.type = "number";
        input.value = 13; // 기본값 13분
        input.min = "1";

        let button = document.createElement("button");
        button.textContent = "시작";

        let timerDisplay = document.createElement("div");

        div.appendChild(document.createTextNode(`방 ${i}`));
        div.appendChild(document.createElement("br"));
        div.appendChild(input);
        div.appendChild(document.createTextNode("분 "));
        div.appendChild(button);
        div.appendChild(document.createElement("br"));
        div.appendChild(timerDisplay);
        rooms.appendChild(div);

        timers.push({
            element: div,
            timeLeft: 0,
            interval: null,
            input: input,
            display: timerDisplay,
            button: button,
            startTime: null
        });

        button.addEventListener("click", () => startTimer(i - 1));
    }
}


function saveTimers() {
    localStorage.setItem("timers", JSON.stringify(timers.map(t => t.timeLeft)));
}

function startTimer(index) {
    let timer = timers[index];

    if (timer.interval) clearInterval(timer.interval);

    timer.timeLeft = parseInt(timer.input.value) * 60;
    timer.startTime = Date.now();
    saveTimers();

    timer.interval = setInterval(() => {
        let elapsedTime = Math.floor((Date.now() - timer.startTime) / 1000);
        timer.timeLeft = Math.max(0, timer.timeLeft - elapsedTime);
        updateDisplay(index);

        if (timer.timeLeft <= 0) {
            clearInterval(timer.interval);
            timer.display.textContent = "완료!";
            // playAlarm();
        }
    }, 1000);
}

function updateDisplay(index) {
    let timer = timers[index];
    let minutes = Math.floor(timer.timeLeft / 60);
    let seconds = timer.timeLeft % 60;
    timer.display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timer.timeLeft <= WARNING_TIME) {
        timer.element.classList.add("warning");
    } else {
        timer.element.classList.remove("warning");
    }
}

function restoreTimers() {
    let savedTimers = loadTimers();
    savedTimers.forEach((time, index) => {
        if (time !== null) {
            timers[index].timeLeft = time;
            timers[index].startTime = Date.now();
            updateDisplay(index);
            startTimer(index);
        }
    });
}

function playAlarm() {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();

    oscillator.type = 'square';  // 'sine', 'square', 'triangle', 'sawtooth' 중 선택
    oscillator.frequency.setValueAtTime(528, audioContext.currentTime); // 주파수 (Hz)
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();  // 소리 시작
    setTimeout(function() {
        oscillator.stop();  // 1초 후에 소리 멈추기
    }, 500);  // 0.5초(1000ms) 후 멈추도록 설정
}