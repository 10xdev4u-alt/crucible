# Editor setup

Crucible is a CLI + library, but it integrates with editors in a few ways.

## VS Code

The most common editor for Crucible. Three integration levels:

### Level 1: Run Crucible in the integrated terminal

The simplest. Open the terminal and run `crucible review`.

### Level 2: Tasks

Add a `.vscode/tasks.json` to run Crucible on save:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Crucible: review",
      "type": "shell",
      "command": "crucible review --diff working",
      "group": "build",
      "presentation": { "reveal": "always", "panel": "new" }
    }
  ]
}
```

Bind it to a key (`Cmd+Shift+B` by default) for quick access.

### Level 3: Problem matcher (inline diagnostics)

The Crucible CLI prints `file:line:col: message` for each finding. Add a `.vscode/settings.json` to surface them in the Problems panel:

```json
{
  "problemMatchers": [
    {
      "owner": "crucible",
      "fileLocation": ["relative", "${workspaceFolder}"],
      "pattern": {
        "regexp": "^(.+?):(\\d+):(\\d+):\\s+(warning|error|info):\\s+(.*)$",
        "severity": 1,
        "file": 1,
        "line": 2,
        "column": 3,
        "message": 5
      }
    }
  ]
}
```

(Requires updating the `TextFormatter` to emit `file:line:col: severity: message` lines. Patch is welcome!)

### Level 4: LSP server

A minimal LSP server scaffold lives in `@crucible/core/lsp`. It publishes diagnostics to the editor in real time. To use it, you need to:

1. Build the LSP server entry point (not shipped yet).
2. Register it with VS Code.
3. Configure it to call your agents.

This is on the roadmap.

## JetBrains (IntelliJ, WebStorm, etc.)

Run Crucible in the terminal and use the file watcher. Or add a File Watcher that runs on save:

- Settings → Tools → File Watchers → Add
- Name: Crucible
- File type: Any
- Program: `crucible`
- Arguments: `review --diff working --quiet`
- Working directory: `$ProjectFileDir$`

## Neovim

Run Crucible from the command line, then use `:cfile` or `:grep` to populate the quickfix list:

```vim
:!crucible review --format json --output /tmp/crucible.json
:cfile /tmp/crucible.json
```

Or use a plugin like `vim-test` with a custom runner.

For live diagnostics, use the LSP server (when implemented) with `:LspStart`.

## Sublime Text

Use Build Systems:

- Tools → Build System → New Build System
- Paste:

```json
{
  "shell_cmd": "crucible review --diff working",
  "working_dir": "$project_path"
}
```

Save as `Crucible.sublime-build`. Run with `Ctrl+B`.

## Git hooks (all editors)

The pre-commit hook (`crucible hook install`) runs before any commit, regardless of editor. See [Cookbook → Pre-commit hook with allow-list](/docs/cookbook/#recipe-pre-commit-hook-with-allow-list).

## See also

- [LSP scaffold](/docs/api/#lsp)
- [Pre-commit hook](/docs/cli/#crucible-hook)
- [Cookbook](/docs/cookbook/)
