const path = require('path');
const fs = require('fs');
const request = require('request');
const isPlainObject = require('lodash/isPlainObject');
const semver = require('semver');
const logger = require('./logger');

const REPO_SERVICE_REGEXP = /^(github|bitbucket)?:?(.+)/;
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

const GIT_SERVICES = {
    github: {
        uri: (templateUrl) => `https://api.github.com/repos/${templateUrl}/tags`,
        parse: (tags) => tags.map(({ name }) => name)
    },
    bitbucket: {
        uri: (templateUrl) => `https://api.bitbucket.org/2.0/repositories/${templateUrl}/refs/tags`,
        parse: ({ values }) => values.map(({ name }) => name)
    }
};

const getTags = (templateUrl, service) => {
    if (!GIT_SERVICES[service]) {
        throw new Error(`Unregistered GIT service "${service}". Allowed: ${Object.keys(GIT_SERVICES)}`);
    }

    const { uri, parse } = GIT_SERVICES[service];

    return getJSON(uri(templateUrl)).then(
        (tags) => parse(tags).filter(semver.valid),
        (errStatus) => { throw new Error(`Unable to retrieve ${service} tags from ${uri(templateUrl)}. ${errStatus}`); }
    );
};


const getLatestTag = (templateUrl, service) => {

    return getTags(templateUrl, service).then(
        (tags) => (tags.length > 0 ? tags[0] : 'master')
    );

};

const deleteFile = (files, filepath, ctx) => {
    if (files[filepath]) {
        files[filepath] = null; //eslint-disable-line no-param-reassign
        delete files[filepath]; //eslint-disable-line no-param-reassign
        logger.verbose(`${ctx ? `[${ctx}] ` : ''}File ${filepath} removed.`);
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
    const [, service = 'github', templateUrl] = templateName.match(REPO_SERVICE_REGEXP) || [];
    if (typeof version === 'string' && version !== 'latest') {
        if (semver.validRange(version)) {
            return getTags(templateUrl, service).then((tags) => {
                const maxVersion = semver.maxSatisfying(tags, version);
                if (maxVersion) {
                    return Promise.resolve(`${service}:${templateUrl}#${maxVersion}`);
                }
                return Promise.reject(new Error(`No repository releases matches semver "${version}"`));
            });
        }

        return Promise.resolve(`${service}:${templateUrl}#${version}`);

    }
    return getLatestTag(templateUrl, service).then((v) => `${service}:${templateUrl}#${v}`);
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