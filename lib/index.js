const fs = require('fs');
const path = require('path');

const download = require('download-git-repo');
const program = require('commander');
const ora = require('ora');
const semver = require('semver');
const chalk = require('chalk');
const inquirer = require('inquirer');

const pkg = require('../package.json');
const logger = require('./logger');

if (semver.satisfies('4.0.0', pkg.engines.node) === false) {
    logger.fatal(`Your current version of Node.js doesn't satisfy the minimun requirement: ${pkg.engines.node}`);
    return;
}

/**
 * Usage.
 */

program
    .version(pkg.version)
    .usage('<template> [folder-name]')
    .option('--verbose', 'Verbose output', () => {
        logger.setLevel(0);
        return true;
    })
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
}

/**
 * Settings.
 */

const template = program.args[0];
const tmp = path.join(require('user-home'), '.vue-templates', template.replace(/\//g, '-').replace(/#/g, '_'));
const [match, templateName, version = 'master'] = template.match(/^([^#]+)#?(master|[0-9.]+|)$/) || [];
const hasSlash = templateName.indexOf('/') > -1;
const rawName = program.args[1];
const inPlace = !rawName || rawName === '.';
const name = inPlace ? path.relative('../', process.cwd()) : rawName;
const to = path.resolve(rawName || '.');

if (fs.existsSync(to)) {
    logger.fatal(`path "${to}" already exists`);
    return;
}

const templatePath =  hasSlash ? template : officialTemplate = `dwightjack/umeboshi-${template}#${version}`;

const spinner = ora('downloading template');
spinner.start();

download(templatePath, tmp, { clone: false }, (err) => {
    spinner.stop();
    if (err) {
        logger.fatal(`Failed to download template ${templatePath}: ${err.message.trim()}`);
    }
    generate(name, tmp, to, (err) => {
        if (err) {
            logger.fatal(err);
        }
        logger.message('Generated "%s".', name);
    });
});