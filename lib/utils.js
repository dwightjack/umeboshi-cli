const path = require('path');
const fs = require('fs');
const isPlainObject = require('lodash/isPlainObject');

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


function Injector(files) {
    this.files = files;
}

Injector.prototype.at = function injectorAt(file, tag, content = '') {
    if (this.files[file]) {
        const template = this.files[file];

        if (isPlainObject(tag)) {
            Object.keys(tag).forEach((t) => {
                this.at(file, t, tag[t]);
            });
            return;
        }

        template.contents = new Buffer(
            template.contents.toString().replace(`{{!-- ${tag} --}}`, `${content}{{!-- ${tag} --}}`)
        );
    }
};

module.exports.Injector = Injector;