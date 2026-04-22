// Lambert W Function
// https://github.com/protobi/lambertw/

const GSL_DBL_EPSILON = 2.2204460492503131e-16;
const ONE_OVER_E = 1.0 / Math.E;

interface IterationResult {
    val: number;
    err: number;
    iters: number;
    success: boolean;
}

/**
 * Performs the Halley iteration to compute the Lambert W function
 * @param x The input value
 * @param w_initial Initial approximation of W
 * @param max_iters Maximum number of iterations
 * @returns Result of the iteration
 */
function halley_iteration(x: number, w_initial: number, max_iters: number): IterationResult {
    let w = w_initial;
    let i = 0;

    for (i = 0; i < max_iters; i++) {
        const e = Math.exp(w);
        const p = w + 1.0;
        let t = w * e - x;

        if (w > 0) {
            // Newton iteration
            t = t / (p * e);
        } else {
            // Halley iteration
            t = t / (e * p - (0.5 * (p + 1.0) * t) / p);
        }

        w -= t;

        const tol = GSL_DBL_EPSILON * Math.max(Math.abs(w), 1.0 / (Math.abs(p) * e));

        if (Math.abs(t) < tol) {
            return {
                val: w,
                err: 2.0 * tol,
                iters: i,
                success: true,
            };
        }
    }

    /* should never get here */
    return {
        val: w,
        err: Math.abs(w),
        iters: i,
        success: false,
    };
}

/**
 * Series which appears for q near zero;
 * only the argument is different for the different branches
 */
function series_eval(r: number): number {
    const c = [
        -1.0, 2.331643981597124203363536062168, -1.812187885639363490240191647568,
        1.936631114492359755363277457668, -2.353551201881614516821543561516,
        3.066858901050631912893148922704, -4.17533560025817713885498417746,
        5.858023729874774148815053846119, -8.401032217523977370984161688514,
        12.250753501314460424, -18.100697012472442755, 27.02904479901056165,
    ];

    const t_8 = c[8] + r * (c[9] + r * (c[10] + r * c[11]));
    const t_5 = c[5] + r * (c[6] + r * (c[7] + r * t_8));
    const t_1 = c[1] + r * (c[2] + r * (c[3] + r * (c[4] + r * t_5)));
    return c[0] + r * t_1;
}

/**
 * Computes the principal branch of the Lambert W function (W0)
 * @param x Input value
 * @returns Result containing the computed value and error information
 */
function gsl_sf_lambert_W0_e(x: number): IterationResult {
    const q = x + ONE_OVER_E;

    if (x === 0.0) {
        return {
            val: 0.0,
            err: 0.0,
            iters: 0,
            success: true,
        };
    } else if (q < 0.0) {
        /* Strictly speaking this is an error. But because of the
         * arithmetic operation connecting x and q, we are a little
         * lenient in case of some epsilon overshoot. The following
         * answer is quite accurate in that case.
         */
        return {
            val: -1.0,
            err: Math.sqrt(-q),
            iters: 0,
            success: false, // GSL_EDOM
        };
    } else if (q === 0.0) {
        return {
            val: -1.0,
            err: GSL_DBL_EPSILON,
            iters: 0,
            /* cannot error is zero, maybe q == 0 by "accident" */
            success: true,
        };
    } else if (q < 1.0e-3) {
        /* series near -1/E in sqrt(q) */
        const r = Math.sqrt(q);
        const val = series_eval(r);
        return {
            val,
            err: 2.0 * GSL_DBL_EPSILON * Math.abs(val),
            iters: 0,
            success: true,
        };
    } else {
        const MAX_ITERS = 100;
        let w: number;

        if (x < 1.0) {
            /* obtain initial approximation from series near x=0;
             * no need for extra care, since the Halley iteration
             * converges nicely on this branch
             */
            const p = Math.sqrt(2.0 * Math.E * q);
            w = -1.0 + p * (1.0 + p * (-1.0 / 3.0 + (p * 11.0) / 72.0));
        } else {
            /* obtain initial approximation from rough asymptotic */
            w = Math.log(x);
            if (x > 3.0) w -= Math.log(w);
        }

        return halley_iteration(x, w, MAX_ITERS);
    }
}

/**
 * Computes the secondary branch of the Lambert W function (W-1)
 * @param x Input value
 * @returns Result containing the computed value and error information
 */
function gsl_sf_lambert_Wm1_e(x: number): IterationResult {
    if (x > 0.0) {
        return gsl_sf_lambert_W0_e(x);
    } else if (x === 0.0) {
        return {
            val: 0.0,
            err: 0.0,
            iters: 0,
            success: true,
        };
    } else {
        const MAX_ITERS = 32;
        const q = x + ONE_OVER_E;
        let w: number;

        if (q < 0.0) {
            /* As in the W0 branch above, return some reasonable answer anyway. */
            return {
                val: -1.0,
                err: Math.sqrt(-q),
                iters: 0,
                success: false,
            };
        }

        if (x < -1.0e-6) {
            /* Obtain initial approximation from series about q = 0,
             * as long as we're not very close to x = 0.
             * Use full series and try to bail out if q is too small,
             * since the Halley iteration has bad convergence properties
             * in finite arithmetic for q very small, because the
             * increment alternates and p is near zero.
             */
            const r = -Math.sqrt(q);
            w = series_eval(r);
            if (q < 3.0e-3) {
                /* this approximation is good enough */
                return {
                    val: w,
                    err: 5.0 * GSL_DBL_EPSILON * Math.abs(w),
                    iters: 0,
                    success: true,
                };
            }
        } else {
            /* Obtain initial approximation from asymptotic near zero. */
            const L_1 = Math.log(-x);
            const L_2 = Math.log(-L_1);
            w = L_1 - L_2 + L_2 / L_1;
        }

        return halley_iteration(x, w, MAX_ITERS);
    }
}

/**
 * Computes the principal branch of the Lambert W function
 * @param x Input value >= -1/e
 * @returns W0(x) value
 */
export function lambertW0(x: number): number {
    return gsl_sf_lambert_W0_e(x).val;
}

/**
 * Computes the secondary branch of the Lambert W function
 * @param x Input value >= -1/e and <= 0
 * @returns W-1(x) value
 */
export function lambertWm1(x: number): number {
    return gsl_sf_lambert_Wm1_e(x).val;
}
