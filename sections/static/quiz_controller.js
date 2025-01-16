const channel = new BroadcastChannel("quiz_screen_state");
let quizState = {}
let transientState = {}

function broadcastState() {
    sendCommand("currentState", quizState);
}

function sendCommand(cmd, payload = "") {
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
    // document.querySelector("#debug-output").textContent = JSON.stringify(quizState, null, 2)
    // document.querySelector("#debug-output").classList.remove("d-none")
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

function navigateTo(question) {
    updateState("selectedQuestion", question)
    updateState("showAnswer", false)
    history.pushState({"selectedQuestion": question}, "", "")
}

function onCardClick(categorySlug, questionIndex) {
    const question = [categorySlug, questionIndex];
    navigateTo(question)
    updateState(["categories", categorySlug, "questions", questionIndex, "visited"], true)
}

function createQuestionDetails(categorySlug, questionIndex) {
    const questionStatePath = ["categories", categorySlug, "questions", questionIndex]
    let question = quizState["categories"][categorySlug]["questions"][questionIndex]

    const questionDetails = elementFromTemplate("question-details")

    if (question["scoredBy"]) {
        questionDetails.querySelectorAll(".card").forEach(x => x.classList.add("scored-by-" + question["scoredBy"]))
    }
    const questionColumn = questionDetails.querySelector(".col.question");
    const answerColumn = questionDetails.querySelector(".col.answer");

    questionColumn.querySelector(".card-body").innerHTML = question["q"]
    answerColumn.querySelector(".card-body").innerHTML = question["a"]

    if (quizState["showAnswer"]) {
        questionColumn.style["opacity"] = 0.5
    } else {
        answerColumn.style["opacity"] = 0.5
    }

    const scoredByStatePath = questionStatePath.concat("scoredBy");
    function scoreForTeam(team) {
        updateState(scoredByStatePath, question["scoredBy"] === team ? null : team)
    }
    function updateTeamButton(team, btnClass) {
        const button = questionDetails.querySelector(".action-buttons .points-" + team);
        button.onclick = () => scoreForTeam(team)
        const scored = question["scoredBy"] === team;
        button.classList.add("btn-" + (scored ? "" : "outline-") + btnClass)
    }

    const buttonBack = questionDetails.querySelector(".action-buttons .back");
    const buttonShowAnswer = questionDetails.querySelector(".action-buttons .show-answer");

    updateTeamButton("teamA", "danger")
    updateTeamButton("teamB", "info")
    buttonBack.onclick = () => navigateTo(null)
    buttonShowAnswer.onclick = () => updateState("showAnswer", !quizState["showAnswer"])
    buttonShowAnswer.classList.add("btn-" + (quizState["showAnswer"] ? "" : "outline-") + "light")

    return questionDetails
}


function refreshUI() {
    const pageTitle = document.querySelector("h1");
    pageTitle.textContent = quizState["title"] || "Quiz"

    const quizContentNode = document.querySelector("#quiz-content")
    quizContentNode.innerHTML = ""

    const quizSelect = document.querySelector("#quiz-select-box");
    if (!quizState["quizFile"]) {
        quizSelect.selectedIndex = 0
        document.querySelector("#configurator-settings").classList.remove("d-none")
        document.querySelector("#two-screens-help").classList.add("d-none")
        return
    }
    for (let i in quizSelect.options) {
        if (quizState["quizFile"] === quizSelect.options[i].value) {
            quizSelect.selectedIndex = i
            break
        }
    }
    if (!(transientState["screenAvailable"])) {
        document.querySelector("#configurator-settings").classList.remove("d-none")
        document.querySelector("#two-screens-help").classList.remove("d-none")
        return
    }
    document.querySelector("#configurator-settings").classList.add("d-none")
    if (quizState["selectedQuestion"]) {
        let [categorySlug, questionIndex] = quizState["selectedQuestion"]
        let question = quizState["categories"][categorySlug]["questions"][questionIndex]
        if (question["title"]) {
            pageTitle.textContent = question["title"]
        }
        const content = createQuestionDetails(categorySlug, questionIndex)
        quizContentNode.appendChild(content)
    } else {
        quizContentNode.appendChild(createCategoryOverview(onCardClick))
    }
}


document.querySelector("#open-screen").onclick = ev => {
    let url = ev.target.dataset["url"]
    window.open(url, "_blank", "titlebar=no")
}

document.querySelector("#quiz-select-box").onchange = ev => {
    updateState("quizFile", ev.target.value)
    downloadQuizFile(ev.target.value)
}

document.querySelector("#reset-quiz").onclick = ev => {
    transientState = {}
    quizState = {}
    updateState(null, {})
    sendCommand("findScreens");
    history.replaceState(null, "", "")
}

window.onpopstate = function (event) {
    if (event.state) {
        updateState(null, event.state)
    } else {
        updateState("selectedQuestion", null)
    }
}

channel.onmessage = receiveCommand
sendCommand("controllerInit")
loadQuizState()

if (quizState["selectedQuestion"]) {
    history.pushState({"selectedQuestion": quizState["selectedQuestion"]}, "", "")
}
