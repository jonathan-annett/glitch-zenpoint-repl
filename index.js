const os = require('os');
const net = require('net');
const repl = require('repl');
const chalk = require('chalk');
const CircularJSON = require('flatted/cjs');

const regexEOL = /\r?\n/g;
const netEOL = '\r\n';

const inspectOptions = {
    depth: 4, //Infinity, crash!
    colors: true,
    getters: true,
};

let replOptions = {
    terminal: true,
    useColors: true,
    useGlobal: true,
    ignoreUndefined: false,
};


function Logger(outputStream) {
    return (...args) => {
        args.forEach(arg => {
            if (typeof arg === 'string') {
                outputStream.write(arg + ' ');
            } else {
                outputStream.write(util
                                   .inspect(arg, inspectOptions)
                                   .replace(regexEOL, netEOL) + ' ');
            }
        });
        outputStream.write(netEOL);
    };
}

function cr(str) {
    return str.replace(regexEOL, netEOL);
}

function prompt(callerName) {
    const homeDir = os.homedir();
    let cwd = process.cwd();
    if (cwd.startsWith(homeDir)) {
        cwd = '~' + cwd.substr(homeDir.length);
    }
    return chalk.grey('┏━┫') + chalk.yellow(`${process.env.LOGNAME}`) +
        chalk.cyan('@') + chalk.magenta(`${os.hostname()}`) +
        chalk.cyan(':') + chalk.blueBright(`${cwd}`) +
        chalk.cyan('#') +
        chalk.blue(`${callerName}`) + chalk.cyan('@') + 
        chalk.blue(`node-${process.version}`) +
        chalk.grey('┃') + '🙈🙉🙊' +
        chalk.grey('┣━\n┗') +
        chalk.black.bgBlackBright('>') +
        chalk.grey('┫');
}

/**
 * @param {Object} options -
 * @param {vary} options.listen - something suitable for net.server.listen
 * @param {Boolean} options.persist - should the zenpoint server persist after
 *                                    the telnet client disconnects
 * @param {Number} options.inspectDepth - depth setting of the inspect function
 *                                        for the zenpoint session
 * @param {Object} options.context - bind here the variable you want to import
 *                                   in the zenpoint session
 */
function zenpoint(options) {
    const callerName = arguments.callee.caller
          ? arguments.callee.caller.name
          : '(anonymous)';
    const stack = (new Error('Zenpoint'))
          .stack
          .split(os.EOL)
          .slice(2).map(line => line.replace(/    at /, "🐛🐞🐜🐝🦗➞ "))
          .join(netEOL);
    if (options.listen) {
        const srv = net.createServer(function (socket) {
            try {
                socket.isTTY = true;
                // IAC WILL ECHO IAC WILL SUPPRESS_GO_AHEAD IAC WONT LINEMODE
                socket.write(
                    Buffer.from([255, 251, 1, 255, 251, 3, 255, 252, 34]));
                socket.write(
                    '🐀🧘🐁 Welcome to the Zenpoint 🥑🐦🦐' + netEOL +
                        stack);
                var cmd = repl.start({
                    ...replOptions,
                    prompt: cr(prompt(callerName)),
                    input: socket,
                    output: socket,
                    writer: (obj) => {
                        return cr(util.inspect(obj, inspectOptions));
                    },
                }).on('exit', () => {
                    socket.write(chalk.gray('exit')+cr(os.EOL));
                    socket.end();
                    if (!options.persist) {
                        srv.close();
                    }
                });
                if (options.inspectDepth !== undefined)  {
                    inspectOptions.depth = options.inspectDepth;
                }
                cmd.context.d = (x) => { inspectOptions.depth = x; };
                cmd.context.inspectOptions = inspectOptions;
                cmd.context.log = Logger(socket);
                cmd.context.cr = cr;
                cmd.context.stack = stack;
                if (options.context) {
                    Object.keys(options.context).forEach(key => {
                        cmd.context[key] = options.context[key];
                    });
                }
                cmd.context.frozen =
                    CircularJSON.parse(CircularJSON.stringify(options.context));
            } catch (e) {
                socket.end();
            }
        }).listen(options.listen);
    }
}

module.exports = zenpoint;
