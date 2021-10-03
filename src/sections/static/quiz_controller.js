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

    const questionColumn = tag("div", {className: "col-md-6"})
    questionColumn.appendChild(tag("h3", {textContent: "Question", className: "text-light"}))
    questionColumn.appendChild(createCard(question["q"], question["scoredBy"]))
    const answerColumn = tag("div", {className: "col-md-6"})
    answerColumn.appendChild(tag("h3", {textContent: "Answer", className: "text-light"}))
    answerColumn.appendChild(createCard(question["a"], question["scoredBy"]))
    if (!quizState["showAnswer"]) {
        answerColumn.style["opacity"] = 0.5
    } else {
        questionColumn.style["opacity"] = 0.5
    }

    const cardRow = tag("div", {className: "row"})
    cardRow.appendChild(questionColumn)
    cardRow.appendChild(answerColumn)

    const scoredByStatePath = questionStatePath.concat("scoredBy");
    function scoreForTeam(team) {
        updateState(scoredByStatePath, question["scoredBy"] === team ? null : team)
    }

    const backButton = tag("button", {
        className: "btn btn-lg btn-outline-light",
        textContent: "‹ Back"
    })
    backButton.onclick = () => navigateTo(null)
    const teamAPointsButton = tag("button", {
        className: "btn btn-lg " + (question["scoredBy"] === "teamA" ? "btn-danger" : "btn-outline-danger"),
        textContent: "Points for Team A",
    });
    teamAPointsButton.onclick = () => scoreForTeam("teamA")
    const toggleAnswerButton = tag("button", {
        className: "btn btn-lg " + (quizState["showAnswer"] ? "btn-light" : "btn-outline-light"),
        textContent: "Show Answer",
    });
    toggleAnswerButton.onclick = () => updateState("showAnswer", !quizState["showAnswer"])
    const teamBPointsButton = tag("button", {
        className: "btn btn-lg " + (question["scoredBy"] === "teamB" ? "btn-info" : "btn-outline-info"),
        textContent: "Points for Team B",
    });
    teamBPointsButton.onclick = () => scoreForTeam("teamB")
    const buttonGroup = tag("div", {className: "btn-group ml-3"})
    buttonGroup.appendChild(teamAPointsButton)
    buttonGroup.appendChild(toggleAnswerButton)
    buttonGroup.appendChild(teamBPointsButton)

    const buttonRow = tag("div", {className: "row d-flex justify-content-center m-3"})
    buttonRow.appendChild(backButton)
    buttonRow.appendChild(buttonGroup)

    const wrapper = tag("div")
    wrapper.appendChild(cardRow)
    wrapper.appendChild(buttonRow)
    return wrapper
}


function refreshUI() {
    const pageTitle = document.querySelector("h1");
    pageTitle.textContent = quizState["title"] || "Quiz"

    const quizSelect = document.querySelector("#quiz-select-box");
    const questionDetails = document.querySelector("#question-details")
    questionDetails.innerHTML = ""
    if (!quizState["quizFile"]) {
        quizSelect.selectedIndex = 0
        document.querySelector("#configurator-settings").classList.remove("d-none")
        document.querySelector("#two-screens-help").classList.add("d-none")
        document.querySelector("#main-screen").classList.add("d-none")
        return
    }
    for (let i in quizSelect.options) {
        if (quizState["quizFile"] === quizSelect.options[i].value) {
            quizSelect.selectedIndex = i
            break
        }
    }
    document.querySelector("#two-screens-help").classList.remove("d-none")
    if (!(transientState["screenAvailable"])) {
        document.querySelector("#configurator-settings").classList.remove("d-none")
        return
    }
    document.querySelector("#configurator-settings").classList.add("d-none")
    if (quizState["selectedQuestion"]) {
        document.querySelector("#main-screen").classList.add("d-none")
        let [categorySlug, questionIndex] = quizState["selectedQuestion"]
        let question = quizState["categories"][categorySlug]["questions"][questionIndex]
        if (question["title"]) {
            pageTitle.textContent = question["title"]
        }
        questionDetails.appendChild(createQuestionDetails(categorySlug, questionIndex))
    } else {
        document.querySelector("#main-screen").classList.remove("d-none")
        refreshPointCards()

        const quiz = document.querySelector("#quiz-cards");
        quiz.innerHTML = ""
        quiz.appendChild(createGrid(quizState, onCardClick))
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