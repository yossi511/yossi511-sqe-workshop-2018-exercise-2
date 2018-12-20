import assert from 'assert';
import {parseCode, doSymbolicSubstitution, evaluateCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });
});

describe('Testing the symbol substitution.', () => {
    it('Testing correctness with an empty text expression.', () => {
        assert.equal(
            doSymbolicSubstitution(''),
            ''
        );
    });

    it('Testing correctness with an empty bodied function.', () => {
        assert.equal(
            doSymbolicSubstitution('function f() {\n' +
                '}'),
            'function f() {\n' +
            '}'
        );
    });
    it('Testing correctness with a simple variable declaration.', () => {
        assert.equal(
            doSymbolicSubstitution('let x = 0;'),
            'let x = 0;');
    });
    it('Testing correctness with the assignment given test case 1#.', () => {
        assert.equal(
            doSymbolicSubstitution('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n'),
            'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + (0 + 5);\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z + (0 + z + 5);\n' +
            '    }\n' +
            '}');
    });
    it('Testing correctness with the assignment given test case 2#.', () => {
        assert.equal(
            doSymbolicSubstitution('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + (x + 1 + y)) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}');
    });

    it('Testing correctness with a very simple body function.', () => {
        assert.equal(
            doSymbolicSubstitution('function f(a, b, c){\n' +
                '   a=0;\n' + '   b=1;\n' + '   c=2;\n' +
                '}'),
            'function f(a, b, c) {\n' +
            '    a = 0;\n' + '    b = 1;\n' + '    c = 2;\n' +
            '}');
    });

});

describe('Testing the coloring parser.', () => {
    it('Testing correctness with an empty text expression.', () => {
        assert.equal(
            JSON.stringify(evaluateCode('')),
            '[]'
        );
    });

    it('Testing correctness with a simple variable declaration.', () => {
        assert.equal(
            JSON.stringify(evaluateCode('let x = 0;')),
            '[]'
        );
    });
    it('Testing correctness with a function that has a 3 branched if expression.', () => {
        assert.deepEqual(
            evaluateCode('function fun(a, b, c) {\n' +
                '    if (a + 1 + b < c) {\n' +
                '        return a + b + c + (0 + 5);\n' +
                '    } else if (a + 1 + b < c * 2) {\n' +
                '        return a + b + c + (0 + a + 5);\n' +
                '    } else {\n' +
                '        return a + b + c + (0 + c + 5);\n' +
                '    }\n' +
                '}', {a:6,b:6,c:10}),
            [[32,45,false],[100,117,true]]
        );
    });
    it('Testing correctness with a function that has a 3 branched if expression.', () => {
        assert.deepEqual(
            evaluateCode('function fun(a, b, c) {\n' +
                '    if (a + 1 + b < c) {\n' +
                '        return a + b + c + (0 + 5);\n' +
                '    } else if (a + 1 + b < c * 2) {\n' +
                '        return a + b + c + (0 + a + 5);\n' +
                '    } else {\n' +
                '        return a + b + c + (0 + c + 5);\n' +
                '    }\n' +
                '}', {a:6,b:6,c:20}),
            [[32,45,true]]
        );
    });
});

