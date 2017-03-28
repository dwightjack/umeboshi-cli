const chalk = require('chalk');

const LOG_LEVELS = {
    VERBOSE: 0,
    NORMAL: 1,
    MESSAGE: 2,
    WARNING: 3,
    ERROR: 4
};

const colors = ['gray', 'white', 'green', 'yellow', 'red'];

let LOG_LEVEL = 1;

module.exports.setLevel = (level) => {
    if (Number.isNumber(level) && Object.keys(LOG_LEVELS).indexOf(level) !== -1) {
        LOG_LEVEL = LOG_LEVELS[level];
    }
};

const log = (msg, opts = {}) => {
    const { level = 1 } = opts;
    if (level >= LOG_LEVEL) {
        console.log( //eslint-disable-line no-console
            chalk[colors[level] || colors[1]](`${msg}\n`)
        );
    }
};

module.exports.asString = () => {
    return Object.keys(LOG_LEVELS).reduce((arr, level) => {
        return arr.concat(`${LOG_LEVELS[level]}: ${level.toLowerCase()}`);
    }, []).join(', ');
};

module.exports.log = log;

module.exports.error = (msg) => log(`ERROR: ${msg}`, { level: LOG_LEVELS.ERROR });

module.exports.fatal = (msg) => {
    log(`FATAL: ${msg}`, { level: LOG_LEVELS.ERROR });
    process.exit(1);
};

module.exports.warning = (msg) => log(`WARNING: ${msg}`, { level: LOG_LEVELS.WARNING });
module.exports.verbose = (msg) => log(msg, { level: LOG_LEVELS.VERBOSE });
module.exports.message = (msg) => log(msg, { level: LOG_LEVELS.MESSAGE });