function tag(tagName, options) {
    return Object.assign(document.createElement(tagName), options)
}

function sumPointsForTeam(teamName) {
    const categories = quizState["categories"];
    if (!categories) {
        return 0
    }
    const questions = Object.keys(categories).map((k, i) => categories[k]["questions"]).flat()
    const pointsArray = questions.filter(q => q["scoredBy"] === teamName)
    if (pointsArray.length > 0) {
        return pointsArray.map(q => q["points"]).reduce((p, c) => p + c)
    }
    return 0
}

function createGrid(quizState, cardOnclickCallback) {
    const grid = tag("div", {className: "grid"})
    if (!quizState) {
        return grid
    }
    for (let category_slug in quizState["categories"]) {
        let category = quizState["categories"][category_slug]
        const questions = category["questions"] || [];
        for (let i=0; i<questions.length; i++) {
            let question = questions[i]
            if (!question) {
                continue
            }
            const cardTitle = tag("div", {
                className: "card-title",
                textContent: category["title"] || category_slug
            })
            const points = tag("div", {
                className: "points",
                textContent: "🦆".repeat(question["points"])
            })
            const card = createCard(cardTitle.outerHTML + points.outerHTML, question["scoredBy"])
            if (cardOnclickCallback) {
                card.onclick = () => cardOnclickCallback(category_slug, i)
                card.classList.add("clickable")
            }
            card.classList.add("category")
            if (question["visited"]) {
                card.classList.add("visited")
            }
            grid.appendChild(card)
        }
    }
    return grid
}

function createCard(html, team=null) {
    const card = tag("div", {className: "card"})
    const body = tag("div", {className: "card-body"})
    body.innerHTML = html
    card.appendChild(body)
    if (team) {
        card.classList.add("scored-by-" + team)
    }
    return card
}

function refreshPointCards() {
    const pointsCardTeamA = document.getElementById("points-card-teamA")
    const pointsCardTeamB = document.getElementById("points-card-teamB")

    const  pointsTeamA = sumPointsForTeam("teamA")
    const  pointsTeamB = sumPointsForTeam("teamB")
    pointsCardTeamA.getElementsByClassName("card-header")[0].textContent = "A: " + pointsTeamA + (pointsTeamA === 1 ? " Duck" : " Ducks")
    pointsCardTeamA.getElementsByClassName("card-body")[0].textContent = "🦆".repeat(pointsTeamA)
    pointsCardTeamB.getElementsByClassName("card-header")[0].textContent = "B: " + pointsTeamB + (pointsTeamA === 1 ? " Duck" : " Ducks")
    pointsCardTeamB.getElementsByClassName("card-body")[0].textContent = "🦆".repeat(pointsTeamB)
}