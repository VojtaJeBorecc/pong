const  canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

const paddleImage = new Image()
paddleImage.src = "textures/Paddle.png"

const pongHitSound = new Audio("audio/pongHit.mp3")
pongHitSound.volume = 0.25
const gameEndSound = new Audio("audio/gameEnd.mp3")
gameEndSound.volume = 0.65

const paddleSpeed = parseFloat(localStorage.getItem("paddleSpeed") || 0.8)


const musicIngame = new Audio("audio/musicIngame.mp3")
window.onload = () => {
    musicIngame.volume = 0.1
    musicIngame.loop = true
    musicIngame.currentTime = 0
    musicIngame.play()
}


import {keysDown} from "./keyModule.js"

const mapLimits = {
    MinX: 0,
    MaxX: 1450,

    MinY: 0,
    MaxY: 900
}

let resettingGameplay = false
const ballSpeedGain = parseFloat(localStorage.getItem("ballSpeedGain")) || 0.05 // každou kolizi

let ballPrefab = {
    Initialized: false,
    Move:false,

    Speed: 0.3,
    OriginalSpeed: 0.3,

    Color : "#ffffff",

    Direction: {
        X:0,
        Y:0,
    },

    Size: {
        X:30,
        Y:30
    },
    Position:{
        X:1350/2 - 30/2,
        Y:900/2 - 30/2,
    },
}
let balls = {
    Default : structuredClone(ballPrefab)
}

let paddles = {
    Left : {
        Color : "#f4ff4e",
        Speed: paddleSpeed,

        Size: {
            X: 30,
            Y: 150
        },
        Position : {
            X: 50,
            Y: 375,
        }
    },
    Right : {
        Color : "#f93e5d",
        Speed: paddleSpeed,

        Size: {
            X: 30,
            Y: 150
        },
        Position : {
            X: 1270,
            Y: 375,
        }
    },
}



let lastTime = 0
let totalBallTouches = 0

const winScore = parseInt(localStorage.getItem("scoreToWin")) || 3
let scoreLeft = 0
let scoreRight = 0

function UpdateBillboards(){
    document.getElementById("leftScore").textContent = scoreLeft
    document.getElementById("rightScore").textContent = scoreRight
}

function ResetGameplay(){
    for(let paddleName in paddles){
        let paddle = paddles[paddleName]
        paddle.Position.Y = 350
    }

    for(let ballName in balls){
        let ball = balls[ballName]

        ball.Move = false
        ball.Initialized = false

        ball.Direction = {X : 0, Y: 0}
        ball.Speed = ball.OriginalSpeed
        ball.Position = structuredClone(ballPrefab).Position
        ball.Trail = []

        console.log("Resetting ball pos")
    }
}


function CheckGameEnd(){
    if (scoreLeft >= winScore){
        return true
    }
    if (scoreRight >= winScore){
        return true
    }
    return false
}

function BallReachedOutOfBounds(ballOutOfBoundsOnSide){
    if(!resettingGameplay){
        if(ballOutOfBoundsOnSide === "Left"){
            scoreRight += 1
        }
        else if(ballOutOfBoundsOnSide === "Right"){
            scoreLeft += 1
        }
    }
    UpdateBillboards()
    resettingGameplay = true

    let gameFullyEnding = CheckGameEnd()

    if (gameFullyEnding){
        if(ballOutOfBoundsOnSide === "Left"){
            document.getElementById("winnerLabel").textContent = "Right Wins!"
        }
        else if(ballOutOfBoundsOnSide === "Right"){
            document.getElementById("winnerLabel").textContent = "Left Wins!"
        }

        gameEndSound.play()
        musicIngame.pause()
        document.getElementById("endFrame").style.display = "block" // ukážeme end screen
        return
    }

    setTimeout(() => {
        ResetGameplay()
        resettingGameplay = false
    }, 250)
}

function NegateBallDirection(ball, axis){
    if(axis.X){
        ball.Direction.X = -ball.Direction.X
        return
    }
    if(axis.Y){
        ball.Direction.Y = -ball.Direction.Y
    }
}
function BallTouching(ball){
    let touchingTable = {}
    if (ball.Position.Y <= mapLimits.MinY || ball.Position.Y + ball.Size.Y  >= mapLimits.MaxY){
        touchingTable.Y = true
    }

    for(let paddleName in paddles){
        let paddle = paddles[paddleName];

        const isOverlappingX = ball.Position.X < paddle.Position.X + paddle.Size.X && ball.Position.X + ball.Size.X > paddle.Position.X;
        const isOverlappingY = ball.Position.Y < paddle.Position.Y + paddle.Size.Y && ball.Position.Y + ball.Size.Y > paddle.Position.Y;

        if (isOverlappingX && isOverlappingY) {
            if (paddleName === "Left" && ball.Direction.X < 0) {
                ball.Position.X = paddle.Position.X + paddle.Size.X
                touchingTable.X = true
                touchingTable.Paddle = paddleName
            }
            else if (paddleName === "Right" && ball.Direction.X > 0) {
                ball.Position.X = paddle.Position.X - ball.Size.X
                touchingTable.X = true
                touchingTable.Paddle = paddleName
            }
        }
    }

    return touchingTable
}

function SetRandomBallDirection(ball){
    let randomSideX = Math.random()

    if (randomSideX > 0.5) {
        ball.Direction.X = 1
    }
    else{
        ball.Direction.X = -1
    }

    let randomSideY = Math.random()

    if (randomSideY > 0.5) {
        ball.Direction.Y = 1
    }
    else{
        ball.Direction.Y = -1
    }
}

function CheckBallOutOfBoundsSide(ball){
    if (ball.Position.X + ball.Size.X < mapLimits.MinX){
        return "Left"
    }
    if (ball.Position.X > mapLimits.MaxX){
        return "Right"
    }
}

function MoveBall(ball, dt){
    if (!ball.Initialized){
        ball.Initialized = true
        SetRandomBallDirection(ball)

        setTimeout(() => {
            ball.Move = true
        }, 500);
    }

    if(!ball.Move){
        return
    }

    MoveY(ball, ball.Direction.Y * ball.Speed * dt)
    MoveX(ball, ball.Direction.X * ball.Speed * dt)

    let ballOutOfBoundsOnSide = CheckBallOutOfBoundsSide(ball)
    if(ballOutOfBoundsOnSide){
       BallReachedOutOfBounds(ballOutOfBoundsOnSide)
        return
    }

    let touchParams = BallTouching(ball)
    if (touchParams.X || touchParams.Y) {

        pongHitSound.currentTime = 0
        pongHitSound.play()

        NegateBallDirection(ball, touchParams)
        if(touchParams.X){ // Odrazilo se od Paddle
            ball.Color = touchParams.Paddle && paddles[touchParams.Paddle].Color || "#ffffff"

            totalBallTouches += 1
            //document.getElementById("totalBallTouches").textContent = totalBallTouches.toString()
            ball.Speed += ballSpeedGain
        }
        if(touchParams.Y){
            ball.Color = "#ffffff"
        }
    }
}

function MoveX(object, movePos){
    object.Position.X += movePos
}
function MoveY(object, movePos, limitsDisabled) {
    object.Position.Y += movePos
    if (limitsDisabled) {
        return
    }

    if (movePos < 0){
        if(object.Position.Y < mapLimits.MinY)
            object.Position.Y = mapLimits.MinY
    }
    else {
        if(object.Position.Y + object.Size.Y > mapLimits.MaxY)
            object.Position.Y = mapLimits.MaxY - object.Size.Y
    }
}

const lineWidth = 8
const dashHeight = 28
const gap = 18

const centerX = canvas.width / 2 - lineWidth / 2
function DrawCenterLines(){
    ctx.fillStyle = "rgba(255,255,255,0.35)"

    for (let y = 0; y < canvas.height; y += dashHeight + gap){
        ctx.fillRect(
            centerX,
            y,
            lineWidth,
            dashHeight
        )
    }
}

function HandleMovement(dt){
    if(resettingGameplay){
        return
    }

    if(keysDown["w"]){
        MoveY(paddles.Left, -paddles.Left.Speed * dt)
    }
    if(keysDown["s"]){
        MoveY(paddles.Left, paddles.Left.Speed * dt)
    }
    if(keysDown["ArrowUp"]){
        MoveY(paddles.Right, -paddles.Right.Speed * dt)
    }
    if(keysDown["ArrowDown"]){
        MoveY(paddles.Right, paddles.Right.Speed * dt)
    }

    for(let ballName in balls){
        let ball = balls[ballName]
        MoveBall(ball, dt)
    }
}

function RenderStepped(currentTime){
    if(resettingGameplay){
        requestAnimationFrame(RenderStepped)
        return
    }

    if (keysDown["Escape"]) {
        location.href = "index.html";
        return
    }

    const dt = (currentTime - lastTime) // deltaTime v milisekundach
    lastTime = currentTime

    // když člověk např alt-tabne ať se mic neportne
    if(dt > 500){
        requestAnimationFrame(RenderStepped)
        return
    }

    HandleMovement(dt);

    ctx.clearRect(0,0, canvas.width, canvas.height)

    for (let paddleName in paddles){
        let paddle = paddles[paddleName]
        ctx.drawImage(
            paddleImage,
            paddle.Position.X,
            paddle.Position.Y,
            paddle.Size.X,
            paddle.Size.Y
        )

        ctx.fillStyle = paddle.Color
        ctx.globalCompositeOperation = "source-atop"

        ctx.fillRect(
            paddle.Position.X,
            paddle.Position.Y,
            paddle.Size.X,
            paddle.Size.Y
        )

        ctx.globalCompositeOperation = "source-over"
    }

    if(!resettingGameplay){
        for (let ballName in balls){
            let ball = balls[ballName]

            if(ball.Move){
                if (!ball.Trail){
                    ball.Trail = []
                }

                ball.Trail.push({
                    X: ball.Position.X + ball.Size.X / 2,
                    Y: ball.Position.Y + ball.Size.Y / 2
                })

                if (ball.Trail.length > 15){
                    ball.Trail.shift()
                }

                for (let i = 1; i < ball.Trail.length; i++){
                    let prev = ball.Trail[i - 1]
                    let curr = ball.Trail[i]

                    let progress = i / ball.Trail.length

                    let width = progress * ball.Size.X * 0.9

                    // Funguje jen pro #hex: prvni dve cisla, dalsi dve a pak dalsi dve cisla za #
                    // radix: 16: Vrací i písmenka v hexadecimalní soustave
                    let r = parseInt(ball.Color.slice(1, 3), 16);
                    let g = parseInt(ball.Color.slice(3, 5), 16);
                    let b = parseInt(ball.Color.slice(5, 7), 16);

                    ctx.strokeStyle = `rgba(${r},${g},${b},${progress * 0.1})`
                    ctx.lineWidth = width
                    ctx.lineCap = "round"

                    ctx.beginPath()
                    ctx.moveTo(prev.X, prev.Y)
                    ctx.lineTo(curr.X, curr.Y)
                    ctx.stroke()
                }
            }

            ctx.fillStyle = ball.Color

            ctx.beginPath()
            ctx.arc(
                ball.Position.X + ball.Size.X / 2,
                ball.Position.Y + ball.Size.Y / 2,
                ball.Size.X / 2,
                0,
                Math.PI * 2
            )
            ctx.fill()
        }
    }

    DrawCenterLines()

    requestAnimationFrame(RenderStepped)
}
requestAnimationFrame(RenderStepped)