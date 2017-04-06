const path = require('path');
const fs = require('fs');

module.exports.objectToString = (obj) => {
    return Object.keys(obj).reduce((arr, key) => {
        return arr.concat(`${key}: ${obj[key]}`);
    }, []).join(', ');
};

module.exports.tmpDir = (str) => {
    return path.join(require('user-home'), '.umeboshi-cli', str.replace(/[/#:]+/g, '-'));
};

module.exports.listFolders = (folder) => {
    return fs.readdirSync(folder).filter((f) => (
        fs.statSync(path.join(folder, f)).isDirectory()
    ));
};