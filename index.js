/*

customized version of zenpoint REPL, for Glitch, based on https://github.com/ploki/Zenpoint


*/

const os = require('os');
const fs = require('fs');
const net = require('net');
const repl = require('repl');
const chalk = require('chalk');
const CircularJSON = require('flatted/cjs');

const util = require("util");//was not in github version for some reason

const regexEOL = /\r?\n/g;
const netEOL = '\r\n';

const restart_flag = '/app/.repl.restart'; fs.unlink(restart_flag,function(){});


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

 function prepareSocket(socket,cb) {
     let count = 0,done=false; 
     const waitfor = function(data){
         if (done) return;
         count += data.length;
         if (count > 5) {
            socket.off('data',waitfor);
            cb();
         }
     };
    socket.isTTY = true;
    // IAC WILL ECHO IAC WILL SUPPRESS_GO_AHEAD IAC WONT LINEMODE
        
    socket.on('data',waitfor);
    socket.write(Buffer.from([255, 251, 1, 255, 251, 3, 255, 252, 34]));  
}

 
  
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
        const replMsg = function  (msg,toConsole) {
           if (connection && msg) {
               if (!connection.elsewhere) connection.write(msg+netEOL);  
           }
           switch (toConsole) {
               case true: return msg ? console.log(msg) : false;
               case "norepl": 
                   return (!connection && msg) ? console.log(msg):false;
           }      
        };
        
        const restartWithNotify = function (msg,cb) {
             fs.writeFile(restart_flag,Date.now().toString(),function(){
                replMsg(msg);
                setTimeout(process.exit, 1000, 0);
                connection.elsewhere=true;
                connection.end();
                connection=false;
                if (typeof cb==='function') cb();
            }); 
        };      
        
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
                
                  prepareSocket(socket,function(){
              
                 
                    socket.write(
                    '🐀🧘🐁 Welcome to the Zenpoint 🥑🐦🦐' + netEOL +
                        stack + netEOL+ netEOL+
                    'use Ctrl-D to exit to the Glitch Terminal' + netEOL + netEOL);
         
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
                require('repl.history')(cmd,  process.env.REPL_HISTORY ||  process.env.HOME + '/.repl_history');
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
                
                if (cmd.context.__filename === undefined) {
                  Object.defineProperties(cmd.context, {
                     __filename :{
                        value : "repl",
                        enumerable : false,
                       writable : false

                     },

                    exit : {
                         get : function (){

                            replMsg("Tip : To exit, you can use Ctrl - D");
                            connection.elsewhere=true;
                            connection.end();
                            connection=false;
                            return function(){
                               return "dumping connection";
                           };
                         },
                         enumerable : false
                      },
                     refresh : {
                         get : function (){

                            restartWithNotify ("Refreshing the glitch browser, The REPL will restart shortly",function(){
                                const child = require('child_process').execFile('/usr/bin/refresh', [], function (error, stdout, stderr) {
                                     process.exit();  
                                }); 
                            });
                             
                            return function(){
                               return "refreshing browser";
                           }; 
                         },
                         enumerable : false
                      },
                      restart : {
                         get : function (){
                             
                             restartWithNotify("Restarting the server process. The REPL will restart shortly");
                             
                             return function(){
                               return "dumping connection";
                           };
                         },
                         enumerable : false
                      }
                  });
                }
                
                if (typeof options.log_eval==='function' || typeof options.log_eval_result === ' function') {
                  customEval.wrapped = cmd.eval;
                  cmd.eval = customEval;
                }
                      
               });
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
            replMsg("REPL socket server shutdown"+netEOL);  
            connection=undefined;
            srv.close();
         },
         message : replMsg,
         restart : restartWithNotify 
       }
    }
}

module.exports = zenpoint;

function writeReplBash (opts,cb) {
   opts=opts||{listen: process.env.REPL_PORT||1976};
    
  fs.writeFile('/app/repl',`#/bin/bash


source /app/.env

function waitREPL {
  nc -z 127.0.0.1 $REPL_PORT  && return 0
  echo -n "waiting for REPL service to come online..."
  until nc -z 127.0.0.1 $REPL_PORT
  do 
      echo -n .
      sleep 1
  done
  echo "ready"
}

function waitServer {
     [ -f  ${restart_flag}  ] || return 0
     echo -n "waiting for server to restart.."
     while [ -f  ${restart_flag}  ]
     do
        sleep 1
        echo -n "."
     done
     echo "restarted"
}

function goREPL {
  telnet localhost ${  process.env.REPL_PORT ==   opts.listen ?    "$REPL_PORT" :    opts.listen   }
}

waitREPL
goREPL


while [ -f ${restart_flag}  ]
do
     waitServer
     waitREPL
     source /app/.env
     goREPL
done

echo "use /app/repl to re-enter the REPL (server is still running)" `,function (){
       fs.chmod('/app/repl', 0o777, function (){
           if (opts.disable_auto_start)
             fs.unlink('/app/.profile',cb);
           else  
             fs.writeFile('/app/.profile',`#/bin/bash\n\n/app/repl`,cb);
          });
    });   
    
}

function glitchREPL(context,port) {
    context = context || {};
    const opts = {
        listen: port || 1976,
        inspectDepth: 0,
        persist: true,
        context: context,
        connect_ips: [ '::ffff:127.0.0.1']
    };
    
    zenpoint.rsrv = zenpoint(opts);
    writeReplBash(opts,function(){ });
    return zenpoint.rsrv ;
}


zenpoint.express = function(app,express,cont) {
  
  const context = cont || {};
  context.app = app;
  context.express = express;  
    
  return glitchREPL(context,process.env.REPL_PORT);
  
} ; 

zenpoint.fastify = function(fastify,cont) {
  
  const context = cont || {};
  context.fastify = fastify;  
    
  return glitchREPL(context,process.env.REPL_PORT);
  
} ; 

zenpoint.writeReplBash = writeReplBash;


