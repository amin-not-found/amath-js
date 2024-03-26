export type VarMap = Map<Variable, number>;

/** 
* No Division. Use Mul(a, pow(b, -1)) \
* No Subtraction. Use Sum(a, negate(b)) 
**/
export abstract class Expr {
    abstract get vars(): Set<Variable>;

    abstract eval(vars: VarMap, checkVars: boolean): number | undefined;
    abstract diff(d: Variable): Expr | undefined;
    abstract simplify(): Expr;
    abstract toString(): string;

    check_vars(vars: VarMap) {
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

export class Const extends Expr {
    constructor(public value: number) {
        super();
        this.value = value;
    }
    get vars() {
        return new Set<Variable>();
    }
    set_value(value: number){
        this.value = value;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        return this.value;
    }
    diff() {
        return new Const(0);
    }
    /** Only support simple simplifications */
    simplify() { return this }
    toString(): string {
        if (this.value < 0) return '(' + this.value.toString() + ')'
        return this.value.toString();
    }
}

export class Variable extends Expr {
    static VarCounter = -1;
    name: string;
    constructor(name: string | undefined = undefined) {
        super();
        if (!name) Variable.VarCounter++;
        this.name = name ?? ('x' + Variable.VarCounter.toString());
    }
    get vars() {
        return new Set([this]);
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        return vars.get(this);
    }
    diff(d: Variable) {
        if (this == d) {
            return new Const(1);
        }
        return new Const(0);
    }
    simplify() { return this }
    toString(): string {
        return this.name;
    }
}

export class Sum extends Expr {
    exprs: Expr[];
    constructor(...expressions: Expr[]) {
        super();
        this.exprs = expressions;
    }
    get vars() {
        let res = new Set<Variable>();
        for (const e of this.exprs) {
            res = new Set([...res, ...e.vars]);
        }
        return res;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        let res = 0;
        for (const e of this.exprs) {
            res += e.eval(vars, false)!;
        }
        return res;
    }
    diff(d: Variable) {
        let exprs: Expr[] = [];
        for (const e of this.exprs) {
            exprs.push(e.diff(d)!);
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
            if(this.exprs.length == 1) return this.exprs[0];
            return this;
        }
        this.exprs.push(sum_const);
        return this;
    }
    toString(): string {
        return '(' + this.exprs.map((e) => e.toString()).join(' + ') + ')'
    }
}

export class Mul extends Expr {
    exprs: Expr[];
    constructor(...expressions: Expr[]) {
        super();
        this.exprs = expressions;
    }
    get vars() {
        let res = new Set<Variable>();
        for (const e of this.exprs) {
            res = new Set([...res, ...e.vars]);
        }
        return res;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        let res = 1;
        for (const e of this.exprs) {
            res *= e.eval(vars, false)!;
        }
        return res;
    }
    diff(d: Variable) {
        // if this.exprs = f.g.h
        // exprs will be [f'.g.h, g'.f.h, h'.f.g]
        // we will turn exprs into a sum at the end of this function
        let exprs: Expr[] = [];
        for (let i = 0; i < this.exprs.length; i++) {
            // differentiate current term and multiply it with other terms
            let de = this.exprs[i].diff(d)!;
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
            if (computable_mul == 0) return new Const(0);
            i++;
        }
        let mul_const = new Const(computable_mul);
        if (this.exprs.length == 0) {
            return mul_const;
        }
        if (computable_mul == 1) {
            if(this.exprs.length == 1) return this.exprs[0];
            return this;
        }
        this.exprs.push(mul_const);
        return this;
    }
    toString(): string {
        return '(' + this.exprs.map((e) => e.toString()).join('*') + ')'
    }
}

export class Pow extends Expr {
    pow: number;
    constructor(public expr: Expr, pow: number | Const) {
        super();
        if (pow instanceof Const) pow = pow.value;
        this.pow = pow;
    }
    get vars() {
        return this.expr.vars;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        return Math.pow(this.expr.eval(vars, false)!, this.pow);
    }
    diff(d: Variable): Expr {
        if (this.pow == 0) return new Const(0);

        return new Mul(
            new Const(this.pow),
            this.expr.diff(d)!,
            new Pow(this.expr, this.pow - 1),
        );
    }
    simplify(): Expr {
        this.expr = this.expr.simplify();
        if (this.pow == 0) return new Const(1);
        if (this.pow == 1) return this.expr;
        if (this.expr instanceof Pow) return new Pow(this.expr.expr, this.expr.pow * this.pow);
        return this;
    }
    toString(): string {
        return '(' + this.expr.toString() + ')^' + this.pow.toString()
    }
}

export class Sin extends Expr {
    constructor(public expr: Expr) {
        super();
    }
    get vars(): Set<Variable> {
        return this.expr.vars;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        return Math.sin(this.expr.eval(vars, false)!);
    }
    diff(d: Variable) {
        return new Mul(this.expr.diff(d)!, new Cos(this.expr));
    }
    simplify() {
        this.expr = this.expr.simplify();
        if(this.expr instanceof Const) return new Const(Math.sin(this.expr.value));
        return this;
    }
    toString() {
        return 'sin(' + this.expr.toString() + ')';
    }
}

export class Cos extends Expr {
    constructor(public expr: Expr) {
        super();
    }
    get vars(): Set<Variable> {
        return this.expr.vars;
    }
    eval(vars: VarMap, checkVars: boolean) {
        if (checkVars) this.check_vars(vars);
        return Math.cos(this.expr.eval(vars, false)!);
    }
    diff(d: Variable): Expr {
        return new Mul(new Const(-1), this.expr.diff(d)!, new Sin(this.expr));
    }
    simplify() {
        this.expr = this.expr.simplify();
        if(this.expr instanceof Const) return new Const(Math.cos(this.expr.value));
        return this;
    }
    toString() {
        return 'cos(' + this.expr.toString() + ')';
    }
}

/** Helper function for negating an expression */
export function neg(expr: Expr): Expr {
    return cof(-1, expr);
}

/** Helper function for multiplying a variable by a constant */
export function cof(n: number,expr: Expr): Expr {
    if (expr instanceof Mul) {
        expr.exprs.push(new Const(n));
    }
    return new Mul(new Const(n), expr);
}

