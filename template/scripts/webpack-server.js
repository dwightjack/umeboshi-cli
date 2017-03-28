const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const address = require('ip').address();
const merge = require('webpack-merge');

const paths = require('../config/paths');
const localhost = require('../config/hosts').local;
const middlewares = require('./middlewares');

const publicPath = `http://${address}:${localhost.port}${paths.publicPath}`;

const config = merge.smart({
    entry: {
        app: [
            'eventsource-polyfill', // Necessary for hot reloading with IE
            {{#if_eq templateName 'react'}}'react-hot-loader/patch',{{/if_eq}}
            'webpack-dev-server/client?http://' + address + ':' + localhost.port,
            'webpack/hot/only-dev-server'
        ]
    },
    output: {
        publicPath
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
}, require('../config/webpack.dev'));

const compiler = webpack(config);

const server = new WebpackDevServer(compiler, {
    contentBase: paths.toAbsPath('dist.root'),
    compress: false,
    hot: true,
    historyApiFallback: true,
    //TODO: temporary fix for https://github.com/mxstbr/react-boilerplate/issues/370 and https://github.com/webpack/style-loader/pull/96
    publicPath,
    stats: config.stats,
    setup(app) {
        if (middlewares.length > 0) {
            middlewares.forEach((middleware) => app.use(middleware));
        }
    }
});

server.app.get('*', (req, res) => {
    compiler.outputFileSystem.readFile(paths.toAbsPath('dist.root') + '/index.html', (err, file) => {
        if (err) {
            res.sendStatus(404);
        } else {
            res.end(file.toString());
        }
    });
});

server.middleware.waitUntilValid(() => {
    console.log('\nStarted a server at http://%s:%s\n', address, localhost.port); //eslint-disable-line no-console
});

server.listen(localhost.port, (err) => {
    if (err) {
        console.log(err); //eslint-disable-line no-console
    }
});