# JTAGForge Pro (v1.0.0) — Engineering User Guide & Operational Manual

## 1\. Quick Start Guide

JTAGForge Pro requires no external installations or runtime compilers. It operates as both a standalone, zero-dependency browser-based engineering workbench and a headless Python 3 CLI tool.

### Running the Web Studio

1. Open `source-code/index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).  
2. The interactive 5-tab interface immediately initializes the IEEE 1149.1 TAP state machine and IDCODE dissector.

### Running the Headless CLI

Ensure Python 3.8+ is installed on your Linux, macOS, or Windows workstation.

\# Make CLI executable

chmod \+x build/jtag-cli.py

\# Dissect an STM32 32-bit IDCODE

./build/jtag-cli.py dissect 0x04991043

\# Calculate minimum TMS path from RESET to SHIFT\_DR

./build/jtag-cli.py navigate \--start TEST\_LOGIC\_RESET \--target SHIFT\_DR

\# Run 10-point hardware cybersecurity audit

./build/jtag-cli.py audit \--device "Automotive ECU" \--lock UNLOCKED

\# Synthesize OpenOCD target configuration

./build/jtag-cli.py openocd \--chip stm32f4x \--idcode 0x04991043

---

## 2\. Core Operational Modules

### Module 1: 16-State TAP Simulator

* **Interactive FSM Clocking**: Clock single TMS pulses (`TMS=0` or `TMS=1`) to observe state transitions.  
* **Hardware Reset**: Trigger a guaranteed reset sequence (5 consecutive `TMS=1` pulses) to force the controller into `TEST_LOGIC_RESET`.  
* **Shortest Path Navigator**: Select any destination state (e.g. `SHIFT_DR`, `PAUSE_IR`) to instantly compute the minimum clock sequence and vector bitstream.  
* **Shift Register Simulation**: Simulate serially shifting data through DR or IR scan chains with full cycle-by-cycle logging.

### Module 2: 32-Bit IDCODE Dissector & Builder

* **Preset Library**: Quickly load common silicon targets:  
  * **STM32F407**: `0x04991043` (STMicroelectronics, Cortex-M4)  
  * **Xilinx Zynq-7000**: `0x03628093` (AMD/Xilinx SoC)  
  * **Intel Cyclone V**: `0x020F10DD` (Intel FPGA)  
  * **ARM CoreSight**: `0x1BA01477` (ARM Ltd Debug Port)  
* **Custom Encoder**: Define custom silicon revision numbers, part numbers, and JEDEC manufacturer IDs to synthesize compliant IEEE 1149.1 IDCODEs with mandatory Bit 0 verification.

### Module 3: BSDL VHDL Parser & Validator

* **Syntax & Semantic Parsing**: Parse BSDL VHDL models to extract:  
  * Entity name and package generic constraints.  
  * Instruction register length and standard opcode mappings (`BYPASS`, `EXTEST`, `SAMPLE`, `IDCODE`, `HIGHZ`).  
  * Boundary-scan register cell lengths.  
* **Template Generator**: Synthesize clean, compliant BSDL templates for new ASIC/FPGA designs.

### Module 4: Silicon Hardware Cybersecurity Auditor

* **10-Point Hardware Audit**: Assess hardware physical security posture before production manufacturing:  
  * Open JTAG port / unburned eFuse detection.  
  * Unauthenticated debug memory readout via AHB/AXI access ports.  
  * Active EXTEST boundary scan pin manipulation vulnerabilities.  
  * Physical tamper zeroization response.  
  * Fault-injection clock/voltage glitch resistance.  
* **Remediation Directives**: Receive actionable engineering remediation steps for each identified vulnerability.

### Module 5: OpenOCD & SVF Synthesizer

* **OpenOCD Config Synthesis**: Export ready-to-run `.cfg` files for hardware debuggers (ST-Link, J-Link, FTDI FT2232H, Raspberry Pi Pico JTAG).  
* **Serial Vector Format (SVF) Export**: Generate industry-standard SVF vector test files for Automated Test Equipment (ATE) and production boundary-scan test benches.