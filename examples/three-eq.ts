// Solving a system of three equations
// note: output is only in the console
import * as S from '../src/sym';
import { Solver } from '../src/numerical-solver';

let a = new S.Variable("a")
let b = new S.Variable("b")
let c = new S.Variable("c")

let exprs = [
    new S.Sum(S.cof(2,a), S.neg(b), S.cof(4,c), new S.Const(-27)), 
    new S.Sum(S.cof(4,new S.Pow(a,2)),S.cof(6,b),S.neg(c),new S.Const(-39)),   
    new S.Sum(a, S.cof(7,b),S.cof(10,c), new S.Const(-107))
]

console.log("Expressions:");
console.log(exprs.map(e => e.toString()));


let initial = new Map([
    [a, 1],
    [b, 2],
    [c, 3],
]);
let solver = new Solver(exprs, initial);
console.log("Jacobian:")
console.log(solver.jacobian.matrix.map(r => r.map(e => e.toString())));


for (let i = 0; i < 100; i++) {
    solver.iterate();
}

let var_map = solver.var_map();
console.log("Results:")
console.log(var_map);

solver.exprs.forEach(e=>{
    console.log(e.toString(), ' = ', e.eval(var_map,false))
})