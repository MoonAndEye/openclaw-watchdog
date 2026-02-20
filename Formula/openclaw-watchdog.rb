class OpenclawWatchdog < Formula
  desc "macOS launchd watchdog for OpenClaw Gateway"
  homepage "https://github.com/openclaw/openclaw-watchdog"
  url "https://registry.npmjs.org/openclaw-watchdog/-/openclaw-watchdog-1.0.0.tgz"
  sha256 "REPLACE_WITH_NPM_TARBALL_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
  end

  test do
    output = shell_output("#{bin}/openclaw-watchdog --help")
    assert_match "openclaw-watchdog", output
  end
end
