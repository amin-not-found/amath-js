import * as Sym from "./sym";
import { Matrix } from 'ml-matrix';
export declare class ExprJacobian {
    readonly matrix: Sym.Expr[][];
    readonly row_count: number;
    readonly col_count: number;
    /** Accepts vars as order of variables matter */
    constructor(exprs: Sym.Expr[], vars: Sym.Variable[]);
    eval(values: Sym.VarMap): number[][];
}
/**
 * A multivariate Newton-Raphson implementation
 * where x_(k+1) = x_k - J^(-1)(x_k)*f(x_k)
 **/
export declare class Solver {
    exprs: Sym.Expr[];
    vars: Sym.Variable[];
    values: Matrix;
    jacobian: ExprJacobian;
    constructor(exprs: Sym.Expr[], initial: Sym.VarMap);
    var_map(): Map<Sym.Variable, number>;
    iterate(): void;
    getRMSE(): number;
    /** Use if the solver converges quickly,
     * as calculating RMSE can be expensive. */
    convergeToRMSE(error: number, maxIterations?: number): void;
}
