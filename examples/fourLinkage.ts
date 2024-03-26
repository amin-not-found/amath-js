// Simple Four Linkage simulation
import * as S from '../src/sym';
import { Solver } from '../src/numerical-solver';

function deg2rad(deg: number) {
    return deg / 180 * Math.PI;
}
function solve_for(solver: Solver, t1_value: number) {
    t1.value = t1_value;
    solver.convergeToRMSE(1e-6, 10);
}
function drawLine(ctx: CanvasRenderingContext2D,
    startX: number, startY: number,
    deltaX: number, deltaY: number,
    color = "#000000") {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + deltaX, startY + deltaY);
    ctx.stroke();
}
function lineComponents(len: number, deg: number, scale = 1.0) {
    return [len * Math.cos(deg) * scale, len * Math.sin(deg) * scale];
}

let l1 = new S.Const(1);
let l2 = new S.Const(5);
let l3 = new S.Const(4);
let l4 = new S.Const(4);

let t1 = new S.Const(Math.PI / 2);
let t2 = new S.Variable("θ2");
let t3 = new S.Variable("θ3");
let t4 = new S.Const(Math.PI);

let exprs = [
    new S.Sum(new S.Mul(l1, new S.Cos(t1)), new S.Mul(l2, new S.Cos(t2)), new S.Mul(l3, new S.Cos(t3)), new S.Mul(l4, new S.Cos(t4))),
    new S.Sum(new S.Mul(l1, new S.Sin(t1)), new S.Mul(l2, new S.Sin(t2)), new S.Mul(l3, new S.Sin(t3)), new S.Mul(l4, new S.Sin(t4))),
];

let initial = new Map([
    [t2, deg2rad(36)],
    [t3, deg2rad(-90)],
]);

let solver = new Solver(exprs, initial);
let theta = deg2rad(90);

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth * 0.8;
canvas.height = canvas.width * 3 / 4;

const ctx = canvas.getContext("2d")!;
document.body.appendChild(canvas);

let elapsed = 0;
const scale = canvas.width / 10;

function drawFrame(time: number) {
    // if(time%1 != 0) {
    //     requestAnimationFrame(drawFrame);
    //     return;
    // }
    let deltaTime = (time - elapsed);
    elapsed = time;

    theta += deltaTime / 1000;
    theta = theta % (2 * Math.PI);

    solve_for(solver, theta);

    let [x, y] = [canvas.width * 0.3, canvas.height * 0.7];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x, y);

    let [dx, dy] = lineComponents(l1.value, t1.value, scale);
    drawLine(ctx, x, y, dx, -dy, "red");
    x += dx;
    y -= dy;

    [dx, dy] = lineComponents(l2.value, solver.var_map().get(t2)!, scale);
    drawLine(ctx, x, y, dx, -dy, "green");
    x += dx;
    y -= dy;

    [dx, dy] = lineComponents(l3.value, solver.var_map().get(t3)!, scale);
    drawLine(ctx, x, y, dx, -dy, "blue");
    x += dx;
    y -= dy;

    [dx, dy] = lineComponents(l4.value, t4.value, scale);
    drawLine(ctx, x, y, dx, -dy, "black");
    x += dx;
    y -= dy;
    
    requestAnimationFrame(drawFrame);
}
drawFrame(0);
