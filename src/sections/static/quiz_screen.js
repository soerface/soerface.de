const channel = new BroadcastChannel('quiz_screen_state');
let quizState = {}
let quizFile = {}

function sendCommand(cmd, payload="") {
    channel.postMessage(JSON.stringify({cmd, payload}))
}

function receiveCommand(ev) {
    const message = JSON.parse(ev.data);
    switch (message.cmd) {
        case "findScreens":
            sendCommand("getState")
            sendCommand("screenRegistered")
            break
        case "currentState":
            quizState = message.payload
            refreshUI()
            break
        case "quizFile":
            quizFile = message.payload
            refreshUI()
            break
    }
    document.getElementById("loading-card").classList.add("d-none")
}

function refreshUI() {
    document.getElementsByTagName("h1")[0].textContent = quizFile["title"] || "Quiz"
    const grid = document.createElement("div")
    grid.className = "grid"
    for (let category_slug in quizFile["categories"]) {
        let category = quizFile["categories"][category_slug]
        const questions = category["questions"] || [];
        for (let question of questions) {
            if (!question) {
                continue
            }
            const card = document.createElement("div")
            card.classList.add("question")
            card.classList.add("card")
            const cardBody = document.createElement("div")
            cardBody.className = "card-body"
            const cardTitle = document.createElement("div")
            cardTitle.className = "card-title"
            cardTitle.textContent = category["title"] || category_slug
            const points = document.createElement("div")
            points.className = "points"
            points.textContent = question["points"]
            cardBody.appendChild(cardTitle)
            cardBody.appendChild(points)
            card.appendChild(cardBody)
            grid.appendChild(card)
        }
    }

    const quiz = document.getElementById("quiz");
    quiz.innerHTML = ""
    quiz.appendChild(grid)

    // document.getElementById("debug-output").textContent = JSON.stringify(quizFile, null, 2)
    // document.getElementById("debug-output").classList.remove("d-none")
}

channel.onmessage = receiveCommand

sendCommand("getState")
sendCommand("screenRegistered")
