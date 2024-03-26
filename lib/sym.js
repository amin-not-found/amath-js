"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cof = exports.neg = exports.Cos = exports.Sin = exports.Pow = exports.Mul = exports.Sum = exports.Variable = exports.Const = exports.Expr = void 0;
/**
* No Division. Use Mul(a, pow(b, -1)) \
* No Subtraction. Use Sum(a, negate(b))
**/
class Expr {
    check_vars(vars) {
        let correct = true;
        for (const v of this.vars) {
            if (!vars.has(v)) {
                correct = false;
                break;
            }
        }
        if (!correct) {
            throw "no all needed variables for this expression were provided.";
        }
    }
}
exports.Expr = Expr;
class Const extends Expr {
    constructor(value) {
        super();
        this.value = value;
        this.value = value;
    }
    get vars() {
        return new Set();
    }
    set_value(value) {
        this.value = value;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        return this.value;
    }
    diff() {
        return new Const(0);
    }
    /** Only support simple simplifications */
    simplify() { return this; }
    toString() {
        if (this.value < 0)
            return '(' + this.value.toString() + ')';
        return this.value.toString();
    }
}
exports.Const = Const;
class Variable extends Expr {
    constructor(name = undefined) {
        super();
        if (!name)
            Variable.VarCounter++;
        this.name = name !== null && name !== void 0 ? name : ('x' + Variable.VarCounter.toString());
    }
    get vars() {
        return new Set([this]);
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        return vars.get(this);
    }
    diff(d) {
        if (this == d) {
            return new Const(1);
        }
        return new Const(0);
    }
    simplify() { return this; }
    toString() {
        return this.name;
    }
}
exports.Variable = Variable;
Variable.VarCounter = -1;
class Sum extends Expr {
    constructor(...expressions) {
        super();
        this.exprs = expressions;
    }
    get vars() {
        let res = new Set();
        for (const e of this.exprs) {
            res = new Set([...res, ...e.vars]);
        }
        return res;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        let res = 0;
        for (const e of this.exprs) {
            res += e.eval(vars, false);
        }
        return res;
    }
    diff(d) {
        let exprs = [];
        for (const e of this.exprs) {
            exprs.push(e.diff(d));
        }
        return new Sum(...exprs);
    }
    simplify() {
        let computable_sum = 0;
        let i = 0;
        while (i < this.exprs.length) {
            this.exprs[i] = this.exprs[i].simplify();
            const e = this.exprs[i];
            if (e instanceof Const) {
                computable_sum += e.value;
                this.exprs.splice(i, 1);
                continue;
            }
            if (e instanceof Sum) {
                this.exprs.push(...e.exprs);
                this.exprs.splice(i, 1);
                continue;
            }
            i++;
        }
        let sum_const = new Const(computable_sum);
        if (this.exprs.length == 0) {
            return sum_const;
        }
        if (computable_sum == 0) {
            if (this.exprs.length == 1)
                return this.exprs[0];
            return this;
        }
        this.exprs.push(sum_const);
        return this;
    }
    toString() {
        return '(' + this.exprs.map((e) => e.toString()).join(' + ') + ')';
    }
}
exports.Sum = Sum;
class Mul extends Expr {
    constructor(...expressions) {
        super();
        this.exprs = expressions;
    }
    get vars() {
        let res = new Set();
        for (const e of this.exprs) {
            res = new Set([...res, ...e.vars]);
        }
        return res;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        let res = 1;
        for (const e of this.exprs) {
            res *= e.eval(vars, false);
        }
        return res;
    }
    diff(d) {
        // if this.exprs = f.g.h
        // exprs will be [f'.g.h, g'.f.h, h'.f.g]
        // we will turn exprs into a sum at the end of this function
        let exprs = [];
        for (let i = 0; i < this.exprs.length; i++) {
            // differentiate current term and multiply it with other terms
            let de = this.exprs[i].diff(d);
            let otherExprs = this.exprs.slice();
            otherExprs.splice(i, 1);
            exprs.push(new Mul(de, ...otherExprs));
        }
        return new Sum(...exprs);
    }
    simplify() {
        let computable_mul = 1;
        let i = 0;
        while (i < this.exprs.length) {
            this.exprs[i] = this.exprs[i].simplify();
            const e = this.exprs[i];
            if (e instanceof Const) {
                computable_mul *= e.value;
                this.exprs.splice(i, 1);
                continue;
            }
            if (e instanceof Mul) {
                this.exprs.push(...e.exprs);
                this.exprs.splice(i, 1);
                continue;
            }
            if (computable_mul == 0)
                return new Const(0);
            i++;
        }
        let mul_const = new Const(computable_mul);
        if (this.exprs.length == 0) {
            return mul_const;
        }
        if (computable_mul == 1) {
            if (this.exprs.length == 1)
                return this.exprs[0];
            return this;
        }
        this.exprs.push(mul_const);
        return this;
    }
    toString() {
        return '(' + this.exprs.map((e) => e.toString()).join('*') + ')';
    }
}
exports.Mul = Mul;
class Pow extends Expr {
    constructor(expr, pow) {
        super();
        this.expr = expr;
        if (pow instanceof Const)
            pow = pow.value;
        this.pow = pow;
    }
    get vars() {
        return this.expr.vars;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        return Math.pow(this.expr.eval(vars, false), this.pow);
    }
    diff(d) {
        if (this.pow == 0)
            return new Const(0);
        return new Mul(new Const(this.pow), this.expr.diff(d), new Pow(this.expr, this.pow - 1));
    }
    simplify() {
        this.expr = this.expr.simplify();
        if (this.pow == 0)
            return new Const(1);
        if (this.pow == 1)
            return this.expr;
        if (this.expr instanceof Pow)
            return new Pow(this.expr.expr, this.expr.pow * this.pow);
        return this;
    }
    toString() {
        return '(' + this.expr.toString() + ')^' + this.pow.toString();
    }
}
exports.Pow = Pow;
class Sin extends Expr {
    constructor(expr) {
        super();
        this.expr = expr;
    }
    get vars() {
        return this.expr.vars;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        return Math.sin(this.expr.eval(vars, false));
    }
    diff(d) {
        return new Mul(this.expr.diff(d), new Cos(this.expr));
    }
    simplify() {
        this.expr = this.expr.simplify();
        if (this.expr instanceof Const)
            return new Const(Math.sin(this.expr.value));
        return this;
    }
    toString() {
        return 'sin(' + this.expr.toString() + ')';
    }
}
exports.Sin = Sin;
class Cos extends Expr {
    constructor(expr) {
        super();
        this.expr = expr;
    }
    get vars() {
        return this.expr.vars;
    }
    eval(vars, checkVars) {
        if (checkVars)
            this.check_vars(vars);
        return Math.cos(this.expr.eval(vars, false));
    }
    diff(d) {
        return new Mul(new Const(-1), this.expr.diff(d), new Sin(this.expr));
    }
    simplify() {
        this.expr = this.expr.simplify();
        if (this.expr instanceof Const)
            return new Const(Math.cos(this.expr.value));
        return this;
    }
    toString() {
        return 'cos(' + this.expr.toString() + ')';
    }
}
exports.Cos = Cos;
/** Helper function for negating an expression */
function neg(expr) {
    return cof(-1, expr);
}
exports.neg = neg;
/** Helper function for multiplying a variable by a constant */
function cof(n, expr) {
    if (expr instanceof Mul) {
        expr.exprs.push(new Const(n));
    }
    return new Mul(new Const(n), expr);
}
exports.cof = cof;
