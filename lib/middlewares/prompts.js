const inquirer = require('inquirer');
const logger = require('../logger');

module.exports = (prompts = []) => (files, metalsmith, done) => {

    if (Array.isArray(prompts) && prompts.length > 0) {
        inquirer
            .prompt(prompts)
            .then((answers) => {
                const data = metalsmith.metadata();
                metalsmith.metadata(Object.assign(data, answers));
                logger.verbose(`[prompts] Prompt answers: "${JSON.stringify(answers)}`);
                done();
            })
            .catch((err) => {
                done(err);
            });
    } else {
        done();
    }

};