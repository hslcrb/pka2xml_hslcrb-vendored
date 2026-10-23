"""Export a Packet Tracer XML network to DOT, optionally rendering a PNG."""

import argparse
from collections import Counter
from ipaddress import IPv4Network
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET


def value(node, path):
    return (node.findtext(path) or "").strip()


def quote(text):
    return json.dumps(str(text), ensure_ascii=False)


def ports_for(device):
    names = []
    for line in device.findall("ENGINE/RUNNINGCONFIG/LINE"):
        parts = (line.text or "").strip().split()
        if len(parts) > 1 and parts[0] == "interface":
            names.append(parts[1])
    host = value(device, "ENGINE/TYPE") in {"Pc", "Pda", "Cloud", "Laptop", "Printer", "Server"}
    formats = {
        "eCopperEthernet": "Ethernet{}",
        "eCopperFastEthernet": "FastEthernet{}" if host else "FastEthernet0/{}",
        "eCopperGigabitEthernet": "GigabitEthernet{}" if host else "GigabitEthernet0/{}",
    }
    counts, ports = Counter(), {}
    for index, port in enumerate(device.findall("ENGINE/MODULE//PORT")):
        kind = value(port, "TYPE")
        number = counts[kind]
        counts[kind] += 1
        fallback = formats.get(kind, (kind or "Port") + "{}").format(number)
        name = value(port, "NAME") or (names[index] if index < len(names) else fallback)
        address = "DHCP" if value(port, "PORT_DHCP_ENABLE") == "true" else value(port, "IP")
        mask = value(port, "SUBNET")
        if mask:
            try:
                mask = str(IPv4Network("0.0.0.0/" + mask).prefixlen)
            except ValueError:
                pass
        label = address + ("/" + mask if address and mask and address != "DHCP" else "")
        ports[name] = label
        # Host links commonly omit the zero in names such as FastEthernet0.
        if number == 0 and name.endswith("0") and "/" not in name:
            ports.setdefault(name[:-1], label)
    return ports


def build_dot(root):
    network = root if root.tag == "NETWORK" else root.find("NETWORK")
    if network is None:
        network = root.find("PACKETTRACER5/NETWORK")
    if network is None:
        raise ValueError("XML has no supported Packet Tracer NETWORK element")
    devices = network.findall("DEVICES/DEVICE")
    by_id = {}
    for index, device in enumerate(devices):
        identifier = value(device, "ENGINE/SAVE_REF_ID") or value(device, "SAVE_REF_ID")
        if identifier:
            by_id[identifier] = index

    def resolve(reference):
        if reference in by_id:
            return by_id[reference]
        try:
            index = int(reference)
            return index if 0 <= index < len(devices) else None
        except ValueError:
            return None

    lines = ['graph G {', '  node [shape=box, style=rounded];', '  graph [pad="1", ranksep="1.5"];']
    device_ports = [ports_for(device) for device in devices]
    for index, device in enumerate(devices):
        name = value(device, "ENGINE/NAME") or f"Device {index + 1}"
        lines.append(f'  "device_{index}" [label={quote(name)}];')
    for link in network.findall("LINKS/LINK"):
        source, target = resolve(value(link, "CABLE/FROM")), resolve(value(link, "CABLE/TO"))
        if source is None or target is None:
            print("warning: skipped a link with an unknown device reference", file=sys.stderr)
            continue
        port_names = [(port.text or "").strip() for port in link.findall("CABLE/PORT")]
        port_names += [""] * (2 - len(port_names))
        source_label = device_ports[source].get(port_names[0], "")
        target_label = device_ports[target].get(port_names[1], "")
        lines.append(f'  "device_{source}" -- "device_{target}" [taillabel={quote(source_label)}, headlabel={quote(target_label)}];')
    return "\n".join([*lines, "}", ""])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="decrypted Packet Tracer XML")
    parser.add_argument("--dot", type=Path, default=Path("network.dot"), help="DOT output path")
    parser.add_argument("--png", type=Path, default=Path("network.png"), help="PNG output path")
    parser.add_argument("--no-render", action="store_true", help="write DOT only; no Graphviz installation required")
    args = parser.parse_args(argv)
    try:
        paths = [args.input.resolve(), args.dot.resolve()]
        if not args.no_render:
            paths.append(args.png.resolve())
        if len(set(paths)) != len(paths):
            raise ValueError("input and output paths must be different")
        text = build_dot(ET.parse(args.input).getroot())
        args.dot.write_text(text, encoding="utf-8")
        if not args.no_render:
            try:
                subprocess.run(["dot", "-Tpng", str(args.dot), "-o", str(args.png)], check=True)
            except FileNotFoundError:
                raise ValueError(f"Graphviz 'dot' is not installed; DOT saved to {args.dot}. Use --no-render for DOT only") from None
            except subprocess.CalledProcessError as error:
                raise ValueError(f"Graphviz failed with status {error.returncode}; DOT saved to {args.dot}") from error
        return 0
    except (OSError, ValueError, ET.ParseError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
