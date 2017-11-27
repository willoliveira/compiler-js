import axios from "axios";
import CompilerRepository from "./compiler.repository.js";

var fileClass,
    tableLexical,
    varsDeclared,
    errors = [],
    errorsLexico,
    errorsSyntactic = [],
    orderLacos = [];

class Compiler {

    getFile() {
        CompilerRepository.getLanguageFile()
            .then(this.onSuccessGetLanguageFile.bind(this));
    }

    onSuccessGetLanguageFile(response) {
        if (response && response.data) {
            if (!response.data.trim()) 
                throw new Error("Arquivo vazio");
            else {
                fileClass = response.data;
                this.runCompiler();
            }
        }
    }
    /**
     * 1 - Léxica
     * 2 - Sintaxe
     * 3 - Semântica
     */
    runCompiler() {
        CompilerRepository.getTableOfSymbols()
            .then(this.analysisLexical.bind(this));
    }

    analysisLexical(response) {
        if (response && response.data) {
            var parsesFormated = [];
            //guardando uma referencia da tabela lexica
            tableLexical = response.data;
            //quebra por linha
            var parses = fileClass.split(/\r?\n/);
            console.log(parses);
            varsDeclared = [];
            //varrendo as listas
            parses.forEach(function(value, index) {
                var parse = value;
                var formatTokens = value.replace(/[)|(|;]/g, " ");
                var breakAspas = [];
                //se houver strings
                if (formatTokens.match(/\"/)) {
                    //como é string, quebra na aspas ao inves do espaço
                    breakAspas = formatTokens.match(/\"(.*?)\"/g);
                    breakAspas = breakAspas.map((value) => { return { value: value, string: true } });
                    formatTokens =  formatTokens.replace(/\"(.*?)\"/g, "");
                }
                //agora sim quebra por palabra
                if (breakAspas.length) formatTokens = breakAspas.concat( formatTokens.match(/\S+/g) );
                else formatTokens = formatTokens.match(/\S+/g);

                if (formatTokens) {
                    //varrendo os tokens                    
                    formatTokens.forEach(function(value, index) {
                        if (typeof value == "object") return true;
                        //verifica se está na tabela de simbolos
                        var indexToken = tableLexical.tokens.indexOf(value);
                        //verifica o token
                        this.verifyToken(value, parse, formatTokens);
                        if (indexToken === -1) {
                            errors.push({token: value, parse: parse, formatedTokens: formatTokens});
                            // this.validToken(value, parse, formatTokens);
                        }
                    }.bind(this));
                }
                parsesFormated.push({ parse: parse, formatedTokens: formatTokens || []});
            }.bind(this));

            errors.forEach(function(valueError, index) {
                var indexVars;
                if (!isNaN(valueError.token)) {
                    valueError.removeError = true;
                    return true;
                }
                //verfica se o token é uma variavel
                indexVars = varsDeclared.map((valueVarMap) => {
                    return valueVarMap.var;
                }).indexOf(valueError.token.trim());
                //se for uma variavel, remove dos erros também
                if (indexVars > -1) {
                    valueError.removeError = true;
                    return true;
                } else {
                    for (var cont = 0, len = varsDeclared.length; cont < len; cont++) {
                        var filterVar = valueError.token.match(varsDeclared[cont].var);                        
                        if (filterVar && filterVar.length) {
                            valueError.removeError = true;
                            return;
                        }
                    };
                }
                valueError.removeError = false;
            }.bind(this));
            errorsLexico = errors.filter((value) => { return !value.removeError});
            console.log("Erros léxicos: ", errorsLexico);

            CompilerRepository.getTableSyntatic()
                .then(this.analysisSyntactic.bind(this, parsesFormated));
        }
    }

    isTypeLoopOrCondictional(tableLexical, valueParse) {
        return (tableLexical.tokensWitType[valueParse.formatedTokens[0]] && (tableLexical.tokensWitType[valueParse.formatedTokens[0]].type == "loop" || tableLexical.tokensWitType[valueParse.formatedTokens[0]].type == "condictional"))
    }

    /**
     * 
     */
    analysisSyntactic(parses, response) {
        var tableSyntactic;
        // var iffs = [];
        // var fors;
        if (response && response.data) {
            tableSyntactic = response.data;
            parses.forEach(function(valueParse, index) {
                valueParse.parse = valueParse.parse.trim();
                // console.log(valueParse);
                var tableSyntacticGet = tableSyntactic.handles[valueParse.formatedTokens[0]];
                if (tableSyntacticGet) {
                    let strTransformed = tableSyntacticGet,
                        strAnalised = valueParse.parse,
                        str;
                     if (this.isTypeLoopOrCondictional(tableLexical, valueParse)) {
                        strTransformed = valueParse.parse;
                        strAnalised = tableSyntacticGet;
                        orderLacos.push(valueParse.formatedTokens[0]);
                    }
                    str = strTransformed
                        .replace(/\(/, "\\(")           //arrumas os ( que possam ter
                        .replace(/\)/, "\\)")           //arrumas os ) que possam ter
                        .replace(/\s/g, ")\\s(")        //arrumas os espaços e troca por )\s(
                    if (this.isTypeLoopOrCondictional(tableLexical, valueParse)) {
                        str = strTransformed.replace(/(\()(.+)(\))/g, ".+");
                    } else { 
                        str = strTransformed.replace(/(<)([a-zA-Z]+)(>)/g, ".+");
                    }
                    var parseWithoutPontoVirgula = strAnalised.replace(/;/, "");
                        // var verifyParseLastLetter = parseWithoutPontoVirgula[ parseWithoutPontoVirgula.length - 1 ].match(/[a-z]/i);
                        // console.log(verifyParseLastLetter);
                    str= "(\\b" + str  + ")";
                        //se for uma letra por ultimo
                        // if (verifyParseLastLetter) str = str + "\\b)";
                        // else str = str + ")";
                    var reg = new RegExp(str, "g"); 
                    //se for erro
                    if (!reg.exec(parseWithoutPontoVirgula)) {
                    //     console.log("sucesso!", valueParse, str, reg)
                    // } else {
                        // console.log("erro", valueParse, str, reg);
                        errorsSyntactic.push({parse: valueParse.parse, line: index+1});
                    }

                } else if (valueParse.parse) {
                    if (this.isTypeLoopOrCondictional(tableLexical, valueParse)) {
                        orderLacos.push(valueParse.formatedTokens[0]);
                        return true;
                    } else {
                        errorsSyntactic.push({parse: valueParse.parse, line: index+1});
                        //console.log("AAQUI", valueParse.parse);
                    }
                }
            }.bind(this));
            console.log("errorsSyntactic", errorsSyntactic);
        }
    }
    
    registerErrors(error) {
        errors.push(error);
    }

    verifyToken (token, parse, formatTokens) {
        var tokenType = tableLexical.tokensWitType[token];
        if (tokenType) {
            tokenType = Object.assign(tokenType);
            if (tokenType.type == "type") {
                varsDeclared.push({
                    var: formatTokens[1],
                    type: tokenType.token
                });
            }
        }
    }

}

export default Compiler;