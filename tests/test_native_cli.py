"""CLI contract checks. Run with PKA2XML_BINARY=/path/to/source-built/binary."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
BINARY = Path(os.environ.get("PKA2XML_BINARY", ROOT / "pka2xml")).resolve()


class NativeCliTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="pka2xml test 한글 ")
        self.work = Path(self.directory.name)
        self.input = self.work / "input data.xml"
        self.input.write_bytes(b"<PACKETTRACER><VERSION>8.2.2.0400</VERSION></PACKETTRACER>")
        self.output = self.work / "output data.pka"
        self.output.write_bytes(b"existing output")

    def tearDown(self):
        self.directory.cleanup()

    def run_cli(self, *args):
        return subprocess.run(
            [str(BINARY), *(str(arg) for arg in args)],
            cwd=self.work, capture_output=True, timeout=20,
        )

    def test_explicit_help_succeeds(self):
        result = self.run_cli("--help")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(b"usage:", result.stdout.lower())

    def test_missing_arguments_are_usage_errors(self):
        for args in [(), ("-d",), ("-e", self.input), ("-nets",), ("--forge",)]:
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 2)
                self.assertIn(b"usage:", result.stderr.lower())

    def test_rejects_unknown_operation(self):
        result = self.run_cli("--unknown", self.input, self.output)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(self.output.read_bytes(), b"existing output")

    def test_rejects_extra_arguments(self):
        for flag, args in [
            ("-e", (self.input, self.output)),
            ("-d", (self.input, self.output)),
            ("-f", (self.input, self.output)),
            ("-nets", (self.input,)),
            ("-logs", (self.input,)),
            ("--forge", (self.output,)),
            ("--help", ()),
        ]:
            with self.subTest(flag=flag):
                result = self.run_cli(flag, *args, "extra")
                self.assertEqual(result.returncode, 2)
                self.assertEqual(self.output.read_bytes(), b"existing output")

    def test_operation_must_be_first_argument(self):
        result = self.run_cli("unknown", self.input, self.output, "-e")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(self.output.read_bytes(), b"existing output")


if __name__ == "__main__":
    unittest.main()
