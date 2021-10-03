function tag(tagName, options) {
    return Object.assign(document.createElement(tagName), options)
}

function elementFromTemplate(templateName) {
    const template = document.querySelector("template#" + templateName)
    return template.content.firstElementChild.cloneNode(true)
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

function createGrid(cardOnclickCallback) {
    const grid = tag("div", {className: "grid"})
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
            const card = createCard(cardTitle.outerHTML + points.outerHTML)
            if (cardOnclickCallback) {
                card.onclick = () => cardOnclickCallback(category_slug, i)
                card.classList.add("clickable")
            }
            card.classList.add("category")
            if (question["scoredBy"]) {
                card.classList.add("scored-by-" + question["scoredBy"])
            }
            if (question["visited"]) {
                card.classList.add("visited")
            }
            grid.appendChild(card)
        }
    }
    return grid
}

function createCard(bodyHtml, headerHtml=null) {
    let card
    if (headerHtml) {
        card = elementFromTemplate("empty-header-card")
        card.querySelector(".card-header").innerHTML = headerHtml
    } else {
        card = elementFromTemplate("empty-card")
    }
    card.querySelector(".card-body").innerHTML = bodyHtml
    return card
}

function createCategoryOverview(onCardClick=null) {
    function createPointCard(team, title, className) {
        const points = sumPointsForTeam(team)
        const ducks = points === 1 ? "Duck" : "Ducks"
        const card = createCard("🦆".repeat(points), title + ": " + points + " " + ducks)
        card.classList.add(className)
        card.querySelector(".card-header").classList.add("text-light")
        return card
    }
    const categoryOverview = elementFromTemplate("category-overview")
    const pointsColumn = categoryOverview.querySelector(".col.points")
    pointsColumn.appendChild(createPointCard("teamA", "A", "bg-danger"))
    pointsColumn.appendChild(createPointCard("teamB", "B", "bg-info"))
    const gridColumn = categoryOverview.querySelector(".col.quiz-cards")
    gridColumn.appendChild(createGrid(onCardClick))
    return categoryOverview
}
