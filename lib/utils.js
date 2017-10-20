const path = require('path');
const fs = require('fs');
const request = require('request');
const isPlainObject = require('lodash/isPlainObject');
const semver = require('semver');
const logger = require('./logger');

const result = (fn, ...args) => (typeof fn === 'function' ? fn(...args) : fn);

const objectToString = (obj) => {
    return Object.keys(obj).reduce((arr, key) => {
        return arr.concat(`${key}: ${obj[key]}`);
    }, []).join(', ');
};

const tmpDir = (str) => {
    return path.join(require('user-home'), '.umeboshi-cli', str.replace(/[/#:]+/g, '-'));
};

const listFolders = (folder) => {
    return fs.readdirSync(folder).filter((f) => (
        fs.statSync(path.join(folder, f)).isDirectory()
    ));
};

const getJSON = (uri) => {
    return new Promise((resolve, reject) => {
        request.get({
            uri,
            headers: {
                'User-Agent': 'request'
            },
            json: true
        }, (err, res, results) => {

            if (err || (res.statusCode < 200 || res.statusCode >= 400)) {

                const errStatus = res ? `(status: ${res.statusCode})` : `(error: ${err.message})`;
                reject(errStatus, err, res);
                return;
            }

            resolve(results, err, res);
        });
    });
};

const getTags = (templateName) => {
    const uri = `https://api.github.com/repos/${templateName}/tags`;

    return getJSON(uri).then(
        (tags) => tags.map(({ name }) => name).filter(semver.valid),
        (errStatus) => { logger.verbose(`Unable retrieve github tags from ${uri}. ${errStatus}`); }
    );
};


const getLatestTag = (templateName) => {

    return getTags(templateName).then(
        (tags) => (tags.length > 0 ? tags[0] : 'master')
    );

};

const deleteFile = (files, filepath) => {
    if (files[filepath]) {
        files[filepath] = null; //eslint-disable-line no-param-reassign
        delete files[filepath]; //eslint-disable-line no-param-reassign
        logger.verbose(`File ${filepath} removed.`);
    }
};

const getFileContents = (files, filepath) => {
    if (files[filepath]) {
        return files[filepath].contents.toString();
    }
    return null;
};

const fileToJSON = (files, filepath) => {
    const contents = getFileContents(files, filepath);
    if (contents) { return JSON.parse(contents); }
    return {};
};


const JSONtoBuffer = (json) => Buffer.from(JSON.stringify(json, null, 2));


const resolveRepoUrl = (templateName, version) => {
    if (typeof version === 'string' && version !== 'latest') {
        if (semver.validRange(version)) {
            return getTags(templateName).then((tags) => {
                const maxVersion = semver.maxSatisfying(tags, version);
                if (maxVersion) {
                    return Promise.resolve(`github:${templateName}#${maxVersion}`);
                }
                return Promise.reject(new Error(`No repository releases matches semver "${version}"`));
            });
        }

        return Promise.resolve(`github:${templateName}#${version}`);

    }
    return getLatestTag(templateName).then((v) => `github:${templateName}#${v}`);
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

        template.contents = Buffer.from(
            template.contents.toString().replace(`{{!-- ${tag} --}}`, `${content}{{!-- ${tag} --}}`)
        );
    }
};

module.exports = {
    Injector,
    getLatestTag,
    listFolders,
    objectToString,
    tmpDir,
    deleteFile,
    result,
    JSONtoBuffer,
    getFileContents,
    fileToJSON,
    getJSON,
    resolveRepoUrl
};