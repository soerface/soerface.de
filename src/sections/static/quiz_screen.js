const channel = new BroadcastChannel('quiz_screen_state');
let quizState = {}

function sendCommand(cmd, payload="") {
    channel.postMessage(JSON.stringify({cmd, payload}))
}

function receiveCommand(ev) {
    document.querySelector("#loading-card").classList.add("d-none")
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

    const card = createCard(quizState["showAnswer"] ? question["a"] : question["q"], question["scoredBy"]);
    card.classList.add("expand")
    return card
}

function refreshUI() {
    const pageTitle = document.querySelector("h1");
    pageTitle.textContent = quizState["title"] || "Quiz"

    const questionDetails = document.querySelector("#question-details")
    questionDetails.innerHTML = ""
    if (!quizState["quizFile"]) {
        document.querySelector("#main-screen").classList.add("d-none")
    } else if (quizState["selectedQuestion"]) {
        let [categorySlug, questionIndex] = quizState["selectedQuestion"]
        let question = quizState["categories"][categorySlug]["questions"][questionIndex]
        if (question["title"]) {
            pageTitle.textContent = question["title"]
        }
        document.querySelector("#main-screen").classList.add("d-none")
        questionDetails.appendChild(createQuestionDetails(categorySlug, questionIndex))
    } else {
        document.querySelector("#main-screen").classList.remove("d-none")

        refreshPointCards()

        const quiz = document.querySelector("#quiz-cards");
        quiz.innerHTML = ""
        quiz.appendChild(createGrid(quizState))
    }

    // document.querySelector("#debug-output").textContent = JSON.stringify(quizFile, null, 2)
    // document.querySelector("#debug-output").classList.remove("d-none")
}

channel.onmessage = receiveCommand

sendCommand("getState")
sendCommand("screenRegistered")

document.querySelector("#mainContent").style["max-width"] = "none"