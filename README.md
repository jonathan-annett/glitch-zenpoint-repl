# glitch-zenpoint-repl

based on zenpoint (see below)

to add to your glitch project, add ` "glitch-zenpoint-repl": "github:jonathan-annett/glitch-zenpoint-repl"` to package.json:

    {
        "dependancies" : {
        "glitch-zenpoint-repl": "github:jonathan-annett/glitch-zenpoint-repl"
        }
    }

express
====

place this line just before your `app.listen` line in server.js


    require("glitch-zenpoint-repl").express(app,express,{ myVar : "something you want in the REPL context"}); 


fastify
====

place this line just before your `app.listen` line in server.js


  require("glitch-zenpoint-repl").fastify(fastify,{ myVar : "something you want in the REPL context"}); 



.env options (values shown here are the defaults, so if you don't set them, that's what you get)
```bash
REPL_PORT=1976
REPL_HISTORY=/app/.repl.history
```


technical / security considerations:

* the repl server only lets you run one repl a time, this is by design. most recently opened wins.
* the server currently only accepts connections from local host: 
     `connect_ips: [ '::ffff:127.0.0.1','127.0.0.1' ]` 
* the telnet client that gets started by /app/repl communicates with the repl server in node using clear text, **however**, since the `/app/repl` script is running in a ssh in the server process, it's as secure as any text based app runing in linux on the host.
* it's unlikely you'd be able to connect from outside of the glitch server network, so adding an external ip to `connect_ips` wpuld most likely fail, but you need to know that sending clear text over the open internet would be an issue. 
* having said that, since your `server.js` task is serving http, and is transparently proxied by glitch to give you https access, it's about as secure as your glitch site is.





original documentation

# Zenpoint

An open window into your running nodejs code.

This module creates a very convenient REPL session served
through the telnet protocol.

# Usage example

## Place a zenpoint in your code
```js
function mycode(var1, var2, var3) {
    require('zenpoint')({
        listen: 1976,
        inspectDepth: 0,
        persist: false,
        context: {
            var1,
            var2,
            var3,
        },
    });

    // ... do some unrelated work here
    return 42;
}

mycode('zenpoint', 'the debugging helper', 'for zen fellas');

```

## Telnet the Zenpoint server

```
$ telnet localhost 1976
Trying ::1...
Connected to localhost.
Escape character is '^]'.
🐀🧘🐁 Welcome to the Zenpoint 🥑🐦🦐
🐛🐞🐜🐝🦗➞ mycode (repl:2:17)
🐛🐞🐜🐝🦗➞ repl:1:1
🐛🐞🐜🐝🦗➞ ContextifyScript.Script.runInThisContext (vm.js:50:33)
🐛🐞🐜🐝🦗➞ REPLServer.defaultEval (repl.js:240:29)
🐛🐞🐜🐝🦗➞ bound (domain.js:301:14)
🐛🐞🐜🐝🦗➞ REPLServer.runBound [as eval] (domain.js:314:12)
🐛🐞🐜🐝🦗➞ REPLServer.onLine (repl.js:468:10)
🐛🐞🐜🐝🦗➞ emitOne (events.js:121:20)
┏━┫zenuser@zenhost:~/src/zenpoint#mycode@node-v8.11.2┃🙈🙉🙊┣━
┗>┫this
{ console: [Getter],
  global: [Circular],
  process: [Object],
  Buffer: [Object],
  clearImmediate: [Function],
  clearInterval: [Function],
  clearTimeout: [Function],
  setImmediate: [Object],
  setInterval: [Function],
  setTimeout: [Object],
  module: [Object],
  require: [Object],
  mycode: [Function: mycode],
  d: [Function],
  inspectOptions: [Object],
  log: [Function],
  cr: [Function: cr],
  stack: '🐛🐞🐜🐝🦗➞ mycode (repl:2:17)\r\n🐛🐞🐜🐝🦗➞ repl:1:1\r\n🐛🐞🐜🐝🦗➞ ContextifyScript.Script.runInThisContext (vm.js:50:33)\r\n🐛🐞🐜🐝🦗➞ REPLServer.defaultEval (repl.js:240:29)\r\n🐛🐞🐜🐝🦗➞ bound (domain.js:301:14)\r\n🐛🐞🐜🐝🦗➞ REPLServer.runBound [as eval] (domain.js:314:12)\r\n🐛🐞🐜🐝🦗➞ REPLServer.onLine (repl.js:468:10)\r\n🐛🐞🐜🐝🦗➞ emitOne (events.js:121:20)\r\n🐛🐞🐜🐝🦗➞ REPLServer.emit (events.js:211:7)',
  var1: 'zenpoint',
  var2: 'the debugging helper',
  var3: 'for zen fellas',
  frozen: [Object] }
┏━┫zenuser@zenhost:~/src/zenpoint#mycode@node-v8.11.2┃🙈🙉🙊┣━
┗>┫

```

## What's in the session

### console.log() -> log()

console.log cannot be used because its output goes right to the process' stdout.
Instead use the log() function
```js
log('this is this', this);
```

### inspect depth

The depth of the inspection usd by log() can be tuned with the d() function
```js
d(4);
```

### context, frozen and current

The state of the context is frozen at the initialization of the server and
can be accessed through the ```frozen``` object.

```js
log('frozen state', frozen);
log('current state', {var1, var2, var3});
```
