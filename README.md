# amath-js
A simple math library with below features:
- Symbolic computation with support for:
    - polynomials and sin/cos
    - differentiating with respect to a specific variable
    - substituting expressions based on given values 
    - limited simplifying
- Solve multivariate expressions using Newton-Raphson numerical method.

## Usage
Install the package using
```sh
npm i amath-js
```
Then you can use the library as example below:
```javascript
// Solving a system of two equations:
// 2x + y = 7
// x * y = 6
import { Sym as S, Solver } from 'amath-js';

let x = new S.Variable("x");
let y = new S.Variable("y");

let exprs = [
  new S.Sum(S.cof(2, x), y, new S.Const(-7)),
  new S.Sum(new S.Mul(x, y), new S.Const(-6)),
]

console.log("Expressions:");
console.log(exprs.map(e => e.toString()));

let initial = new Map([
  [x, 0],
  [y, 0],
]);

let solver = new Solver(exprs, initial);
solver.convergeToRMSE(1e-9);

let var_map = solver.var_map();
console.log("Results:")
console.log(var_map);

console.log("Evaluation of expressions:");
solver.exprs.forEach(e => {
  console.log(e.toString(), ' = ', e.eval(var_map, false));
})
```
There are more examples inside the [examples](https://github.com/amin-not-found/amath-js/blob/master/examples/) directory.
Also you can find documentation for the API in https://amin-not-found.github.io/amath-js.

## Todo
- [ ] Abstract away sin and cos to general function derivation
- [ ] Add other functions
- [ ] Add more sophisticated simplification
- [ ] Add a license