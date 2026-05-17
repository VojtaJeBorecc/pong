export const keysDown = {}
addEventListener("keydown", function (e){
    keysDown[e.key.toString()] = true
}, false)

addEventListener("keyup", function (e){
    delete keysDown[e.key.toString()]
}, false)
