const VERSION = '1.2';
const NUM_ROOMS = 11;
const WARNING_TIME = 180; // 3분 남았을 때
const firstRow = document.getElementById("first-row"); // 첫 번째 행
const secondRow = document.getElementById("second-row"); // 두 번째 행
let timers = [];

document.addEventListener('DOMContentLoaded', function() {
    let title = document.getElementsByTagName('h4')[0];
    title.textContent = title.textContent + " " + VERSION;

    createRooms();
});

// 방 생성
function createRooms() {
    // 로컬 저장소에서 기존 데이터 불러오기
    const savedTimers = JSON.parse(localStorage.getItem("timers")) || [];

    for (let i = 1; i <= NUM_ROOMS; i++) {
        let div = document.createElement("div");
        div.className = "room";
        div.id = "room" + i;

        let input = document.createElement("input");
        input.type = "number";
        input.value = 13; // 기본값 13분
        input.min = "1";

        let startButton = document.createElement("button");
        startButton.textContent = "시작";

        let resetButton = document.createElement("button");
        resetButton.textContent = "초기화";
        resetButton.style.display = "none"; // 처음에는 보이지 않도록 설정

        let timerDisplay = document.createElement("div");

        div.appendChild(document.createTextNode(`방 ${i}`));
        div.appendChild(document.createElement("br"));
        div.appendChild(input);
        div.appendChild(document.createTextNode("분 "));
        div.appendChild(startButton);
        div.appendChild(resetButton);
        div.appendChild(document.createElement("br"));
        div.appendChild(timerDisplay);

        // 첫 번째 행과 두 번째 행 나누기
        if (i <= 6) {
            firstRow.appendChild(div); // 첫 번째 행에 추가
        } else {
            secondRow.appendChild(div); // 두 번째 행에 추가
        }

        timers.push({
            element: div,
            timeLeft: 13 * 60, // 기본값 13분 (초로 변환)
            interval: null,
            input: input,
            display: timerDisplay,
            startButton: startButton,
            resetButton: resetButton,
            buttonState: 'start', // 시작 버튼 상태
            startTime: null,
            started: false // 타이머 진행 여부 추가
        });

        // 기본 13:00을 표시하기 위해 초기 상태로 화면 갱신
        updateDisplay(i - 1);

        startButton.addEventListener("click", () => startTimer(i - 1));
        resetButton.addEventListener("click", () => resetTimer(i - 1));
    }

    savedTimers.forEach((savedTimer, index) => {
        const timer = timers[index];

        if (savedTimer && savedTimer.timeLeft !== null && savedTimer.startTime !== null) {
            const elapsedTime = Math.floor((Date.now() - savedTimer.startTime) / 1000); // 경과 시간 계산
            const timeRemaining = savedTimer.timeLeft - elapsedTime;

            if (timeRemaining > 0) {
                // 남은 시간이 아직 유효하면 그 값으로 설정
                timer.timeLeft = timeRemaining;
                timer.startTime = savedTimer.startTime;
                updateDisplay(index); // 화면에 초기 시간 갱신

                // 타이머가 진행 중이면 이어서 진행
                startTimer(index); // 타이머 이어서 시작
            } else {
                // 경과 시간이 timeLeft보다 크면 기본값으로 초기화
                timer.timeLeft = 13 * 60;
                timer.startTime = null;
                updateDisplay(index);
            }
        } else {
            // 로컬스토리지에 유효한 값이 없거나 timeLeft가 null이면 기본값으로 초기화
            timer.timeLeft = 13 * 60;
            timer.startTime = null;
            updateDisplay(index);
        }
    });
}

// 로컬 저장소에 타이머 상태 저장
function saveTimers() {
    localStorage.setItem("timers", JSON.stringify(timers.map(t => ({
        timeLeft: t.timeLeft, // 남은 시간
        startTime: t.startTime, // 타이머 시작 시간
    }))));
}

// 타이머 시작
function startTimer(index) {
    let timer = timers[index];

    if (timer.interval) clearInterval(timer.interval);

    // 타이머가 시작된 적이 없다면, 새로운 startTime을 설정
    if (!timer.startTime) {
        timer.startTime = Date.now(); // 타이머 시작 시간을 현재 시간으로 설정
    }

    // 로컬 스토리지에서 저장된 상태와 경과 시간에 맞춰 타이머 진행
    const savedTimers = JSON.parse(localStorage.getItem("timers")) || [];
    const savedTimer = savedTimers[index];

    if (savedTimer && savedTimer.startTime) {
        // 새로 고침 후 이전 타이머 상태를 이어서 계산
        const elapsedTime = Math.floor((Date.now() - savedTimer.startTime) / 1000); // 경과 시간 계산
        const newTimeLeft = savedTimer.timeLeft - elapsedTime;

        if (newTimeLeft > 0) {
            // 타이머 상태 갱신
            timer.timeLeft = newTimeLeft;
        } else {
            // 시간이 0보다 적으면 타이머 종료
            timer.timeLeft = 0;
            clearInterval(timer.interval);
        }
    }

    // 타이머를 1초 간격으로 갱신
    timer.interval = setInterval(() => {
        let elapsedTime = Math.floor((Date.now() - timer.startTime) / 1000); // 경과 시간 계산

        // 남은 시간 계산 (타이머 시작 시점과 현재 시간의 차이)
        let newTimeLeft = (parseInt(timer.input.value) * 60) - elapsedTime;

        // 경과 시간만큼 남은 시간을 조정
        timer.timeLeft = Math.max(0, newTimeLeft);

        updateDisplay(index); // 화면에 타이머 표시

        if (timer.timeLeft <= 0) {
            clearInterval(timer.interval); // 타이머 종료 시 interval 정리
            timer.display.textContent = "완료!";
            timer.element.classList.remove("started"); // 타이머 종료 후 배경 원래대로
            saveTimers(); // 타이머 상태 저장 (종료 상태)

            // 종료 후 버튼 상태 변경
            timer.startButton.style.display = "none";
            timer.resetButton.style.display = "inline-block"; // reset 버튼 보이기
            timer.input.setAttribute('readonly', true); // input을 읽기 전용으로 설정
            timer.input.classList.add('readonly'); // 시각적으로 읽기 전용 스타일 적용
        }
    }, 1000);

    // 버튼 상태 변경: 시작 버튼 숨기고 reset 버튼 보이게
    timer.startButton.style.display = "none";
    timer.resetButton.style.display = "inline-block"; // reset 버튼 보이기
    timer.input.setAttribute('readonly', true); // 타이머 시작 시 input을 읽기 전용으로 설정
    timer.input.classList.add('readonly'); // 시각적으로 읽기 전용 스타일 적용

    saveTimers(); // 로컬 저장소에 타이머 상태 저장

    // 타이머 시작 시 해당 방에 .started 클래스 추가
    timer.element.classList.add("started");
}

// 타이머 리셋
function resetTimer(index) {
    let timer = timers[index];

    // 타이머 초기화
    clearInterval(timer.interval); // 기존 interval 정리
    timer.timeLeft = 13 * 60; // 기본 13분으로 초기화
    timer.startTime = null; // 시작 시간 초기화
    updateDisplay(index); // 화면에 타이머 표시

    // 리셋 후 버튼 상태 변경
    timer.startButton.style.display = "inline-block"; // 시작 버튼 보이기
    timer.resetButton.style.display = "none"; // reset 버튼 숨기기

    // started 클래스 제거하여 배경색을 원래대로 돌려놓음
    timer.element.classList.remove("started");
    timer.element.classList.remove("warning");

    // input 필드의 readonly 속성 제거 및 시각적 스타일 복원
    timer.input.removeAttribute('readonly'); // readonly 속성 제거
    timer.input.classList.remove('readonly'); // 시각적 스타일 제거

    saveTimers(); // 로컬 저장소에 타이머 상태 저장
}


// 타이머 화면 표시 업데이트
function updateDisplay(index) {
    let timer = timers[index];
    let minutes = Math.floor(timer.timeLeft / 60);
    let seconds = timer.timeLeft % 60;
    timer.display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timer.timeLeft - WARNING_TIME <= 0) {
        timer.element.classList.add("warning");
    } else {
        timer.element.classList.remove("warning");
    }
}
