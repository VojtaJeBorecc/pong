const clickSound = new Audio("audio/click.mp3")
clickSound.volume = 0.125

function PlayClickSound(){
    clickSound.currentTime = 0
    clickSound.play()
}

document.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return

    PlayClickSound()
})

PlayClickSound()