from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class GraphTests(unittest.TestCase):
    def run_graph(self, source, output):
        return subprocess.run([sys.executable, str(ROOT / "graph.py"), str(source),
                               "--no-render", "--dot", str(output)], cwd=output.parent, capture_output=True)

    def test_real_fixture_generates_six_devices_and_five_links(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "network.dot"
            result = self.run_graph(ROOT / "B13_스7회.xml", output)
            self.assertEqual(result.returncode, 0, result.stderr)
            text = output.read_text(encoding="utf-8")
            self.assertEqual(text.count(" [label="), 6)
            self.assertEqual(text.count(" -- "), 5)

    def test_unicode_unknown_devices_missing_ports_and_id_links(self):
        with tempfile.TemporaryDirectory(prefix="topology 한글 ") as directory:
            source, output = Path(directory) / "input.xml", Path(directory) / "output file.dot"
            source.write_text('''<PACKETTRACER5><NETWORK><DEVICES>
              <DEVICE><ENGINE><TYPE>NewDevice</TYPE><NAME>한글 "장비"</NAME><SAVE_REF_ID>alpha</SAVE_REF_ID>
              <MODULE><PORT><TYPE>NewPort</TYPE><IP>192.0.2.1</IP><SUBNET>255.255.255.0</SUBNET></PORT></MODULE></ENGINE></DEVICE>
              <DEVICE><ENGINE><TYPE>Pc</TYPE><NAME>한글 "장비"</NAME><SAVE_REF_ID>beta</SAVE_REF_ID></ENGINE></DEVICE>
              </DEVICES><LINKS><LINK><CABLE><FROM>alpha</FROM><TO>beta</TO><PORT>NewPort0</PORT><PORT>missing</PORT></CABLE></LINK></LINKS>
              </NETWORK></PACKETTRACER5>''', encoding="utf-8")
            result = self.run_graph(source, output)
            self.assertEqual(result.returncode, 0, result.stderr)
            text = output.read_text(encoding="utf-8")
            self.assertIn('한글 \\"장비\\"', text)
            self.assertIn('device_0" -- "device_1', text)
            self.assertIn("192.0.2.1/24", text)

    def test_missing_links_is_a_valid_graph(self):
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / "input.xml", Path(directory) / "out.dot"
            source.write_text("<PACKETTRACER5><NETWORK><DEVICES/></NETWORK></PACKETTRACER5>")
            result = self.run_graph(source, output)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("graph G", output.read_text())

    def test_malformed_xml_preserves_existing_dot(self):
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / "input.xml", Path(directory) / "out.dot"
            source.write_text("<broken")
            output.write_text("keep")
            result = self.run_graph(source, output)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(output.read_text(), "keep")

    def test_graphviz_failure_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            renderer = work / "dot"
            renderer.write_text("#!/bin/sh\nexit 9\n")
            renderer.chmod(0o755)
            result = subprocess.run([sys.executable, str(ROOT / "graph.py"), str(ROOT / "B13_스7회.xml")],
                                    cwd=work, env={**os.environ, "PATH": str(work)}, capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn(b"status 9", result.stderr)
            self.assertTrue((work / "network.dot").exists())


if __name__ == "__main__":
    unittest.main()
