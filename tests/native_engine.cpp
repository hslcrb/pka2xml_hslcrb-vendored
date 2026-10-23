#include <array>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

#include "include/pka2xml.hpp"

namespace {

void require(bool condition, const std::string &message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

void rejects(const std::function<void()> &operation) {
  try {
    operation();
  } catch (const std::runtime_error &) {
    return;
  } catch (const std::logic_error &) {
    return;
  } catch (const CryptoPP::Exception &) {
    return;
  }
  throw std::runtime_error("malformed data was accepted");
}

std::string compress(const std::string &clear) {
  return pka2xml::compress(reinterpret_cast<const unsigned char *>(clear.data()), clear.size());
}

std::string uncompress(const std::string &compressed) {
  return pka2xml::uncompress(reinterpret_cast<const unsigned char *>(compressed.data()), compressed.size());
}

std::string legacy(const std::string &clear) {
  std::string result = compress(clear);
  for (std::size_t i = 0; i < result.size(); ++i) {
    result[i] ^= static_cast<unsigned char>(result.size() - i);
  }
  return result;
}

}  // namespace

int main(int argc, char **argv) {
  const std::vector<std::pair<std::string, std::function<void()>>> tests{
    {"length_mismatch", [] {
      auto data = compress("hello");
      data[3] = 6;
      rejects([&] { uncompress(data); });
    }},
    {"trailing_compressed_bytes", [] {
      rejects([] { uncompress(compress("hello") + "trailing"); });
    }},
    {"short_headers", [] {
      for (std::size_t length = 0; length < 4; ++length) {
        const std::string data(length, '\0');
        rejects([&] { uncompress(data); });
      }
      rejects([] { pka2xml::uncompress(nullptr, 0); });
    }},
    {"oversized_header", [] {
      rejects([] { uncompress(std::string("\xff\xff\xff\xff", 4)); });
    }},
    {"invalid_compressed_stream", [] {
      rejects([] { uncompress(std::string("\0\0\0\1garbage", 11)); });
    }},
    {"legacy_header_requires_both_bytes", [] {
      std::string data(8, '\0');
      data[4] = static_cast<char>(0x78 ^ 4);
      require(!pka2xml::is_old_pt(data), "legacy detection accepted one matching header byte");
      for (std::size_t length = 0; length < 6; ++length) {
        require(!pka2xml::is_old_pt(std::string(length, '\0')), "short data detected as legacy");
      }
    }},
    {"authenticated_round_trips", [] {
      const std::vector<std::string> inputs{"", "hello", std::string("\0\x1a\r\n", 4), std::string(100000, 'x')};
      for (const auto &input : inputs) {
        require(pka2xml::decrypt_pka(pka2xml::encrypt_pka(input)) == input, "packet round trip failed");
        require(pka2xml::decrypt_nets(pka2xml::encrypt_nets(input)) == input, "nets round trip failed");
        require(uncompress(compress(input)) == input, "compression round trip failed");
      }
    }},
    {"truncated_ciphertext", [] {
      auto encrypted = pka2xml::encrypt_pka("hello");
      for (std::size_t length = 0; length < encrypted.size(); ++length) {
        rejects([&] { pka2xml::decrypt_pka(encrypted.substr(0, length)); });
      }
      encrypted[0] ^= 1;
      rejects([&] { pka2xml::decrypt_pka(encrypted); });
    }},
    {"base64_rejects_invalid_characters", [] {
      std::string encoded;
      CryptoPP::StringSource(pka2xml::encrypt_nets("hello"), true,
          new CryptoPP::Base64Encoder(new CryptoPP::StringSink(encoded), false));
      require(pka2xml::decrypt_logs(encoded) == "hello", "valid log failed");
      rejects([&] { pka2xml::decrypt_logs("!" + encoded); });
      rejects([&] { pka2xml::decrypt_logs("=" + encoded); });
    }},
    {"legacy_version_patch", [] {
      const std::string original = "<PACKETTRACER><VERSION>12.1.2.12345</VERSION></PACKETTRACER>";
      const auto encoded = legacy(original);
      require(pka2xml::is_old_pt(encoded), "valid legacy header was rejected");
      require(pka2xml::decrypt_old(encoded) == original, "legacy round trip failed");
      require(pka2xml::decrypt_pka(pka2xml::fix(encoded)) ==
          "<PACKETTRACER><VERSION>6.0.1.0000</VERSION></PACKETTRACER>", "version tag not patched");
    }},
  };

  int failures = 0;
  for (const auto &[name, test] : tests) {
    if (argc == 2 && name != argv[1]) {
      continue;
    }
    try {
      test();
      std::cout << "PASS " << name << '\n';
    } catch (const std::exception &error) {
      ++failures;
      std::cerr << "FAIL " << name << ": " << error.what() << '\n';
    } catch (...) {
      ++failures;
      std::cerr << "FAIL " << name << ": non-standard exception\n";
    }
  }
  return failures == 0 ? 0 : 1;
}
