const path = require('path');

module.exports.objectToString = (obj) => {
    return Object.keys(obj).reduce((arr, key) => {
        return arr.concat(`${key}: ${obj[key]}`);
    }, []).join(', ');
};

module.exports.tmpDir = (str) => {
    return path.join(require('user-home'), '.umeboshi-cli', str.replace(/[/#:]+/g, '-'));
};