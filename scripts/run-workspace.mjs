import { spawn } from 'node:child_process';

const [, , scriptName, workspace] = process.argv;

if (!scriptName || !workspace) {
  console.error('Usage: node scripts/run-workspace.mjs <script> <workspace>');
  process.exit(1);
}

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error('npm_execpath is not available in this process.');
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [npmExecPath, 'run', scriptName, '--workspace', workspace],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
