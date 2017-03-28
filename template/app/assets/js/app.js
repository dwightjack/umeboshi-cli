/**
 * Main Application File
 *
 * Use for bootstrapping large application
 * or just fill it with JS on small projects
 *
 */

import 'babel-polyfill';

const box = document.createElement('p');

box.className = 'c-box';
box.innerHTML = 'Hello World';

document.body.appendChild(box);