import * as Sym from "./sym";
import { Matrix, pseudoInverse } from 'ml-matrix';


export class ExprJacobian {
    readonly matrix: Sym.Expr[][];
    readonly row_count: number;
    readonly col_count: number;
    /** Accepts vars as order of variables matter */
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
    vars: Sym.Variable[];
    values: Matrix;
    jacobian: ExprJacobian;

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

    var_map() {
        return new Map(this.vars.map((v, i) => [v, this.values.get(i, 0)]));
    }

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

    getRMSE() {
        // value for each expression should be zero as we're looking for roots,
        // so we just  calculate the root of mean of each expression evaluation squared
        let squaredError = this.exprs.map(
            e => Math.pow(e.eval(this.var_map(), false)!, 2)
        );
        let meanSquaredError = squaredError.reduce((a, b) => a + b, 0) / this.exprs.length;
        return Math.sqrt(meanSquaredError);
    }
    /** Use if the solver converges quickly, 
     * as calculating RMSE can be expensive. */
    convergeToRMSE(error: number, maxIterations = -1) {
        let iterCount = 0;
        while (iterCount != maxIterations && this.getRMSE() > error) {
            this.iterate();
            iterCount++;
        }
        console.log("ic", iterCount);
    }

}