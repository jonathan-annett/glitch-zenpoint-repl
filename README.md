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
