import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as staticeval from 'static-eval';

const Environment = [];
let parameters = [];

/**
 * Parses the code.
 * @param code
 */
const parseCode = (code) => {
    return esprima.parseScript(code);
};

/**
 * Parses the given source code with input.
 * @param code
 */
const parseCodeSource = (code) => {
    return esprima.parseScript(code, {loc: true, range: true}, node => node.txt =
        code.substring(node.range[0], node.range[1]));
};

/**
 * Returns variables from given element.
 * @param element
 * @returns {*}
 */
function getVariables(element) {
    switch (element.type) {
    case 'VariableDeclarator':
        return element.init;
    case 'AssignmentExpression':
        return element.right;
    default:
        break;
    }
}

/**
 * Predicate for if expression evaluation.
 * @param element
 * @param previousElement
 * @returns {boolean}
 */
function isNeededIfEvaluation(element, previousElement) {
    return element.type === 'IfStatement' && !(previousElement.type === 'IfStatement' && previousElement.alternate === element && previousElement.dit);
}

/**
 * Checks if parameters are in assignment expression.
 * @param element
 * @param parameters
 * @returns {boolean|*}
 */
function isExpressionInAssignment(element, parameters) {
    return (element.type === 'ExpressionStatement' && element.expression.type === 'AssignmentExpression' && parameters.includes(element.expression.left.txt));
}

/**
 * Returns predicate function for assignment expression.
 * @param parameters
 * @returns {function(*=): (*|boolean)}
 */
function isAssignmentExpression(parameters) {
    return element => isExpressionInAssignment(element, parameters) ||
        (!['VariableDeclaration', 'AssignmentExpression'].includes(element.type)
            &&
            (!(element.type === 'ExpressionStatement' && ['VariableDeclaration', 'AssignmentExpression'].includes(element.expression.type))));
}

/**
 * Removes allowed variables from the code.
 * @param element
 * @param parameters
 */
function removeVariables(element, parameters) {
    element.body = element.body.filter(isAssignmentExpression(parameters));
}

/**
 * Predicate for variable declarator or assignment.
 * @param element
 * @returns {boolean}
 */
function isDeclaratorOrAssignment(element) {
    return element.type === 'VariableDeclarator' || element.type === 'AssignmentExpression';
}

/**
 * Sets the scope's variables.
 * @param element
 */
function setScopeVariables(element) {
    Environment[Environment.length - 1][element.id ? element.id.txt : element.left.txt] = getVariables(element);
}

/**
 * Updates the whole scope variables values.
 * @param element
 * @returns {*}
 */
function updateScopeVariablesValues(element) {
    for (let i = Environment.length - 1; i > -1; i--) {
        if (Environment[i][element.txt]) {
            return Environment[i][element.txt];
        }
    }
}

/**
 * Builds new lexical scope layer.
 * @param node
 */
function buildScope(node) {
    Environment.push({});
    if (node.type === 'FunctionDeclaration') {
        parameters = node.params.map(x => x.txt).concat(Object.keys(Environment[0]));
        node.params.forEach(x => Environment[Environment.length - 1][x.txt] = x);
    }
}

/**
 * Predicate that decides whether there's need in scope variable value update.
 * @param element
 * @param previousElement
 * @returns {boolean}
 */
function isNeedScopeVariablesValuesUpdate(element, previousElement) {
    return (element.type === 'Identifier') &&
        !((previousElement.type === 'AssignmentExpression' && previousElement.left.txt === element.txt) || (previousElement.type === 'VariableDeclarator'
            && previousElement.id.txt === element.txt));
}

/**
 * Enters a new lexical scope.
 * @param element
 * @param previousElement
 * @returns {*}
 */
function enterScope(element, previousElement) {
    if (['FunctionDeclaration','FunctionExpression','BlockStatement','Program'].includes(element.type)) {
        buildScope(element);
    }
    else if (isNeedScopeVariablesValuesUpdate(element, previousElement))
        return updateScopeVariablesValues(element);
}

/**
 * Exits the lexical scope.
 * @param element
 */
function leaveScope(element) {
    if (isDeclaratorOrAssignment(element))
        setScopeVariables(element);
    if(element.type === 'BlockStatement')
        removeVariables(element, parameters);
    if (['FunctionDeclaration','FunctionExpression','BlockStatement','Program'].includes(element.type)) {
        Environment.pop();
        if (element.type === 'FunctionDeclaration')
            parameters = [];
    }
}

/**
 * Returns code after symbolic substitution.
 * @param code
 * @returns {*}
 */
const doSymbolicSubstitution = (code) => {
    let symbolicSubstitutedCode = parseCodeSource(code);
    estraverse.replace(symbolicSubstitutedCode, {
        enter: enterScope,
        leave: leaveScope
    });
    return escodegen.generate(symbolicSubstitutedCode);
};

/**
 * Main function that evaluates code.
 * @param code
 * @param input
 * @returns {Array}
 */
function evaluateCode(code, input) {
    let coloredLines=[];
    estraverse.replace(parseCodeSource(code), {
        enter: function (element, previousElement) {
            if (isNeededIfEvaluation(element, previousElement)) {
                if (staticeval(element.test, input)){
                    element.dit = true;
                    coloredLines.push([element.test.range[0],element.test.range[1],true]);
                }
                else{
                    coloredLines.push([element.test.range[0],element.test.range[1], false]);
                    element.consequent = {};
                }
            }
        }
    }
    );
    return coloredLines;
}

export {parseCode, parseCodeSource, evaluateCode, doSymbolicSubstitution};