import { readJSONDataArray } from "../importer-util";

export default class DirectKeyDataImporter {
    constructor(dataFileName, dataKey, dataStorageKey) {
        this._dataFileName = dataFileName;
        this._dataKey = dataKey;
        this._dataStorageKey = dataStorageKey;
    }

    async import({ zipFile }, facebookAccount) {
        facebookAccount[this._dataStorageKey] = await readJSONDataArray(
            this._dataFileName,
            this._dataKey,
            zipFile
        );
        facebookAccount.addImportedFileName(this._dataFileName);
    }
}