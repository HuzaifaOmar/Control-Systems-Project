from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import sympy as sp
import re

app = Flask(__name__)
CORS(app)

def routh_array(coefficients):
    """
    Build the Routh array from the coefficients of the characteristic equation.

    args:
        coefficients: List of coefficients [a_n, a_(n-1), ..., a_1, a_0]
    eturns:
        A 2D numpy array representing the Routh array
    """
    n = len(coefficients) - 1  # order of the system
    rows = n + 1
    cols = (n + 1) // 2 + (n + 1) % 2  # ceiling division
    routh = np.zeros((rows, cols))

    # initialize first two rows
    for i in range(cols):
        if 2 * i < len(coefficients):
            routh[0, i] = coefficients[2 * i]
        if 2 * i + 1 < len(coefficients):
            routh[1, i] = coefficients[2 * i + 1]

    for i in range(2, rows):
        if routh[i - 1, 0] == 0:
            epsilon = 1e-10
            routh[i - 1, 0] = epsilon
            print(f"Warning: Zero encountered in first column of row {i - 1}. Replaced with epsilon=1e-10")

        for j in range(cols - 1):
            routh[i, j] = (routh[i - 1, 0] * routh[i - 2, j + 1] - routh[i - 2, 0] * routh[i - 1, j + 1]) / routh[
                i - 1, 0]

    return routh


def check_stability(routh_array):
    """
    args:
        routh_array: The Routh array
    returns:
        is_stable: Boolean indicating stability
        sign_changes: Number of sign changes in the first column
    """
    first_column = routh_array[:, 0]
    sign_change = 0

    # remove epsilon
    first_column = [val for val in first_column if abs(val) > 1e-10]
    for i in range(len(first_column) - 1):
        if first_column[i] * first_column[i + 1] < 0:
            sign_change += 1

    return sign_change == 0, sign_change


def find_roots(polynomial_str):
    polynomial_str = convert_equation_for_sympify(polynomial_str)
    s = sp.symbols('s')
    polynomial = sp.sympify(polynomial_str)
    roots = sp.solve(polynomial, s)
    numerical_roots = []
    for root in roots:
        try:
            numerical_roots.append(complex(root.evalf()))
        except:
            numerical_roots.append(root)

    return numerical_roots

def convert_equation_for_sympify(equation_str):
    """
    Convert equations with pattern like "s^5+s^4+10s^3+72s^2+152s+240"
    into a format that can be processed by sympy's sympify function.

    args:
        equation_str (str): Input equation string with carets (^) for exponents
    eturns:
        str: Modified equation string compatible with sympify
    """
    equation_str = equation_str.replace("^", "**")
    equation_str = re.sub(r'(\d+)([a-zA-Z])', r'\1*\2', equation_str)
    return equation_str


# @app.route('/analyze', methods=['POST'])
def analyze_stability_api():
    data = request.json
    polynomial_str = data.get('equation', '')
    if not polynomial_str:
        return jsonify({"error": "No equation provided."}), 400
    try:
        polynomial_str = convert_equation_for_sympify(polynomial_str)
        s = sp.symbols('s')
        polynomial = sp.sympify(polynomial_str)
        poly_expanded = sp.expand(polynomial)
        degree = sp.degree(poly_expanded, s)
        coefficients = [float(poly_expanded.coeff(s, degree - i)) for i in range(degree + 1)]

        print(f"Characteristic Equation: {polynomial_str}")
        print(f"Coefficients (descending order): {coefficients}")

        routh = routh_array(coefficients)
        print("\nRouth Array:")
        for row in routh:
            print(" ".join(f"{val:10.4f}" for val in row))

        is_stable, sign_changes = check_stability(routh)

        print("\nStability Analysis:")
        if is_stable:
            print("The system is STABLE (all poles in LHS of s-plane).")
        else:
            print(f"The system is UNSTABLE with {sign_changes} poles in RHS of s-plane.")

        roots = find_roots(polynomial_str)
        rhs_poles = []
        lhs_poles = []
        imaginary_poles = []

        for root in roots:
            if isinstance(root, complex):
                if abs(root.real) < 1e-10 < abs(root.imag):
                    imaginary_poles.append(str(root))
                elif root.real > 0:
                    rhs_poles.append(str(root))
            else:
                try:
                    real_part = sp.re(root)
                    if real_part > 0:
                        rhs_poles.append(str(root))
                    elif abs(real_part) < 1e-10 and sp.im(root) != 0:
                        imaginary_poles.append(str(root))
                except TypeError:
                    pass

        print("\nPoles in right-half plane (RHS):")
        for pole in rhs_poles:
            print(f" {pole}")
        if imaginary_poles:
            print("\nPoles on imaginary axis:")
            for pole in imaginary_poles:
                print(f" {pole}")
        routh_array_formatted = [[float(val) for val in row] for row in routh]

        return jsonify(
            {
                'equation': polynomial_str,
                'coefficients': coefficients,
                'routh_array': routh_array_formatted,
                'is_stable': is_stable,
                'sign_changes': sign_changes,
                'roots': roots,
                'rhs_poles': rhs_poles,
                'imaginary_poles': imaginary_poles
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=3241)
