# JTAGForge Pro (v1.0.0) — Technical Architecture & Silicon Systems Engineering Specification

## 1\. Executive Summary & Design Principles

**JTAGForge Pro** is a vendor-neutral, zero-runtime-dependency engineering platform and silicon security auditor for **IEEE 1149.1 (Standard Test Access Port and Boundary-Scan Architecture)** and **IEEE 1149.6 (Boundary-Scan Testing of Advanced Digital Networks / AC-Coupled Differential Interconnects)**.

Traditional electronic design automation (EDA) boundary-scan toolchains (Corelis ScanExpress, XJTAG, Göpel electronic CASCON, Keysight 3070\) suffer from massive enterprise friction:

1. **Extreme Capital Expense**: \$10,000 to \$35,000+ per engineer license seats.  
2. **Proprietary Hardware Lock-In**: Specialized USB-to-JTAG pods that prevent headless continuous integration (CI) or automated test equipment (ATE) orchestration.  
3. **Hardware Cybersecurity Blindspots**: Legacy tools assume JTAG is solely a benign manufacturing test interface, ignoring modern firmware extraction vectors, memory readout risks via debug access ports (DAPs), and fault-injection glitch vulnerabilities.

JTAGForge Pro delivers an integrated suite containing:

* **16-State Finite State Machine (FSM) Simulator**: Deterministic state transitions and BFS-driven minimum-clock TMS path resolution.  
* **32-Bit IDCODE Dissector & Synthesizer**: IEEE 1149.1 §7.2 bitfield decoder with JEDEC JEP106 manufacturer lookup and mandatory Bit 0 rule enforcement.  
* **Boundary-Scan Description Language (BSDL VHDL) Engine**: Formal grammar validator, pin-to-boundary-cell mapper, and template synthesizer.  
* **10-Point Silicon Hardware Security Auditor**: Automated risk evaluation against open JTAG ports, unauthenticated AHB/AXI memory reads, and glitch attacks.  
* **SVF (Serial Vector Format) & OpenOCD Synthesizers**: Direct export for automated boundary-scan testing and silicon flashing.

---

## 2\. System Architecture & Component Interactions

\+-----------------------------------------------------------------------------------+

\|                                  JTAGForge Pro                                    \|

\+-----------------------------------------------------------------------------------+

\|  UI Layer: Responsive Emerald & Logic-Cyan Glassmorphism Silicon Test Bench       \|

\|  \- 16-State FSM Navigator \| IDCODE Dissector \| BSDL Parser \| Security Auditor     \|

\+-----------------------------------------------------------------------------------+

                                   \|

         \+-------------------------+-------------------------+

         \|                         \|                         \|

         v                         v                         v

\+-------------------+     \+-------------------+     \+-------------------+

\|   JtagTapEngine   \|     \|  JtagCodecEngine  \|     \|   JtagBsdlEngine  \|

\| \- 16 TAP States   \|     \| \- 32-Bit IDCODE   \|     \| \- VHDL BSDL Parse \|

\| \- BFS Pathfinding \|     \| \- JEDEC JEP106    \|     \| \- IR Opcode Match \|

\| \- Shift DR/IR Reg \|     \| \- Mandatory Bit 0 \|     \| \- Cell Length Val \|

\+-------------------+     \+-------------------+     \+-------------------+

         \|                         \|                         \|

         \+-------------------------+-------------------------+

                                   \|

                                   v

                      \+--------------------------+

                      \|   JtagSecurityAuditor    \|

                      \| \- 10-Point Risk Scoring  \|

                      \| \- RDP Lock Verification  \|

                      \| \- Fault Injection Checks \|

                      \+--------------------------+

                                   \|

         \+-------------------------+-------------------------+

         \|                                                   \|

         v                                                   v

\+-----------------------------------+               \+-----------------------------------+

\|       SVF Vector Exporter         \|               \|     OpenOCD Script Synthesizer    \|

\| \- IEEE 1149.1 ATE Test Scripts    \|               \| \- JTAG Target Configuration       \|

\| \- Automated Flashing Vectors      \|               \| \- Cortex-M / FPGA Scan Chains     \|

\+-----------------------------------+               \+-----------------------------------+

---

## 3\. IEEE 1149.1 TAP Controller Finite State Machine

The Test Access Port (TAP) controller is a 16-state finite state machine controlled strictly by two synchronous signals: **TCK (Test Clock)** and **TMS (Test Mode Select)**.

### 3.1 State Set & Transition Mechanics

The 16 states are structured into three distinct branches:

1. **Control Branch**:  
   * `TEST_LOGIC_RESET`: Controller is reset; boundary-scan circuitry is disabled, permitting normal chip operation. Guaranteed reachable from any state in at most 5 TCK cycles with TMS=1.  
   * `RUN_TEST_IDLE`: Test logic is active only when specific instructions are loaded (e.g. `RUNBIST`).  
   * `SELECT_DR_SCAN` / `SELECT_IR_SCAN`: Dual branch gateways.  
2. **Data Register (DR) Scan Branch**:  
   * `CAPTURE_DR`: Loads parallel input pin data into boundary scan registers.  
   * `SHIFT_DR`: Shifts data serially from TDI toward TDO through the active DR.  
   * `EXIT1_DR`: Temporary transitional state.  
   * `PAUSE_DR`: Suspends shifting without altering shift register contents.  
   * `EXIT2_DR`: Decision state to either resume shifting or terminate.  
   * `UPDATE_DR`: Latches shifted serial data into the parallel output latch of the boundary scan cells.  
3. **Instruction Register (IR) Scan Branch**:  
   * `CAPTURE_IR`: Loads fixed design pattern (mandated 01 on 2 lowest bits) into the IR.  
   * `SHIFT_IR`: Shifts instruction opcodes serially through the IR.  
   * `EXIT1_IR`, `PAUSE_IR`, `EXIT2_IR`, `UPDATE_IR`: Analogous to the DR branch.

### 3.2 Breadth-First Search (BFS) Pathfinding

The TAP navigation engine uses BFS graph traversal to discover the minimal TCK clock sequence to transition between any two states, ensuring optimal test vector generation.

---

## 4\. 32-Bit IDCODE Bitfield Specification (IEEE 1149.1 §7.2)

The Device Identification Register is a 32-bit read-only shift register structured as follows:

* **Version (Bits 31..28 \- 4 bits)**: Silicon stepping / revision number.  
* **Part Number (Bits 27..12 \- 16 bits)**: Chip family identifier assigned by manufacturer.  
* **Manufacturer ID (Bits 11..1 \- 11 bits)**: JEDEC JEP106 continuation and identification code.  
* **Mandatory Bit 0 (Bit 0 \- 1 bit)**: Strictly mandated as `1`. This differentiates the IDCODE register from the BYPASS register (which always outputs `0` on the first TCK cycle in CAPTURE-DR).

---

## 5\. Security & Hardware Hardening Audit Framework

JTAG is the primary attack surface for physical firmware extraction and unauthorized hardware debug. The 10-point audit framework evaluates:

1. **Debug Lock Level**: RDP Level 0 (open), Level 1 (password/reconfigurable), or Level 2 (permanently fused).  
2. **Memory Port Disablement**: Disabling AHB-AP/AXI-AP debug access to on-chip Flash and SRAM.  
3. **EXTEST Pin Hijacking Defense**: Gating boundary scan pin overdriving in production.  
4. **Anti-Tamper & Zeroization**: Automated cryptographic key clearing upon unauthorized physical probe attachment.  
5. **Fault Injection Hardening**: Brownout and clock glitch detection on TCK and VDD rails.