# JTAGForge Pro (v1.0.0)

### IEEE 1149.1 & 1149.6 Silicon Boundary-Scan Studio, 16-State TAP Simulator, 32-Bit IDCODE Dissector, BSDL & SVF Engine, OpenOCD Synthesizer & Hardware Cybersecurity Auditor

[![Standard: IEEE 1149.1-2013](https://img.shields.io/badge/Standard-IEEE%201149.1--2013-10b981.svg)](#) [![Standard: IEEE 1149.6-2015](https://img.shields.io/badge/Standard-IEEE%201149.6--2015-06b6d4.svg)](#) [![Tests: 10/10 Passing](https://img.shields.io/badge/Tests-10%2F10%20Passing-emerald.svg)](#) [![Zero Runtime Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue.svg)](#) [![License: Commercial / Open Core](https://img.shields.io/badge/License-Open%20Core-violet.svg)](#)

---

## ⚡ Overview

**JTAGForge Pro** is an autonomous, vendor-neutral hardware engineering platform and silicon security auditor designed for embedded systems architects, FPGA designers, semiconductor test engineers, and hardware security researchers.

Boundary-scan test toolchains traditionally lock engineers into costly proprietary hardware pods (\$10,000–\$35,000 per seat). JTAGForge Pro breaks this barrier by providing a zero-dependency web engineering studio alongside a powerful Python 3 CLI for headless ATE continuous integration.

---

## 🛠️ Key Features

1. **16-State IEEE 1149.1 TAP Controller Simulator**:  
   * Interactive finite state machine clocking with manual TMS=0 / TMS=1 stepping.  
   * Breadth-First Search (BFS) shortest-path navigation finding optimal TMS clock sequences.  
   * Dual-branch Data Register (DR) and Instruction Register (IR) shift simulation.  
2. **32-Bit IDCODE Dissector & Synthesizer**:  
   * Full bitfield breakdown: Silicon Stepping (31..28), Part Number (27..12), Manufacturer (11..1), and Mandatory Bit 0\.  
   * Integrated JEDEC JEP106 manufacturer database (ST, Xilinx, Intel, ARM, TI, NXP, Microchip, etc.).  
   * Strict enforcement of the IEEE 1149.1 Bit 0 rule (must equal 1).  
3. **BSDL (Boundary-Scan Description Language) Engine**:  
   * VHDL syntax parser extracting entity pin mappings, instruction register length, standard opcodes, and boundary register cell counts.  
   * Clean BSDL template generator for new ASIC/FPGA designs.  
4. **10-Point Silicon Hardware Security Auditor**:  
   * Automated risk scoring of JTAG debug interfaces against firmware extraction, unauthenticated memory readout via AHB-AP/AXI-AP, and physical glitch attacks.  
   * Actionable remediation guidance aligned with ISO/SAE 21434 hardware cybersecurity standards.  
5. **OpenOCD & SVF Synthesizer**:  
   * Direct export of OpenOCD debugger configuration files.  
   * Automated synthesis of Serial Vector Format (SVF) test vectors for Automated Test Equipment (ATE).

---

## 🚀 Quick Start

### Web Studio

Open `source-code/index.html` in any modern web browser to access the complete interactive test bench.

### Standalone CLI

\# Dissect a 32-bit IDCODE

python3 build/jtag-cli.py dissect 0x04991043

\# Find shortest TMS sequence

python3 build/jtag-cli.py navigate \--start TEST\_LOGIC\_RESET \--target SHIFT\_DR

\# Run silicon security audit

python3 build/jtag-cli.py audit \--device "Automotive Gateway" \--lock UNLOCKED

\# Synthesize OpenOCD configuration

python3 build/jtag-cli.py openocd \--chip stm32f4x \--idcode 0x04991043

\# Synthesize SVF test vectors

python3 build/jtag-cli.py svf \--ir 0E \--idcode 0x04991043

---

## 📂 Project Structure

product\_176/

├── README.md                                  \# Repository overview

├── source-code/

│   ├── index.html                             \# 5-tab responsive silicon test studio

│   ├── jtag-forge.css                         \# Emerald & logic-cyan glassmorphism styling

│   ├── app.js                                 \# Web application controller

│   ├── jtag-tap-engine.js                     \# 16-state TAP FSM & BFS navigator

│   ├── jtag-codec-engine.js                   \# 32-bit IDCODE dissector & builder

│   ├── jtag-bsdl-engine.js                    \# BSDL VHDL parser & validator

│   └── jtag-security-auditor.js               \# 10-point hardware security scoring engine

├── build/

│   ├── jtag-cli.py                            \# Standalone Python 3 CLI tool (executable)

│   └── jtagforge-pro-v1.0.0.zip               \# Production packaged distribution archive

├── documentation/

│   ├── ARCHITECTURE.md                        \# Technical systems engineering specification

│   ├── USER\_GUIDE.md                          \# Comprehensive user & CLI manual

│   ├── MONETIZATION\_AND\_MARKETING\_PLAYBOOK.md \# Pricing tiers & commercialization strategy

│   └── PROGRESS\_REPORT.md                     \# Cycle completion summary

└── screenshots/

    ├── jtag-studio-preview.svg                \# High-resolution UI mockup

    └── jtag-architecture-diagram.svg          \# Technical architecture block diagram

---

## 🧪 Automated Testing

Run the complete automated unit test suite:

python3 test\_jtagforge.py

*Result: 10/10 unit tests passing (100% pass rate).*

---

## 💼 Commercialization & Licensing

* **Community Edition**: Free open core web workbench.  
* **Pro Seat**: \$149 one-time (Python CLI, SVF/OpenOCD synthesizers).  
* **Team / Lab License**: \$1,299/year (up to 10 seats, 10-point security audit reports).  
* **Enterprise OEM**: \$4,999/year (unlimited site seats, custom silicon registers, 24/7 SLA).