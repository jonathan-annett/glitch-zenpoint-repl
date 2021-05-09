/*

customized version of zenpoint REPL, for Glitch, based on https://github.com/ploki/Zenpoint


*/

const os = require('os');
const net = require('net');
const repl = require('repl');
const chalk = require('chalk');
const CircularJSON = require('flatted/cjs');

const util = require("util");//was not in github version for some reason

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
    return chalk.grey('┏━┫') + chalk.yellow(`${process.env.PROJECT_NAME}`) +
        chalk.cyan('@') + chalk.magenta(`${process.env.HOST_HOSTNAME}`) +
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

let processTopLevelAwait;
const experimentalREPLAwait = false;
const path = require ("path");

 
  
function zenpoint(options) {
    const callerName = arguments.callee.caller
          ? arguments.callee.caller.name ||'(anonymous)'
          : '(anonymous)';
    const stack = (new Error('Zenpoint'))
          .stack
          .split(os.EOL)
          .slice(2).map(line => line.replace(/    at /, "🐛🐞🐜🐝🦗➞ "))
          .join(netEOL);
    if (options.listen) {
      
       const repl_connect_ips =  options.connect_ips ?   options.connect_ips : true;
      
       const customEval = function(input, context, filename, cb) {
          if (typeof options.log_eval==='function') {
            options.log_eval(input,context,function(){
             customEval.wrapped (input, context, filename, function(err,result){
                if (typeof options.log_eval_result === 'function') {
                    options.log_eval_result(err,result,function(){
                       cb (err,result);
                  });
                } else {
                   cb (err,result);
                }
             });
          });
          } else {
             customEval.wrapped (input, context, filename, typeof options.log_eval_result !== 'function' ? cb : function(err,result){
                 options.log_eval_result(err,result,function(){
                       cb (err,result);
                  });
             });
          }
        };
        let connection;
        const srv = net.createServer(function (socket) {
            try {
                 socket.on('error',function(e){
                   if (connection===socket) connection=undefined;
                   console.log(e.message);
                 });
              
                 if(Array.isArray(repl_connect_ips) && repl_connect_ips.indexOf(socket.remoteAddress)<0 ) {
                   
                    console.log('rejecting REPL connection from:',socket.remoteAddress);
                    return socket.end();
                   
                 } else {
                   
                    if (connection) {
                       if (connection===socket) {
                         console.log("connection===socket!");
                       }
                       connection.elsewhere=true;
                       connection.write("REPL started elsewhere\n");
                       connection.end();
                      
                    }
                    connection = socket;
                    console.log('accepted REPL connection from:',socket.remoteAddress);
                 }
                socket.isTTY = true;
                // IAC WILL ECHO IAC WILL SUPPRESS_GO_AHEAD IAC WONT LINEMODE
                socket.write(Buffer.from([255, 251, 1, 255, 251, 3, 255, 252, 34]));
                socket.write(
                    '🐀🧘🐁 Welcome to the Zenpoint 🥑🐦🦐' + netEOL +
                        stack);
         
                var cmd = repl.start({
                    ...replOptions,
                    prompt: cr(prompt(callerName)),
                    input:  socket,
                    output: socket,
                    writer: (obj) => {
                        return cr(util.inspect(obj, inspectOptions));
                      }
                    }).on('exit', () => {
                    if (!socket.elsewhere) {
                   
                       socket.write(chalk.gray('exit')+cr(os.EOL));
                       socket.end();
                     
                       connection=undefined;
                    }
                   
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
                cmd.context.frozen =  CircularJSON.parse(CircularJSON.stringify(options.context));
              
                if (typeof options.log_eval==='function' || typeof options.log_eval_result === ' function') {
                  customEval.wrapped = cmd.eval;
                  cmd.eval = customEval;
                }
              
            } catch (e) {
                console.log(e);
                if (!socket.elsewhere) {
                   socket.end();
                   connection=undefined;
                }
            }
        }).listen(options.listen);
      
       return {
         
         close : function(){
            if (connection) {
               if (!connection.elsewhere) connection.write("REPL socket server shutdown\n");  
              connection=undefined;
            }
         
            srv.close();
         }
       }
    }
}

module.exports = zenpoint;

function glitchREPL(context,port) {
    context = context || {};
   
    zenpoint.rsrv = zenpoint({
        listen: port || 1976,
        inspectDepth: 0,
        persist: true,
        context: context,
        connect_ips: [ '::ffff:127.0.0.1']
    });
    return zenpoint.rsrv ;
}


zenpoint.express = function(app,express,cont) {
  
  const context = cont || {};
  context.app = app;
  context.express = express;
  context.restart = function () {
     process.exit(); 
  };
   
  glitchREPL(context,process.env.REPL_PORT);
  
} ; 

