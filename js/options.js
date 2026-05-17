updateUI()

function setData(dataName, value){
    localStorage.setItem(dataName, value)
    updateUI();
}

function updateUI() {
    const score = localStorage.getItem("scoreToWin")

    document.querySelectorAll(".buttonRow")[0].querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("selectedButton", btn.textContent === score) // togglneme selectedButton podle toho jestli btn.textContent === score
    })

    const speed = localStorage.getItem("paddleSpeed")

    document.querySelectorAll(".buttonRow")[1].querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("selectedButton", btn.textContent === speed)
    })

    const ballSpeedGain = localStorage.getItem("ballSpeedGain")

    document.querySelectorAll(".buttonRow")[2].querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("selectedButton", btn.textContent === ballSpeedGain)
    })
}