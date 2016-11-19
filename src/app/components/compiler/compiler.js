import axios from "axios";
import CompilerRepository from "./compiler.repository.js";

var fileClass,
    tableLexical,
    varsDeclared;

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
            //guardando uma referencia da tabela lexica
            tableLexical = response.data;
            console.log(response.data);
            var parses = fileClass.split(/\r?\n/);
            console.log(parses);
            varsDeclared = [];
            //varrendo as listas
            parses.forEach(function(value, index) {
                var parse = value;
                var formatTokens = value.replace(/[)|(|;]/g, " ").match(/\S+/g);
                // console.log(formatTokens);
                if (formatTokens) {
                    //varrendo os tokens                    
                    formatTokens.forEach(function(value, index) {
                        //verifica se está na tabela de simbolos
                        var indexToken = tableLexical.tokens.indexOf(value);
                        //verifica o token
                        this.verifyToken(value, parse, formatTokens);
                        console.log(indexToken);
                        if (indexToken === -1) {
                            this.validToken(value, parse, formatTokens);
                        }
                        // console.log(value, indexToken);
                    }.bind(this));
                }
            }.bind(this));
        }
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

    validToken (token, parse, formatTokens) {
        var token = varsDeclared.map((value) => { return value.var }).indexOf(token);
        console.log(token);
        if (token) { 
            console.log(token);            
        }
    }
}


export default Compiler;
