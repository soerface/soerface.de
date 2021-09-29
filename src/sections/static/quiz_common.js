function createGrid(quizState, cardOnclickCallback) {
    const grid = document.createElement("div")
    grid.className = "grid"
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
            const card = document.createElement("div")
            card.classList.add("question")
            card.classList.add("card")
            if (cardOnclickCallback) {
                card.onclick = () => cardOnclickCallback(category_slug, i)
                card.classList.add("clickable")
            }
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
    return grid
}