const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const download = require('download-git-repo');
const program = require('commander');
const ora = require('ora');
const semver = require('semver');
const chalk = require('chalk');
const inquirer = require('inquirer');

const pkg = require('../package.json');
const logger = require('../lib/logger');
const generate = require('../lib/generator');
const { tmpDir, objectToString, resolveRepoUrl } = require('../lib/utils');

if (semver.satisfies(process.version, pkg.engines.node) === false) {
    logger.fatal(`[create] Your current version of Node.js doesn't satisfy the minimun requirement: ${pkg.engines.node}`);
    process.exit(1);
}

/**
 * Usage.
 */

program
    .version(pkg.version)
    .usage('<template> [options]')
    .option('--verbose', 'Verbose output')
    .option('--dry-run', 'Don\'t write files into the destination folder')
    .option('--log-level <n>', `Log levels: ${logger.asString()}`, parseInt);

/**
 * Help.
 */

program.on('--help', () => {
    logger.log('  Examples:');
    logger.log();
    logger.log(chalk.gray('    # create a barebone, no library project'));
    logger.log('    $ umeboshi create base my-project');
    logger.log();
    logger.log(chalk.gray('    # create a React project'));
    logger.log('    $ umeboshi create react my-project');
    logger.log();
    logger.log(chalk.gray('    # create a new project straight from a github template'));
    logger.log('    $ umeboshi create username/repo my-project');
    logger.log();
});

program.parse(process.argv);
if (program.args.length < 2) {
    program.help();
    process.exit();
}

if (!program.verbose && Number.isFinite(program.logLevel)) {
    logger.setLevel(program.logLevel);
} else if (program.verbose) {
    logger.setLevel(0);
}

logger.verbose(`[create] Program started with arguments: ${program.args.join(', ')}`);


/**
 * Settings.
 */

const template = program.args[0];
const [, templateName = '', version] = template.match(/^([^#]+)#?(.*)$/) || [];
const hasSlash = templateName.indexOf('/') > -1;
const isLocal = /^(\.|\/)/.test(template);
const rawName = program.args[1];
const inPlace = !rawName || rawName === '.';
const name = inPlace ? path.relative('../', process.cwd()) : rawName;
const to = path.resolve(rawName || '.');

if (templateName === '') {
    logger.fatal('[create] You must provide a valid <template> argument');
}

const completed = (err) => {
    if (err) {
        logger.fatal(`[create] Scaffoling failed: ${err.message.trim()}`);
        return;
    }
    logger.message('[create] Scaffolding completed!\n');
    logger.log('Next Steps:\n');
    if (!inPlace) {
        logger.log(`- cd into the project folder: cd ${rawName}`);
    }
    logger.log('- install dependencies: yarn install');
    logger.log('- launch development env: yarn start\n');
};

if (fs.existsSync(to) && fs.readdirSync(to).length > 0) {
    logger.fatal(`[create] path "${to}" already exists and is not empty`);
}

const resolveTemplate = (options = {}) => {
    const {
        version, //eslint-disable-line no-shadow
        templateName, //eslint-disable-line no-shadow
        hasSlash //eslint-disable-line no-shadow
    } = options;

    if (hasSlash) {
        return resolveRepoUrl(templateName, version);
    }

    return resolveRepoUrl(`dwightjack/umeboshi-template-${templateName}`, version);
};

logger.verbose(`[create] Path "${to}" is a valid path`);

if (program.dryRun) {
    logger.verbose('[create] DRY RUN!');
}

inquirer.prompt([
    {
        type: 'input',
        name: 'name',
        message: 'Project name (lowercase letters, numbers and -)',
        default: name,
        validate: (input) => /^[a-z][0-9a-z-]+$/.test(input) === true
    },
    {
        type: 'input',
        name: 'description',
        message: 'Project Description',
        validate: (input) => input.length > 0
    },
    {
        type: 'input',
        name: 'author',
        message: 'Project Author'
    }
]).then((answers) => {

    logger.verbose(`[create] Answers - ${objectToString(answers)}`);

    const options = Object.assign({
        version: (version || 'latest'),
        templateName,
        dryRun: program.dryRun || false,
        to,
        fullName: answers.name.replace(/(^[a-z]|-[a-z])/ig, (match) => match.toUpperCase()).replace('-', ' '),
        hasSlash
    }, answers);


    if (isLocal) {

        if (fs.existsSync(template)) {
            logger.verbose('[create] Generating template files...');

            generate(Object.assign({}, options, {
                src: template
            }), completed);
            return Promise.resolve(null);
        }

        logger.fatal(`[create] Local folder ${template} not found`);
        return Promise.reject(new Error(`[create] Local folder ${template} not found`));
    }

    const spinner = ora('resolving templates...');
    spinner.start();

    return resolveTemplate(options)
        .then((templateUrl) => {
            spinner.succeed();
            return { templateUrl, options };
        })
        .catch((err) => {
            spinner.fail();
            return Promise.reject(err);
        });

}).then((res) => {

    if (res === null) {
        return;
    }

    const { templateUrl, options } = res;

    const tmpFolder = tmpDir(templateUrl.replace(/[#.]+/g, ''));

    const generateCallback = () => {
        logger.verbose('[create] Generating template files...');

        generate(Object.assign({ command: 'create' }, options, {
            src: tmpFolder
        }), completed);
    };

    if (fs.existsSync(tmpFolder)) {
        logger.verbose(`[create] Local template copy found at ${tmpFolder}`);
        generateCallback();

    } else {
        const spinner = ora(`downloading template "${templateUrl}"`);
        spinner.start();

        download(templateUrl, tmpFolder, { clone: false }, (err) => {

            if (err) {
                spinner.fail();
                logger.fatal(`[create] Failed to download template ${templateUrl}: ${err.message.trim()}`);
                completed(err);
                return;
            }

            spinner.succeed();
            generateCallback();
        });
    }



}).catch((...args) => {
    logger.fatal(...args);
    logger.verbose('[create] Error:', ...args);
});