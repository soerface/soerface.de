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
    document.getElementById("debug-output").textContent = JSON.stringify(quizState, null, 2)
    document.getElementById("debug-output").classList.remove("d-none")
}

function downloadQuizFile(filepath) {
    fetch(filepath).then(res => res.text()).then(res => {
        updateState(null, JSON.parse(res))
    })
}

function _deepUpdateVariable(variable, keyPath, value) {
    let [head, ...tail] = keyPath
    if (tail.length > 0) {
        _deepUpdateVariable(variable[head], tail, value)
    } else {
        variable[head] = value
    }
}

function updateState(key, value) {
    if (key == null) {
        Object.assign(quizState, value)
    } else if (typeof key == "string") {
        _deepUpdateVariable(quizState, key.split("."), value)
    } else {
        _deepUpdateVariable(quizState, key, value)
    }
    broadcastState();
    if (key === "quizFile") {
        if (!transientState["screenAvailable"]) {
            sendCommand("findScreens");
        }
    }
    saveQuizState()
}

function onCardClick(category_slug, question_index) {
    updateState(["categories", category_slug, "questions", question_index, "points"], 0)
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
    if (!(transientState["screenAvailable"])) {
        return
    }
    const grid = createGrid(quizState, onCardClick)
    quiz.innerHTML = ""
    quiz.appendChild(grid)
}


document.getElementById("open-screen").onclick = ev => {
    let url = ev.target.dataset["url"]
    window.open(url, "_blank", "titlebar=no")
}

document.getElementById("quiz-select-box").onchange = ev => {
    updateState("quizFile", ev.target.value)
    downloadQuizFile(ev.target.value)
}

document.getElementById("reset-quiz").onclick = ev => {
    quizState = {}
    transientState = {}
    saveQuizState()
}

channel.onmessage = receiveCommand
sendCommand("controllerInit")
loadQuizState()