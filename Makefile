CXX ?= c++
CC ?= cc
CXXFLAGS ?= -O2 -DNDEBUG
CPPFLAGS ?=
LDFLAGS ?=
JOBS ?= 2
PREFIX ?= /usr/local
DESTDIR ?=

VENDOR_DIR ?= vendor
CRYPTOPP_DIR = $(VENDOR_DIR)/cryptopp
RE2_DIR = $(VENDOR_DIR)/re2
ZLIB_DIR = $(VENDOR_DIR)/zlib
VENDOR_INCLUDES = -I"$(VENDOR_DIR)" -I"$(RE2_DIR)" -I"$(ZLIB_DIR)"
VENDOR_LIBS = "$(RE2_DIR)/obj/libre2.a" "$(CRYPTOPP_DIR)/libcryptopp.a" "$(ZLIB_DIR)/libz.a" -pthread
SOURCES = main.cpp include/pka2xml.hpp

.PHONY: all check-vendor vendor-libs pka2xml-vendor pka2xml-dynamic pka2xml-static pka2xml-static-docker
all: pka2xml-vendor

check-vendor:
	@test -f "$(CRYPTOPP_DIR)/GNUmakefile" && test -f "$(RE2_DIR)/Makefile" && test -f "$(ZLIB_DIR)/configure" || { echo 'Missing native sources. Run: git submodule update --init --recursive' >&2; exit 1; }

vendor-libs: check-vendor
	$(MAKE) -C "$(CRYPTOPP_DIR)" -f GNUmakefile CXX="$(CXX)" CXXFLAGS="$(CXXFLAGS)" libcryptopp.a -j$(JOBS)
	$(MAKE) -C "$(RE2_DIR)" CXX="$(CXX)" CXXFLAGS="$(CXXFLAGS)" obj/libre2.a -j$(JOBS)
	cd "$(ZLIB_DIR)" && CC="$(CC)" ./configure --static
	$(MAKE) -C "$(ZLIB_DIR)" libz.a -j$(JOBS)

# Compile to a temporary name so a failed link preserves the previous binary.
pka2xml-vendor: $(SOURCES) vendor-libs
	$(CXX) -std=c++17 $(CPPFLAGS) $(CXXFLAGS) $(VENDOR_INCLUDES) main.cpp $(LDFLAGS) $(VENDOR_LIBS) -o pka2xml.building
	mv pka2xml.building pka2xml
	@./pka2xml --help >/dev/null
	@cksum main.cpp include/pka2xml.hpp Makefile setup.sh pka2xml > .setup_done

pka2xml-dynamic: $(SOURCES)
	$(CXX) -std=c++17 $(CPPFLAGS) $(CXXFLAGS) main.cpp $(LDFLAGS) -lcryptopp -lre2 -lz -pthread -o pka2xml.building
	mv pka2xml.building pka2xml
	@./pka2xml --help >/dev/null
	@cksum main.cpp include/pka2xml.hpp Makefile setup.sh pka2xml > .setup_done

pka2xml-static: $(SOURCES)
	$(CXX) -std=c++17 $(CPPFLAGS) $(CXXFLAGS) main.cpp $(LDFLAGS) -static -lcryptopp -lre2 -lz -pthread -o pka2xml.building
	mv pka2xml.building pka2xml
	@./pka2xml --help >/dev/null
	@cksum main.cpp include/pka2xml.hpp Makefile setup.sh pka2xml > .setup_done

pka2xml-static-docker: pka2xml-static

.PHONY: patch-static patch-dynamic install static-install static-install-docker dynamic-install vendor-install
patch-static:
	$(CC) $(CFLAGS) patch.c $(LDFLAGS) -static -o patch

patch-dynamic:
	$(CC) $(CFLAGS) patch.c $(LDFLAGS) -o patch

install:
	install -d "$(DESTDIR)$(PREFIX)/bin"
	install -m 755 pka2xml "$(DESTDIR)$(PREFIX)/bin/pka2xml"
	install -m 755 patch "$(DESTDIR)$(PREFIX)/bin/PacketTracer"

static-install: pka2xml-static patch-static
	$(MAKE) install

static-install-docker: static-install

dynamic-install: pka2xml-dynamic patch-dynamic
	$(MAKE) install

vendor-install: pka2xml-vendor patch-dynamic
	$(MAKE) install

.PHONY: test test-engine test-sanitize clean
test: pka2xml-vendor test-engine
	PKA2XML_BINARY="$(CURDIR)/pka2xml" PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py' -v

test-engine: vendor-libs
	mkdir -p .build/tests
	$(CXX) -std=c++17 $(CPPFLAGS) $(CXXFLAGS) -I. $(VENDOR_INCLUDES) tests/native_engine.cpp $(LDFLAGS) $(VENDOR_LIBS) -o .build/tests/native_engine
	.build/tests/native_engine

test-sanitize: vendor-libs
	mkdir -p .build/tests
	$(CXX) -std=c++17 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all -I. $(VENDOR_INCLUDES) tests/native_engine.cpp $(VENDOR_LIBS) -o .build/tests/native_engine_sanitized
	.build/tests/native_engine_sanitized

clean:
	rm -f patch pka2xml pka2xml.building .setup_done
	rm -rf .build/tests
