const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const download = require('download-git-repo');
const async = require('async');
const program = require('commander');
const ora = require('ora');
const semver = require('semver');
const chalk = require('chalk');
const inquirer = require('inquirer');
const merge = require('lodash/merge');
const result = require('lodash/result');

const pkg = require('../package.json');
const logger = require('../lib/logger');
const generate = require('../lib/generator');
const objectToString = require('../lib/utils').objectToString;
const tmpDir = require('../lib/utils').tmpDir;

if (semver.satisfies(process.version, pkg.engines.node) === false) {
    logger.fatal(`Your current version of Node.js doesn't satisfy the minimun requirement: ${pkg.engines.node}`);
    return;
}

/**
 * Usage.
 */

program
    .version(pkg.version)
    .usage('<template> [options]')
    .option('--verbose', 'Verbose output')
    .option('--log-level <n>', `Log levels: ${logger.asString()}`, parseInt);

/**
 * Help.
 */

program.on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log(chalk.gray('    # create a barebone, no library project'));
    console.log('    $ umeboshi create base my-project');
    console.log();
    console.log(chalk.gray('    # create a React project'));
    console.log('    $ umeboshi create react my-project');
    console.log();
    console.log(chalk.gray('    # create a new project straight from a github template'));
    console.log('    $ umeboshi create username/repo my-project');
    console.log();
});

program.parse(process.argv);
if (program.args.length < 2) {
    return program.help();
}

if (!program.verbose && Number.isFinite(program.logLevel)) {
    logger.setLevel(program.logLevel);
} else if (program.verbose) {
    logger.setLevel(0);
}

logger.verbose(`Program started with arguments: ${program.args.join(', ')}`);


/**
 * Settings.
 */

const template = program.args[0];
const [match, templateName = 'base', version = 'master'] = template.match(/^([^#]+)#?(master|develop|[0-9.]+|)$/) || [];
const hasSlash = templateName.indexOf('/') > -1;
const isLocal = /^(\.|\/)/.test(template);
const rawName = program.args[1];
const inPlace = !rawName || rawName === '.';
const name = inPlace ? path.relative('../', process.cwd()) : rawName;
const to = path.resolve(rawName || '.');

if (fs.existsSync(to) && fs.readdirSync(to).length > 0) {
    logger.fatal(`path "${to}" already exists and is not empty`);
    return;
}

logger.verbose(`Path "${to}" is a valid path`);

inquirer.prompt([
    {
        type: 'input',
        name: 'name',
        message: 'Project name (lowercase letters, numbers and -)',
        default: name,
        validate: (input) => /^[a-z][0-9a-z\-]+$/.test(input) === true
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

    logger.verbose(`Answers - ${objectToString(answers)}`);

    const options = Object.assign({
        version,
        templateName,
        to,
        fullName: answers.name.replace(/(^[a-z]|-[a-z])/ig, (match) => match.toUpperCase()).replace('-', ' '),
        hasSlash,
        tmpl: { hmr: false }
    }, answers);


    const completed = (err) => {
        if (err) {
            logger.fatal(`Scaffoling failed: ${err.message.trim()}`);
            return;
        }
        logger.message('Scaffolding completed!\n');
        logger.log('Next Steps:\n');
        if (!inPlace) {
            logger.log(`- cd into the project folder: cd ${rawName}`);
        }
        logger.log('- install dependencies: yarn install');
        logger.log('- launch development env: yarn start\n');
    };


    if (isLocal) {

        if (fs.existsSync(template)) {
            logger.verbose('Generating template files...');

            generate(Object.assign({}, options, {
                src: template
            }), completed);
            return;
        }

        logger.fatal(`Local folder ${template} not found`);
        return;
    }

    const templates = [];

    if (hasSlash) {
        templates.push(`github:${templateName}#${version || 'master'}`);
    } else {

        if (templateName !== 'base') {
            templates.push('github:dwightjack/umeboshi-base#master');
        }

        templates.push(`github:dwightjack/umeboshi-${templateName}#${version || 'master'}`);
    }

    const tmpFolder = tmpDir(`${_.last(templates)}-${Date.now()}`);

    async.eachSeries(templates, (tmplUrl, callback) => {

            const spinner = ora(`downloading template "${tmplUrl}"`);
            spinner.start();

            download(tmplUrl, tmpFolder, { clone: false }, (err) => {

                if (err) {
                    spinner.fail();
                    logger.fatal(`Failed to download template ${tmplUrl}: ${err.message.trim()}`);
                    callback(err);
                    return;
                }
                spinner.succeed();
                callback();

            });

        }, (err) => {
            if (err) {
                completed(err);
                return;
            }

            logger.verbose('Generating template files...');

            generate(Object.assign({ command: 'create' }, options, {
                src: tmpFolder
            }), completed);

        });
});