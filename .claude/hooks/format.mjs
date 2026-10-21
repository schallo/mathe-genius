// PostToolUse-Hook: formatiert jede von Claude bearbeitete Datei mit Prettier.
import { execFileSync } from 'node:child_process'

let input = ''
for await (const chunk of process.stdin) input += chunk
const file = JSON.parse(input).tool_input?.file_path

if (file && /\.(ts|tsx|css|json|md|html)$/.test(file)) {
  try {
    execFileSync('npx', ['prettier', '--write', '--ignore-unknown', file], {
      stdio: 'ignore',
      shell: true,
    })
  } catch {
    // Formatierungsfehler sollen Claude nicht blockieren
  }
}
