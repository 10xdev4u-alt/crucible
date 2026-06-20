---
title: Editor setup
description: Integrate Crucible with VS Code, JetBrains, Neovim, and Sublime
order: 20
category: Documentation
---

# Editor setup

How to integrate Crucible with popular editors.

## VS Code

Three integration levels:

### Level 1: Run in the integrated terminal

The simplest. Open the terminal and run `crucible review`.

### Level 2: Tasks on save

Add a `.vscode/tasks.json`:

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

### Level 3: Problem matcher (inline diagnostics)

Surface Crucible findings in the Problems panel via a problem matcher. See the [GitHub gist](https://gist.github.com/) for the regex (one isn't shipped yet — PRs welcome!).

### Level 4: LSP server

A minimal LSP server scaffold lives in `@crucible/core/lsp`. See [API → LSP](/docs/api/#lsp).

## JetBrains

Add a File Watcher (Settings → Tools → File Watchers → Add):

- Name: Crucible
- File type: Any
- Program: `crucible`
- Arguments: `review --diff working --quiet`
- Working directory: `$ProjectFileDir$`

## Neovim

```vim
:!crucible review --format json --output /tmp/crucible.json
:cfile /tmp/crucible.json
```

For live diagnostics, use the LSP server with `:LspStart`.

## Sublime Text

Tools → Build System → New Build System:

```json
{
  "shell_cmd": "crucible review --diff working",
  "working_dir": "$project_path"
}
```

Save as `Crucible.sublime-build`. Run with `Ctrl+B`.

## See also

- [Pre-commit hook](/docs/cli/#crucible-hook)
- [Cookbook](/docs/cookbook/)
- [Troubleshooting](/docs/troubleshooting/)
