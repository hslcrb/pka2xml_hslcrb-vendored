#include <array>
#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <sys/stat.h>
#include <unistd.h>

#include "include/pka2xml.hpp"

namespace {

std::string read_file(const std::string &path) {
  std::ifstream input(path, std::ios::binary);
  if (!input) {
    throw std::runtime_error("cannot open input file: " + path);
  }
  std::array<char, 65536> buffer{};
  std::string contents;
  while (input) {
    input.read(buffer.data(), buffer.size());
    const auto count = static_cast<std::size_t>(input.gcount());
    if (contents.size() > pka2xml::max_encoded_bytes - count) {
      throw std::runtime_error("input exceeds the 129 MiB limit");
    }
    contents.append(buffer.data(), count);
  }
  if (!input.eof() || input.bad()) {
    throw std::runtime_error("cannot read input file: " + path);
  }
  return contents;
}

void require_distinct_files(const char *input, const char *output) {
  struct stat source{}, destination{};
  if (::stat(input, &source) == 0 && ::stat(output, &destination) == 0 &&
      source.st_dev == destination.st_dev && source.st_ino == destination.st_ino) {
    throw std::runtime_error("input and output must be different files");
  }
}

void write_file(const std::string &path, const std::string &contents) {
  struct stat destination{};
  if (::lstat(path.c_str(), &destination) == 0) {
    if (!S_ISREG(destination.st_mode)) {
      throw std::runtime_error("output must be a regular file: " + path);
    }
  } else if (errno != ENOENT) {
    throw std::runtime_error("cannot inspect output file: " + path);
  }

  // Create beside the destination so rename is atomic on the same filesystem.
  std::string temporary = path + ".pka2xml-XXXXXX";
  const int descriptor = ::mkstemp(temporary.data());
  if (descriptor < 0) {
    throw std::runtime_error("cannot create output file: " + path + ": " + std::strerror(errno));
  }
  std::FILE *output = ::fdopen(descriptor, "wb");
  if (!output) {
    ::close(descriptor);
    std::remove(temporary.c_str());
    throw std::runtime_error("cannot open temporary output file: " + path);
  }
  try {
    if (std::fwrite(contents.data(), 1, contents.size(), output) != contents.size()) {
      throw std::runtime_error("cannot write output file: " + path);
    }
    const int close_result = std::fclose(output);
    output = nullptr;
    if (close_result != 0) {
      throw std::runtime_error("cannot finish output file: " + path);
    }
    if (std::rename(temporary.c_str(), path.c_str()) != 0) {
      throw std::runtime_error("cannot replace output file: " + path + ": " + std::strerror(errno));
    }
  } catch (...) {
    if (output) {
      std::fclose(output);
    }
    std::remove(temporary.c_str());
    throw;
  }
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

}  // namespace

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
    std::cout.exceptions(std::ios::badbit | std::ios::failbit);
    if (operation == "-d" || operation == "-e" || operation == "-f") {
      require_distinct_files(argv[2], argv[3]);
      const std::string input = read_file(argv[2]);
      const std::string output = operation == "-d" ? pka2xml::decrypt_pka(input) :
          operation == "-e" ? pka2xml::encrypt_pka(input) : pka2xml::fix(input);
      write_file(argv[3], output);
    } else if (operation == "-logs") {
      std::istringstream input(read_file(argv[2]));
      std::string line;
      std::size_t line_number = 0;
      while (std::getline(input, line)) {
        ++line_number;
        try {
          std::cout << pka2xml::decrypt_logs(line) << '\n';
        } catch (const std::exception &error) {
          throw std::runtime_error("log line " + std::to_string(line_number) + ": " + error.what());
        }
      }
    } else if (operation == "-nets") {
      std::cout << pka2xml::decrypt_nets(read_file(argv[2])) << '\n';
    } else if (operation == "--forge") {
      write_file(argv[2], pka2xml::encrypt_nets("foobar~foobar~foobar~foobar~1700000000"));
    }
    std::cout.flush();
    return 0;
  } catch (const std::exception &error) {
    std::fprintf(stderr, "error: %s\n", error.what());
  } catch (int error) {
    std::fprintf(stderr, "error: invalid compressed input (zlib status %d)\n", error);
  }
  return 1;
}
