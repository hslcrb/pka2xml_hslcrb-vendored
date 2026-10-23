"""CLI contract checks. Run with PKA2XML_BINARY=/path/to/source-built/binary."""

import os
import base64
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

    def test_invalid_data_preserves_existing_output(self):
        for operation in ["-d", "-f"]:
            with self.subTest(operation=operation):
                result = self.run_cli(operation, self.input, self.output)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertIn(b"error:", result.stderr)
                self.assertEqual(self.output.read_bytes(), b"existing output")

    def test_invalid_data_does_not_create_output(self):
        self.output.unlink()
        result = self.run_cli("-d", self.input, self.output)
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertFalse(self.output.exists())

    def test_missing_input_preserves_existing_output(self):
        result = self.run_cli("-d", self.work / "missing", self.output)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(self.output.read_bytes(), b"existing output")

    def test_rejects_input_output_aliases(self):
        original = self.input.read_bytes()
        hardlink = self.work / "hard link.xml"
        symlink = self.work / "symbolic link.xml"
        hardlink.hardlink_to(self.input)
        symlink.symlink_to(self.input)
        for destination in [self.input, hardlink, symlink]:
            with self.subTest(destination=destination):
                result = self.run_cli("-e", self.input, destination)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertEqual(self.input.read_bytes(), original)

    def test_binary_round_trip_with_unicode_paths(self):
        original = b"\x00\x1a\r\n<PACKETTRACER>\xc3\xa9\xed\x95\x9c\xea\xb8\x80</PACKETTRACER>\r\n"
        self.input.write_bytes(original)
        encoded = self.run_cli("-e", self.input, self.output)
        self.assertEqual(encoded.returncode, 0, encoded.stderr)
        decoded_path = self.work / "복원 결과.xml"
        decoded = self.run_cli("-d", self.output, decoded_path)
        self.assertEqual(decoded.returncode, 0, decoded.stderr)
        self.assertEqual(decoded_path.read_bytes(), original)

    def test_real_packet_tracer_fixture_round_trip(self):
        decoded_path = self.work / "fixture.xml"
        result = self.run_cli("-d", ROOT / "B13_스7회.pka", decoded_path)
        self.assertEqual(result.returncode, 0, result.stderr)
        cleartext = decoded_path.read_bytes()
        self.assertEqual(cleartext, (ROOT / "B13_스7회.xml").read_bytes())
        result = self.run_cli("-e", decoded_path, self.output)
        self.assertEqual(result.returncode, 0, result.stderr)
        result = self.run_cli("-d", self.output, decoded_path)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(decoded_path.read_bytes(), cleartext)

    def test_output_errors_are_failures(self):
        for destination in [self.work / "missing" / "result", self.work]:
            for operation, arguments in [("-e", [self.input]), ("--forge", [])]:
                with self.subTest(operation=operation, destination=destination):
                    result = self.run_cli(operation, *arguments, destination)
                    self.assertEqual(result.returncode, 1, result.stderr)

    def test_legacy_nets_and_logs_synthetic_round_trip(self):
        result = self.run_cli("--forge", self.output)
        self.assertEqual(result.returncode, 0, result.stderr)
        expected = b"foobar~foobar~foobar~foobar~1700000000\n"
        result = self.run_cli("-nets", self.output)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, expected)
        self.input.write_bytes(base64.b64encode(self.output.read_bytes()) + b"\r\n")
        result = self.run_cli("-logs", self.input)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, expected)

    def test_invalid_nets_and_logs_report_errors(self):
        for operation in ["-nets", "-logs"]:
            with self.subTest(operation=operation):
                result = self.run_cli(operation, self.input)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertIn(b"error:", result.stderr)

    @unittest.skipUnless(os.name == "posix", "requires POSIX file-size limits")
    def test_interrupted_write_preserves_existing_output(self):
        import resource

        self.input.write_bytes(os.urandom(8192))

        def limit_output():
            resource.setrlimit(resource.RLIMIT_FSIZE, (1024, 1024))

        result = subprocess.run(
            [str(BINARY), "-e", str(self.input), str(self.output)],
            cwd=self.work, capture_output=True, timeout=20, preexec_fn=limit_output,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.output.read_bytes(), b"existing output")


if __name__ == "__main__":
    unittest.main()
