/** A small banner shown at the top of the CLI's --version output. */

const EMBLEM = `   ___ __  __ ____ ____  __ _____ __  __ ___ __________ ____
  / __|  \\/  |_  /|  _ \\/  |_   _|  \\/  | __|__  / ____|
 | (__| |\\/| |/ / | |_) | |  | || |\\/| | _|  / /|  _|
  \\___|_|  |_/___|____/|_|  |_||_|  |_|___| /___|_|  (tm)`;

export const CLI_BANNER = `\x1b[38;2;193;68;14m${EMBLEM}\x1b[0m`;

export const CLI_BANNER_MINI = '\x1b[38;2;193;68;14m⚒ crucible\x1b[0m';

export const VERSION = '0.1.0';
