//simple linear equation in form of x=y with increasing x

import * as S from '../src/sym';
import { Solver } from '../src/numerical-solver';

let y = new S.Variable("y");
let x = new S.Const(0);

let exprs = [
    new S.Sum(y,S.neg(x))
]

console.log("Expressions:");
console.log(exprs.map(e => e.toString()));
console.log(exprs);


let initial = new Map([
    [y, 546],
]);

let solver = new Solver(exprs, initial)

function solve_for(new_x: number){
    x.set_value(new_x);
    console.log(exprs);
    console.log(x.value)

    for (let i = 0; i < 10; i++) {
        solver.iterate();
    }
}

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext("2d")!;
document.body.appendChild(canvas);


function drawFrame(time: number){
    let x = time/20;
    solve_for(x);


    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();
    ctx.moveTo(0,0);

    ctx.lineTo(x,solver.var_map().get(y)!);
    ctx.stroke();
    requestAnimationFrame(drawFrame);
}

drawFrame(0);
