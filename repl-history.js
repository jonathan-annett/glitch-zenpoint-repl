/*

https://github.com/thebopshoobop/repl-history

ISC License

Copyright (c) 2017, Will Timpson

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

*/
const fs = require("fs");
const path = require("path");

const parseOptions = ({ filePath, useHome, maxSave }) => {
  if (filePath && useHome) {
    console.warn(
      "Warning: both filePath and useHome specified, using home directory"
    );
  }

  filePath = filePath || path.join(__dirname, ".repl_history");
  if (useHome) {
    const homeDir =
      process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    filePath = path.join(homeDir, ".node_repl_history");
  }
  maxSave = !isNaN(maxSave) && maxSave >= 0 ? maxSave : 200;

  return { filePath, maxSave };
};

module.exports = (repl, options = {}) => {
  const config = parseOptions(options);

  try {
    repl.history = fs
      .readFileSync(config.filePath, { encoding: "utf8" })
      .split("\n")
      .filter(line => line.trim());
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn("No history file found");
    } else {
      throw error;
    }
  }

  repl.on("exit", () => {
    const lines = config.maxSave
      ? repl.history.slice(1, config.maxSave + 1)
      : repl.history.slice(1);
    fs.writeFileSync(config.filePath, lines.join("\n"));
    process.exit();
  });
};
