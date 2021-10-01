const channel = new BroadcastChannel('quiz_screen_state');
let quizState = {}

function sendCommand(cmd, payload="") {
    channel.postMessage(JSON.stringify({cmd, payload}))
}

function receiveCommand(ev) {
    document.getElementById("loading-card").classList.add("d-none")
    const message = JSON.parse(ev.data);
    switch (message.cmd) {
        case "findScreens":
            sendCommand("getState")
            sendCommand("screenRegistered")
            break
        case "currentState":
            quizState = message.payload
            break
    }
    refreshUI()
}

function createQuestionDetails(categorySlug, questionIndex) {
    let question = quizState["categories"][categorySlug]["questions"][questionIndex]

    const row = tag("div", {className: "row"})
    const card = createCard(quizState["showAnswer"] ? question["a"] : question["q"], question["scoredBy"]);
    card.classList.add("expand")
    row.appendChild(card)
    return row
}

function refreshUI() {
    document.getElementsByTagName("h1")[0].textContent = quizState["title"] || "Quiz"

    let quizContent
    if (quizState["selectedQuestion"]) {
        let [categorySlug, questionIndex] = quizState["selectedQuestion"]
        if (quizState)
        quizContent = createQuestionDetails(categorySlug, questionIndex)
    } else {
        quizContent = createGrid(quizState)
    }
    const quiz = document.getElementById("quiz-cards");
    quiz.innerHTML = ""
    quiz.appendChild(quizContent)

    // document.getElementById("debug-output").textContent = JSON.stringify(quizFile, null, 2)
    // document.getElementById("debug-output").classList.remove("d-none")
}

channel.onmessage = receiveCommand

sendCommand("getState")
sendCommand("screenRegistered")
