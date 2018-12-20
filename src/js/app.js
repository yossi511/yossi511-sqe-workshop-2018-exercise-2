import $ from 'jquery';
import {parseCode, evaluateCode, doSymbolicSubstitution} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let code = $('#codePlaceholder').val();
        let parsedCode = parseCode(code);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

$(document).ready(function () {
    $('#codeSymbolSubstitution').click(() => {
        let code = $('#codePlaceholder').val();
        let parsedCode = doSymbolicSubstitution(code);
        $('#parsedCode').val(parsedCode);
    });
});

$(document).ready(function () {
    $('#codeEvaluation').click(() => {
        let code = $('#input').val();
        let parsedCode = $('#parsedCode').val();
        let input = JSON.parse(code);
        let indexToColor = evaluateCode(parsedCode, input);
        let counter = 0;
        indexToColor.map((lex)=>{
            let fromIndexColor = lex[2] ? '<mark style="background-color: greenyellow">' : '<mark style="background-color: orangered">';
            parsedCode = parsedCode.slice(0, lex[0] + counter) + fromIndexColor + parsedCode.slice(lex[0] + counter, lex[1] + counter) + '</mark>' + parsedCode.slice(lex[1] + counter);
            counter = counter + fromIndexColor.length + ('</mark>').length;
        });
        document.getElementById('outputText').innerHTML = '<pre>'+parsedCode+'</pre>';
    });
});
