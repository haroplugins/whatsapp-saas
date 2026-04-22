import { spawn } from 'node:child_process';

const [, , scriptName, ...workspaces] = process.argv;

if (!scriptName || workspaces.length === 0) {
  console.error(
    'Usage: node scripts/run-workspaces.mjs <script> <workspace...>',
  );
  process.exit(1);
}

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error('npm_execpath is not available in this process.');
  process.exit(1);
}

const runWorkspace = (workspace) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [npmExecPath, 'run', scriptName, '--workspace', workspace],
      {
        stdio: 'inherit',
        env: process.env,
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`Workspace ${workspace} exited with code ${code ?? 1}.`),
      );
    });
  });

for (const workspace of workspaces) {
  try {
    await runWorkspace(workspace);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
