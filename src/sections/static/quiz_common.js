function createGrid(quizFile) {
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
    return grid
}