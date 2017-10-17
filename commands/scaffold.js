const fs = require('fs');
const path = require('path');

const program = require('commander');
const semver = require('semver');
const chalk = require('chalk');
const inquirer = require('inquirer');

const pkg = require('../package.json');
const logger = require('../lib/logger');
const generate = require('../lib/generator');

if (semver.satisfies(process.version, pkg.engines.node) === false) {
    logger.fatal(`[scaffold] Your current version of Node.js doesn't satisfy the minimun requirement: ${pkg.engines.node}`);
    return;
}

/**
 * Usage.
 */

program
    .version(pkg.version)
    .usage('[<namespace>/]<template> [options]')
    .option('--verbose', 'Verbose output')
    .option('--log-level <n>', `Log levels: ${logger.asString()}`, parseInt);

/**
 * Help.
 */

program.on('--help', () => {
    logger.log('  Examples:');
    logger.log();
    logger.log(chalk.gray('    # scaffold using template in ./scaffold/component/template'));
    logger.log('    $ umeboshi scaffold component');
    logger.log();
    logger.log(chalk.gray('    # scaffold using template in ./scaffold/react/stateless/template'));
    logger.log('    $ umeboshi scaffold react/stateless');
    logger.log();
});

program.parse(process.argv);
if (program.args.length < 1) {
    return program.help();
}

if (!program.verbose && Number.isFinite(program.logLevel)) {
    logger.setLevel(program.logLevel);
} else if (program.verbose) {
    logger.setLevel(0);
}

logger.verbose(`[scaffold] Program started with arguments: ${program.args.join(', ')}`);

const input = program.args[0];
const [match, namespace, template = ''] = input.match(/^([^/]+)(?:\/([^/]+)|)$/) || [];

if (!namespace) {
    logger.fatal(`[scaffold] Invalid namespace "${namespace}"`);
    return;
}

const folderList = [
    path.join(process.cwd(), 'scaffold', namespace, template),
    path.join(process.cwd(), 'node_modules', `umeboshi-scaffold-${namespace}`, template)
];

logger.verbose(`[scaffold] Looking for template in: ${folderList.join(', ')}`);

const workingFolder = folderList.find(fs.existsSync);

if (!workingFolder) {
    logger.fatal(`[scaffold] Template "${input}" not found`);
    return;
}

logger.verbose(`[scaffold] Template "${input}" resolved as "${workingFolder}"`);

try {
    const templateIndex = path.join(workingFolder, 'index.js');
    const customizer = fs.existsSync(templateIndex) ? require(templateIndex) : {};
    const { prompts = () => [] } = customizer;

    const completed = (err) => {
        if (err) {
            logger.fatal(`[scaffold] Scaffolding failed: ${err.message.trim()}`);
            return;
        }
        logger.message('[scaffold] Scaffolding completed!\n');
    };

    inquirer
        .prompt(prompts({ program, namespace, template }))
        .then((answers) => {
            if (!answers.to) {
                completed(new Error('You must provide a "to" path string as file destination folder'))
                return;
            }
            answers.to = path.resolve(process.cwd(), answers.to);
            logger.verbose(`[scaffold] Running with options "${JSON.stringify(answers)}`);
            generate(Object.assign({ command: 'scaffold' }, answers, {
                src: workingFolder
            }), completed);
        });
} catch (e) {
    logger.fatal(`[scaffold] ${e.toString()}`);
}