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
There are some examples inside the `examples` directory. You can start by looking at [three-eq](https://github.com/amin-not-found/amath-js/blob/master/examples/three-eq.ts). \
Also you can find documentation for the API in https://amin-not-found.github.io/amath-js.

## Todo
- [ ] Abstract away sin and cos to general function derivation
- [ ] Add other functions
- [ ] Add more sophisticated simplification
- [ ] Add a license