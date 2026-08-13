#!/usr/bin/env node
import { execSync } from "node:child_process";

const ports = [3000, 4000];

for (const port of ports) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
      const pids = new Set(
        out
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid)),
      );
      for (const pid of pids) {
        console.log(`Stopping process ${pid} on port ${port}`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      }
    } else {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: "ignore", shell: true });
    }
  } catch {
    // Port already free
  }
}

console.log("Ports 3000 and 4000 are ready.");
