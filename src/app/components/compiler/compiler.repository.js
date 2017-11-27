// import Config from "../../shared/config/config.js";
import BaseRepository from "../../shared/base/base.repository.js";

class CompilerRepository extends BaseRepository {

    static getLanguageFile() {
        return super.get("./samples/whatever/class.whatever.top");
    }

     static getTableOfSymbols() {
        return super.get("./samples/whatever/table.symbols.json");
    }

     static getTableSyntatic() {
        return super.get("./samples/whatever/table.syntactic.json");
    }
}

export default CompilerRepository;