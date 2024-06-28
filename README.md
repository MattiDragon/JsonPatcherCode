# JsonPatcher Language Support

This extension provides basic editor support for the language used in the [JsonPatcher minecraft mod](https://modrinth.com/mod/jsonpatcher).

## Features

This extension provides basic syntax highlighting as well as some language server features.

- Syntax highlighting
  - Highlighting based on type of variable
- Error highlighting
- Unused variable detection
- Goto definition/references
  - Only for variables

## Requirements

In order for the language server to work you need to install java 21 or later. The extension will automatically find java using the `JAVA_HOME` environment variable, but you can also manually configure a java executable in settings.

## Extension Settings

This extension has the following settings:

- `jsonpatcher.trace.server`: Control the amount of logging from the language server
- `jsonpatcher.java.location`: An override for the java executable used for the language server
- `jsonpatcher.java.options`: Addition VM options to pass to the language server

## Known Issues and Limitations

Currently the language server only acts within one source file limiting it to resolving references within that file. I have plans to do basic resolution of cross file references using doc comments in the future.

The server also parses the full program key on each keystroke, which could result in bad performance for large files. Although in by simple testing it seems to be able to handle resonably large scripts in a few milliseconds.
