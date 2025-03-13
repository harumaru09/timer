const VERSION = '1.1';
const NUM_ROOMS = 11;
const WARNING_TIME = 180; // 3분 남았을 때
const rooms = document.getElementById("rooms");
let timers = [];

document.addEventListener('DOMContentLoaded', function() {
    let title = document.getElementsByTagName('h1')[0];
    title.textContent = title.textContent + " " + VERSION;

    createRooms();
    restoreTimers(); // 페이지 로드 시 타이머 상태 복원
});

// 방 생성
function createRooms() {
    for (let i = 1; i <= NUM_ROOMS; i++) {
        let div = document.createElement("div");
        div.className = "room col-6 col-sm-2";
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
            timeLeft: 13 * 60, // 기본값 13분 (초로 변환)
            interval: null,
            input: input,
            display: timerDisplay,
            button: button,
            startTime: null
        });

        // 기본 13:00을 표시하기 위해 초기 상태로 화면 갱신
        updateDisplay(i - 1);

        button.addEventListener("click", () => startTimer(i - 1));
    }
}

// 기존 타이머 상태 복원
function restoreTimers() {
    const savedTimers = loadTimers();

    savedTimers.forEach((savedTimer, index) => {
        const timer = timers[index];
        if (savedTimer && savedTimer.timeLeft !== null) {
            timer.timeLeft = savedTimer.timeLeft;
            timer.startTime = savedTimer.startTime;
            updateDisplay(index);

            if (savedTimer.interval === 'active') {
                startTimer(index);  // 타이머가 진행 중일 경우 타이머 다시 시작
            } else {
                timer.display.textContent = `${Math.floor(timer.timeLeft / 60)}:${timer.timeLeft % 60}`;
            }
        }
    });
}

// 로컬 저장소에서 기존 데이터 불러오기
function loadTimers() {
    const savedData = JSON.parse(localStorage.getItem("timers")) || [];
    return savedData;
}

// 로컬 저장소에 타이머 상태 저장
function saveTimers() {
    localStorage.setItem("timers", JSON.stringify(timers.map(t => ({
        timeLeft: t.timeLeft,
        startTime: t.startTime,
        interval: t.interval ? 'active' : 'inactive' // 타이머가 진행 중이면 active
    }))));
}

// 타이머 시작
function startTimer(index) {
    let timer = timers[index];

    if (timer.interval) clearInterval(timer.interval);

    timer.timeLeft = parseInt(timer.input.value) * 60; // 입력한 시간(분)을 초로 변환
    timer.startTime = Date.now(); // 타이머 시작 시간을 현재 시간으로 설정
    saveTimers(); // 로컬 저장소에 타이머 상태 저장

    // 타이머를 1초 간격으로 갱신
    timer.interval = setInterval(() => {
        let elapsedTime = Math.floor((Date.now() - timer.startTime) / 1000); // 경과 시간 계산
        timer.timeLeft = Math.max(0, timer.timeLeft - elapsedTime); // 남은 시간 갱신

        updateDisplay(index); // 화면에 타이머 표시

        if (timer.timeLeft <= 0) {
            clearInterval(timer.interval); // 타이머 종료 시 interval 정리
            timer.display.textContent = "완료!";
            timer.element.classList.remove("started"); // 타이머 종료 후 배경 원래대로
            saveTimers(); // 타이머 상태 저장 (종료 상태)
        }
    }, 1000);

    // 타이머 시작 시 해당 방에 .started 클래스 추가
    timer.element.classList.add("started");
}

// 타이머 화면 표시 업데이트
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

// 알람 소리 (선택 사항)
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
