const channel = new BroadcastChannel("quiz_screen_state");
let quizState = {}
let transientState = {}

function broadcastState() {
    sendCommand("currentState", quizState);
}

function sendCommand(cmd, payload="") {
    channel.postMessage(JSON.stringify({cmd, payload}))
}

function receiveCommand(ev) {
    const message = JSON.parse(ev.data);
    switch (message.cmd) {
        case "getState":
            broadcastState();
            sendCommand("quizFile", transientState["quiz"])
            break
        case "screenRegistered":
            transientState["screenAvailable"] = true
            console.log("Screen registered")
            break
    }
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
        transientState["quiz"] = JSON.parse(res)
        sendCommand("quizFile", transientState["quiz"])
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
    const quiz_select = document.getElementById("quiz-select-box");
    if (quizState["quizFile"]) {
        for (let i in quiz_select.options) {
            if (quizState["quizFile"] === quiz_select.options[i].value) {
                quiz_select.selectedIndex = i
                break
            }
        }
        document.getElementById("two-screens-help").classList.remove("d-none")
    } else {
        quiz_select.selectedIndex = 0
        document.getElementById("two-screens-help").classList.add("d-none")
    }
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
    sendCommand("quizFile", transientState["quiz"])
}

channel.onmessage = receiveCommand
sendCommand("controllerInit")
loadQuizState()