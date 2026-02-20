const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPE_MAP[char]);
}

export function generateLaunchdPlist(options: {
  label: string;
  nodePath: string;
  runnerPath: string;
  workingDirectory: string;
  stdoutPath: string;
  stderrPath: string;
}): string {
  const { label, nodePath, runnerPath, workingDirectory, stdoutPath, stderrPath } = options;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${escapeXml(label)}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(nodePath)}</string>
    <string>${escapeXml(runnerPath)}</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>WorkingDirectory</key>
  <string>${escapeXml(workingDirectory)}</string>

  <key>StandardOutPath</key>
  <string>${escapeXml(stdoutPath)}</string>

  <key>StandardErrorPath</key>
  <string>${escapeXml(stderrPath)}</string>
</dict>
</plist>
`;
}
