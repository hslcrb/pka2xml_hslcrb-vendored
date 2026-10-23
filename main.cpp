#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

#include "include/pka2xml.hpp"

void die(const char *message) {
  std::fprintf(stderr, "%s", message);
  std::exit(1);
}

void help(std::FILE *stream)
{
  std::fprintf(stream, R"(usage: pka2xml <operation> <input> [output]

where options are:
  -d <in> <out>   decrypt pka/pkt to xml
  -e <in> <out>   encrypt xml to pka/pkt

  -f <in> <out>   patch the Packet Tracer version tag (compatibility varies)

  -nets <in>      decrypt packet tracer "nets" file
  -logs <in>      decrypt packet tracer log file

  --forge <out>   forge authentication file to bypass login
  --help, -h      show this help

examples:
  pka2xml -d foobar.pka foobar.xml
  pka2xml -e foobar.xml foobar.pka
  pka2xml -nets $HOME/packettracer/nets
  pka2xml -logs $HOME/packettracer/pt_12.05.2020_21.07.17.338.log
)");
}

int main(int argc, char *argv[]) {
#ifdef HAS_UI
  if (argc > 1 && std::string(argv[1]) == "gui") {
    QApplication app(argc, argv);
    Gui gui{};
    gui.show();
    return app.exec();
  }
#endif

  const std::string operation = argc > 1 ? argv[1] : "";
  if (argc == 2 && (operation == "--help" || operation == "-h")) {
    help(stdout);
    return 0;
  }
  const int expected_argc =
      operation == "-d" || operation == "-e" || operation == "-f" ? 4 :
      operation == "-logs" || operation == "-nets" || operation == "--forge" ? 3 : 0;
  if (expected_argc == 0 || argc != expected_argc) {
    std::fprintf(stderr, "error: specify one operation with exactly the required paths\n");
    help(stderr);
    return 2;
  }

  try {
    if (operation == "-d") {
      std::ifstream f_in{argv[2]};
      if (!f_in.is_open()) {
        die("error opening input file");
      }
      std::string input{std::istreambuf_iterator<char>(f_in), std::istreambuf_iterator<char>()};
      f_in.close();
      std::ofstream f_out{argv[3]};
      if (!f_out.is_open()) {
        die("error opening output file");
      }
      f_out << pka2xml::decrypt_pka(input);
      f_out.close();
    } else if (operation == "-e") {
      std::ifstream f_in{argv[2]};
      if (!f_in.is_open()) {
        die("error opening input file");
      }
      std::string input{std::istreambuf_iterator<char>(f_in), std::istreambuf_iterator<char>()};
      f_in.close();
      std::ofstream f_out{argv[3]};
      if (!f_out.is_open()) {
        die("error opening output file");
      }
      f_out << pka2xml::encrypt_pka(input);
      f_out.close();
    } else if (operation == "-logs") {
      std::ifstream f_in{argv[2]};
      if (!f_in.is_open()) {
        die("error opening input file");
      }
      std::string line;
      while (std::getline(f_in, line)) {
        std::cout << pka2xml::decrypt_logs(line) << std::endl;
      }
      f_in.close();
    } else if (operation == "-nets") {
      std::ifstream f_in{argv[2]};
      if (!f_in.is_open()) {
        die("error opening input file");
      }
      std::string input{std::istreambuf_iterator<char>(f_in), std::istreambuf_iterator<char>()};
      std::cout << pka2xml::decrypt_nets(input) << std::endl;
      f_in.close();
    } else if (operation == "--forge") {
      std::ofstream f_out{argv[2]};
      f_out << pka2xml::encrypt_nets("foobar~foobar~foobar~foobar~1700000000");
      f_out.close();
    } else if (operation == "-f") {
      std::ifstream f_in{argv[2]};
      if (!f_in.is_open()) {
        die("error opening input file");
      }
      std::string input{std::istreambuf_iterator<char>(f_in), std::istreambuf_iterator<char>()};
      f_in.close();
      std::ofstream f_out{argv[3]};
      f_out << pka2xml::fix(input);
      f_out.close();
    }
  } catch (int err) {
    die("error during the processing of the files, make sure the input files are valid");
  }
}
