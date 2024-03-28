import * as Sym from "./sym";
import { Matrix, pseudoInverse } from 'ml-matrix';

/** Jacobian of a list of expressions */
export class ExprJacobian {
    /** The result of Jacobian in form of a 2D array of expressions */
    readonly matrix: Sym.Expr[][];
    readonly row_count: number;
    readonly col_count: number;
    /** Accepts vars as order of variables might matter */
    constructor(exprs: Sym.Expr[], vars: Sym.Variable[]) {
        this.matrix = [];
        for (let i = 0; i < exprs.length; i++) {
            const expr = exprs[i];

            this.matrix.push([]);
            for (let j = 0; j < vars.length; j++) {
                const v = vars[j];
                this.matrix[i].push(expr.diff(v)!);
                //this.matrix[i].push(expr.diff(v)!.simplify()); TODO : simplify
            }
        }
        this.row_count = exprs.length;
        this.col_count = vars.length;
    }
    /** Evaluate expression inside Jacobian using given map of variables to numbers */
    eval(values: Sym.VarMap): number[][] {
        let res: number[][] = [];
        for (let i = 0; i < this.row_count; i++) {
            res.push([]);
            for (let j = 0; j < this.col_count; j++) {
                res[i].push(this.matrix[i][j].eval(values, false)!);
            }
        }
        return res;
    }
}

/** 
 * A multivariate Newton-Raphson implementation
 * where x_(k+1) = x_k - J^(-1)(x_k)*f(x_k)
 **/
export class Solver {
    /** List of variables used inside solver expressions */
    readonly vars: Sym.Variable[];
    private values: Matrix;
    /** jacobian of expressions used for root finding */
    readonly jacobian: ExprJacobian;

    /**
     * 
     * @param exprs List expressions to solve for
     * @param initial A map of variables to their corresponding initial value as a number
     */
    constructor(public exprs: Sym.Expr[], initial: Sym.VarMap) {
        let uniq_vars = new Set<Sym.Variable>();
        for (const e of exprs) {
            e.check_vars(initial);
            uniq_vars = new Set([...uniq_vars, ...e.vars]);
        }
        this.vars = [...uniq_vars];
        let values = this.vars.map(v => initial.get(v)!);
        this.values = new Matrix(values.map(v => [v]));
        this.jacobian = new ExprJacobian(exprs, this.vars);
    }
    /** A map of variables to their current values. \
     * This values will change and become accurate by iterating the solver
     */
    var_map() {
        return new Map(this.vars.map((v, i) => [v, this.values.get(i, 0)]));
    }

    /** Iterate the solver once */
    iterate() {
        let var_map = this.var_map(); // XXX: doesn't need to update here
        let temp2 = this.jacobian.eval(var_map); // XXX: doesn't update
        let jacobian = new Matrix(temp2);
        let f = new Matrix(this.exprs.map(e => [e.eval(var_map, false)!])); // XXX : updates

        let temp0 = pseudoInverse(jacobian);
        let temp1 = temp0.mmul(f);
        this.values = this.values.subtract(
            temp1
        );
    }

    /** Get root mean square error by determining how far solver's expressions
     * are from zero using current values and state of solver.
     */
    getRMSE() {
        // value for each expression should be zero as we're looking for roots,
        // so we just  calculate the root of mean of each expression evaluation squared
        let squaredError = this.exprs.map(
            e => Math.pow(e.eval(this.var_map(), false)!, 2)
        );
        let meanSquaredError = squaredError.reduce((a, b) => a + b, 0) / this.exprs.length;
        return Math.sqrt(meanSquaredError);
    }
    /** Iterate the solver until RMSE of expressions gets to or under specified error number;
     * Or leave when reached number of iterations specified by maxIterations. \
     * Note: Use if the solver converges quickly, as calculating RMSE can be expensive.
     * @param [maxIterations=-1] Maximum number of iterations. Use -1 (default value) to iterate without any limit */
    convergeToRMSE(error: number, maxIterations = -1) {
        let iterCount = 0;
        while (iterCount != maxIterations && this.getRMSE() > error) {
            this.iterate();
            iterCount++;
        }
    }

}