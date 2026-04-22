import { spawn } from 'node:child_process';

const [, , scriptName, ...workspaces] = process.argv;

if (!scriptName || workspaces.length === 0) {
  console.error('Usage: node scripts/run-parallel.mjs <script> <workspace...>');
  process.exit(1);
}

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error('npm_execpath is not available in this process.');
  process.exit(1);
}

const children = workspaces.map((workspace) =>
  spawn(
    process.execPath,
    [npmExecPath, 'run', scriptName, '--workspace', workspace],
    {
      stdio: 'inherit',
      env: process.env,
    },
  ),
);

let hasExited = false;

const stopChildren = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on('SIGINT', () => {
  stopChildren();
  process.exit(130);
});

process.on('SIGTERM', () => {
  stopChildren();
  process.exit(143);
});

for (const child of children) {
  child.on('exit', (code) => {
    if (hasExited) {
      return;
    }

    if (code && code !== 0) {
      hasExited = true;
      stopChildren();
      process.exit(code);
    }
  });
}

await new Promise(() => {});
