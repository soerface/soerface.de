const channel = new BroadcastChannel("quiz_screen_state");
let quizState = {}
let transientState = {}

function broadcastState() {
    sendCommand("currentState", quizState);
}

function sendCommand(cmd, payload="") {
    channel.postMessage(JSON.stringify({cmd, payload}))
    refreshUI()
}

function receiveCommand(ev) {
    const message = JSON.parse(ev.data);
    switch (message.cmd) {
        case "getState":
            broadcastState();
            sendCommand("quizFile", transientState["quizFile"])
            break
        case "screenRegistered":
            transientState["screenAvailable"] = true
            console.log("Screen registered")
            break
    }
    refreshUI()
}

function loadQuizState() {
    let state = JSON.parse(localStorage.getItem("quizState") || "{}")
    for (const [k, v] of Object.entries(state)) {
        updateState(k, v)
    }
    refreshUI()
}

function saveQuizState() {
    localStorage.setItem("quizState", JSON.stringify(quizState))
    refreshUI()
}

function downloadQuizFile(filepath) {
    fetch(filepath).then(res => res.text()).then(res => {
        transientState["quizFile"] = JSON.parse(res)
        sendCommand("quizFile", transientState["quizFile"])
    })
}

function updateState(key, value) {
    quizState[key] = value
    broadcastState();
    if (key === "quizFile") {
        if (!transientState["screenAvailable"]) {
            sendCommand("findScreens");
        }
        downloadQuizFile(value);
    }
    saveQuizState()
}


function refreshUI() {
    const quizSelect = document.getElementById("quiz-select-box");
    const quiz = document.getElementById("quiz-cards");
    if (!quizState["quizFile"]) {
        quizSelect.selectedIndex = 0
        document.getElementById("two-screens-help").classList.add("d-none")
        quiz.innerHTML = ""
        return
    }
    for (let i in quizSelect.options) {
        if (quizState["quizFile"] === quizSelect.options[i].value) {
            quizSelect.selectedIndex = i
            break
        }
    }
    document.getElementById("two-screens-help").classList.remove("d-none")
    console.log(transientState)
    if (!(transientState["screenAvailable"] && transientState["quizFile"])) {
        return
    }
    const grid = createGrid(transientState["quizFile"])
    quiz.innerHTML = ""
    quiz.appendChild(grid)
}


document.getElementById("open-screen").onclick = ev => {
    let url = ev.target.dataset["url"]
    window.open(url, "_blank", "titlebar=no")
}

document.getElementById("quiz-select-box").onchange = ev => {
    updateState("quizFile", ev.target.value)
}

document.getElementById("reset-quiz").onclick = ev => {
    quizState = {}
    transientState = {}
    saveQuizState()
    sendCommand("quizFile", transientState["quizFile"])
}

channel.onmessage = receiveCommand
sendCommand("controllerInit")
loadQuizState()