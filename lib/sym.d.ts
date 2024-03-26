export type VarMap = Map<Variable, number>;
/**
* No Division. Use Mul(a, pow(b, -1)) \
* No Subtraction. Use Sum(a, negate(b))
**/
export declare abstract class Expr {
    abstract get vars(): Set<Variable>;
    abstract eval(vars: VarMap, checkVars: boolean): number | undefined;
    abstract diff(d: Variable): Expr | undefined;
    abstract simplify(): Expr;
    abstract toString(): string;
    check_vars(vars: VarMap): void;
}
export declare class Const extends Expr {
    value: number;
    constructor(value: number);
    get vars(): Set<Variable>;
    set_value(value: number): void;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(): Const;
    /** Only support simple simplifications */
    simplify(): this;
    toString(): string;
}
export declare class Variable extends Expr {
    static VarCounter: number;
    name: string;
    constructor(name?: string | undefined);
    get vars(): Set<this>;
    eval(vars: VarMap, checkVars: boolean): number | undefined;
    diff(d: Variable): Const;
    simplify(): this;
    toString(): string;
}
export declare class Sum extends Expr {
    exprs: Expr[];
    constructor(...expressions: Expr[]);
    get vars(): Set<Variable>;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(d: Variable): Sum;
    simplify(): Expr | this;
    toString(): string;
}
export declare class Mul extends Expr {
    exprs: Expr[];
    constructor(...expressions: Expr[]);
    get vars(): Set<Variable>;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(d: Variable): Sum;
    simplify(): Expr | this;
    toString(): string;
}
export declare class Pow extends Expr {
    expr: Expr;
    pow: number;
    constructor(expr: Expr, pow: number | Const);
    get vars(): Set<Variable>;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(d: Variable): Expr;
    simplify(): Expr;
    toString(): string;
}
export declare class Sin extends Expr {
    expr: Expr;
    constructor(expr: Expr);
    get vars(): Set<Variable>;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(d: Variable): Mul;
    simplify(): Const | this;
    toString(): string;
}
export declare class Cos extends Expr {
    expr: Expr;
    constructor(expr: Expr);
    get vars(): Set<Variable>;
    eval(vars: VarMap, checkVars: boolean): number;
    diff(d: Variable): Expr;
    simplify(): Const | this;
    toString(): string;
}
/** Helper function for negating an expression */
export declare function neg(expr: Expr): Expr;
/** Helper function for multiplying a variable by a constant */
export declare function cof(n: number, expr: Expr): Expr;
