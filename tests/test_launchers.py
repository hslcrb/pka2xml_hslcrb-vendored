import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BINARY = Path(os.environ.get("PKA2XML_BINARY", ROOT / "pka2xml")).resolve()


class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="pka launch 한글 ")
        self.work = Path(self.temporary.name)
        self.project = self.work / "project dir"
        (self.project / "include").mkdir(parents=True)
        self.sources = ["main.cpp", "include/pka2xml.hpp", "Makefile", "setup.sh", "pka2xml"]
        for name in self.sources + ["run_cli.sh", "run_gui.sh"]:
            shutil.copy2(BINARY if name == "pka2xml" else ROOT / name, self.project / name)
        state = subprocess.check_output(["cksum", *self.sources], cwd=self.project)
        (self.project / ".setup_done").write_bytes(state)

    def tearDown(self):
        self.temporary.cleanup()

    def test_cli_keeps_callers_relative_paths(self):
        (self.work / "input.xml").write_bytes("<hello>한글</hello>".encode("utf-8"))
        result = subprocess.run([str(self.project / "run_cli.sh"), "-e", "input.xml", "output.pka"],
                                cwd=self.work, capture_output=True, stdin=subprocess.DEVNULL)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.work / "output.pka").exists())
        self.assertFalse((self.project / "output.pka").exists())

    def test_cli_rejects_stale_build(self):
        (self.project / "main.cpp").write_text("changed source")
        result = subprocess.run([str(self.project / "run_cli.sh"), "--help"], cwd=self.project,
                                capture_output=True, stdin=subprocess.DEVNULL)
        self.assertEqual(result.returncode, 1)
        self.assertIn(b"Rebuild", result.stderr)

    def test_setup_failure_does_not_leave_success_marker(self):
        (self.project / "pka2xml").unlink()
        fake_tools = self.work / "tools"
        fake_tools.mkdir()
        fake_make = fake_tools / "make"
        fake_make.write_text("#!/bin/sh\nexit 7\n")
        fake_make.chmod(0o755)
        result = subprocess.run([str(self.project / "setup.sh")], cwd=self.project,
                                env={**os.environ, "PATH": f"{fake_tools}:/usr/bin:/bin"},
                                capture_output=True, stdin=subprocess.DEVNULL)
        self.assertEqual(result.returncode, 7)
        self.assertFalse((self.project / ".setup_done").exists())


if __name__ == "__main__":
    unittest.main()
