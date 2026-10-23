/**
 * JTAGForge Pro - Silicon Hardware Cybersecurity & JTAG Lock Auditor
 * Standards: NIST SP 800-193 (Firmware Resiliency), IEEE 1149.1-2013, MITRE ATT&CK for ICS (T0809)
 * Pure ES6+ Module - Zero External Runtime Dependencies
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JTAGSecurityAuditor = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class JTAGSecurityAuditor {
    constructor() {
      this.AUDIT_RULES = [
        {
          id: 'JTAG_SEC_01',
          name: 'Production JTAG / SWD Port Lockdown (eFuse Verification)',
          category: 'Physical Security & Anti-Tamper',
          severity: 'CRITICAL',
          weight: 15,
          description: 'Production PCBs deployed with active, unblown JTAG/SWD debug ports allow adversaries to attach external probes and dump unencrypted firmware or secrets.',
          remediation: 'Blow hardware eFuses or configure Flash Readout Protection (e.g. STM32 RDP Level 2, NXP CRP3) to permanently disable JTAG/SWD access before shipping.'
        },
        {
          id: 'JTAG_SEC_02',
          name: 'Hardware Challenge-Response JTAG Authentication',
          category: 'Access Control & Authentication',
          severity: 'CRITICAL',
          weight: 15,
          description: 'If JTAG must remain accessible for field returns, it must be gated behind cryptographic challenge-response authentication rather than static passwords.',
          remediation: 'Implement secure JTAG unlock modules (e.g. ARM CoreSight Secure Debug Certificate, ECDSA P-256 authenticated unlock) before enabling debug lines.'
        },
        {
          id: 'JTAG_SEC_03',
          name: 'IEEE 1149.1 Mandatory IDCODE Bit 0 Verification',
          category: 'Silicon Specification Compliance',
          severity: 'HIGH',
          weight: 10,
          description: 'IEEE 1149.1 strictly dictates that Bit 0 of the 32-bit IDCODE must be 1. An IDCODE with Bit 0 = 0 causes scan chain misalignment and indicates counterfeit silicon.',
          remediation: 'Verify silicon manufacturer IDCODE against approved vendor BSDL files and ensure Bit 0 is strictly 1.'
        },
        {
          id: 'JTAG_SEC_04',
          name: 'Boundary-Scan Pin State Sniffing Leakage (SAMPLE Isolation)',
          category: 'Information Leakage Mitigation',
          severity: 'HIGH',
          weight: 10,
          description: 'The SAMPLE/PRELOAD instruction allows passive sniffing of external bus lines (such as external SPI Flash or DDR RAM encryption keys) during live runtime.',
          remediation: 'Gate the SAMPLE instruction behind secure enclave execution or disable boundary-scan cells connected to sensitive security bus pins.'
        },
        {
          id: 'JTAG_SEC_05',
          name: 'Clock & Voltage Glitch Attack Fault Injection Defense',
          category: 'Hardware Anti-Glitch Resilience',
          severity: 'HIGH',
          weight: 10,
          description: 'Voltage drop or clock glitching on TCK/TMS lines can force the TAP controller from SECURE into UNLOCKED state or corrupt instruction decoders.',
          remediation: 'Implement glitch-resistant dual-rail TAP state machines, internal RC oscillator clock monitoring, and brownout reset sensors.'
        },
        {
          id: 'JTAG_SEC_06',
          name: 'PCB Signal Integrity (TMS Pull-Up / TCK Pull-Down Resistors)',
          category: 'Hardware Reliability & Noise Immunity',
          severity: 'MEDIUM',
          weight: 10,
          description: 'Floating TMS/TCK lines on the PCB can pick up electromagnetic interference (EMI) and cause spontaneous transitions into TEST_LOGIC_RESET or SHIFT_DR.',
          remediation: 'Install 10k Ohm pull-up resistors on TMS and TDI, and a 10k Ohm pull-down resistor on TCK in compliance with IEEE 1149.1 Section 4.'
        },
        {
          id: 'JTAG_SEC_07',
          name: 'Unauthenticated EXTEST Output Pin Driving Protection',
          category: 'Physical Destruction & Bus Contention',
          severity: 'HIGH',
          weight: 10,
          description: 'Loading the EXTEST instruction enables arbitrary driving of chip I/O pins, risking short-circuits with active bus drivers and physical board damage.',
          remediation: 'Require physical hardware test jumper or service key insertion before permitting EXTEST execution.'
        },
        {
          id: 'JTAG_SEC_08',
          name: 'Scan Chain Transmission Line Termination & Reflected Waves',
          category: 'Signal Integrity',
          severity: 'MEDIUM',
          weight: 5,
          description: 'Unterminated long TDO/TDI traces at high clock rates (>15 MHz) generate signal reflections, causing intermittent bit-flip errors during boundary scanning.',
          remediation: 'Add 33-50 Ohm series dampening resistors close to TDO driver pins on long PCB traces.'
        },
        {
          id: 'JTAG_SEC_09',
          name: 'Embedded CPU Debug Core Privilege Escalation (CoreSight AP)',
          category: 'Microcontroller Core Protection',
          severity: 'HIGH',
          weight: 10,
          description: 'Debug Access Ports (DAP) granting direct read/write to CPU core registers (R0-R15) allow attackers to modify the program counter and bypass firmware security checks.',
          remediation: 'Lock debug access port (DAP) registers and ensure Secure Boot validates all memory before core execution.'
        },
        {
          id: 'JTAG_SEC_10',
          name: 'Firmware Readout Protection Level 2 (Permanent Hardware Lock)',
          category: 'Firmware Protection & Reverse Engineering',
          severity: 'MEDIUM',
          weight: 5,
          description: 'RDP Level 1 protection allows clearing security via a mass erase, which can still leak flash remnants or allow device repurposing.',
          remediation: 'Advance to permanent RDP Level 2 lock on final mass-production firmware release.'
        }
      ];
    }

    /**
     * Executes the 10-point hardware security audit on board/chip configuration
     */
    auditHardware(config = {}) {
      const findings = [];
      let totalDeductions = 0;

      // Rule 1: JTAG Port Lock
      if (!config.isJtagPortLocked) {
        findings.push(this.createFinding('JTAG_SEC_01', 'Production board has active, unlocked JTAG/SWD test port pins exposed.'));
        totalDeductions += 15;
      }

      // Rule 2: Challenge-Response Auth
      if (!config.hasChallengeResponseAuth) {
        findings.push(this.createFinding('JTAG_SEC_02', 'JTAG TAP interface lacks cryptographic challenge-response authentication.'));
        totalDeductions += 15;
      }

      // Rule 3: IDCODE Bit 0
      if (config.idcodeBit0 !== 1 && config.idcodeBit0 !== undefined) {
        findings.push(this.createFinding('JTAG_SEC_03', 'Device IDCODE Bit 0 is 0, violating mandatory IEEE 1149.1 specification.'));
        totalDeductions += 10;
      }

      // Rule 4: SAMPLE isolation
      if (!config.isSampleInstructionGated) {
        findings.push(this.createFinding('JTAG_SEC_04', 'SAMPLE instruction allows unconstrained observation of internal cryptographic bus lines.'));
        totalDeductions += 10;
      }

      // Rule 5: Glitch resilience
      if (!config.hasGlitchSensors) {
        findings.push(this.createFinding('JTAG_SEC_05', 'TAP state machine lacks clock/voltage glitch detection circuitry.'));
        totalDeductions += 10;
      }

      // Rule 6: Pull-up / Pull-down resistors
      if (!config.hasTmsPullUpAndTckPullDown) {
        findings.push(this.createFinding('JTAG_SEC_06', 'Missing PCB pull-up on TMS or pull-down on TCK, creating floating noise sensitivity.'));
        totalDeductions += 10;
      }

      // Rule 7: EXTEST hardware gate
      if (!config.hasExtestHardwareGate) {
        findings.push(this.createFinding('JTAG_SEC_07', 'EXTEST instruction can drive external pins without physical test jumper authorization.'));
        totalDeductions += 10;
      }

      // Rule 8: Trace termination
      if (!config.hasSeriesDampeningResistors) {
        findings.push(this.createFinding('JTAG_SEC_08', 'Long TDO PCB traces lack series damping resistors, risking signal reflections.'));
        totalDeductions += 5;
      }

      // Rule 9: DAP privilege lock
      if (!config.isDapAccessPortLocked) {
        findings.push(this.createFinding('JTAG_SEC_09', 'Debug Access Port (DAP) allows direct memory bus tampering and register overrides.'));
        totalDeductions += 10;
      }

      // Rule 10: RDP Level 2
      if (!config.isPermanentRdpLevel2) {
        findings.push(this.createFinding('JTAG_SEC_10', 'Device configured at temporary Readout Protection (RDP Level 1) rather than permanent lock.'));
        totalDeductions += 5;
      }

      const score = Math.max(0, 100 - totalDeductions);
      let posture = 'POOR';
      if (score >= 90) posture = 'EXCELLENT';
      else if (score >= 75) posture = 'GOOD';
      else if (score >= 60) posture = 'ACCEPTABLE';

      return {
        auditTimestamp: new Date().toISOString(),
        score,
        posture,
        totalRulesAudited: this.AUDIT_RULES.length,
        findingsCount: findings.length,
        criticalCount: findings.filter(f => f.severity === 'CRITICAL').length,
        highCount: findings.filter(f => f.severity === 'HIGH').length,
        mediumCount: findings.filter(f => f.severity === 'MEDIUM').length,
        findings
      };
    }

    createFinding(ruleId, evidence) {
      const rule = this.AUDIT_RULES.find(r => r.id === ruleId);
      return {
        ruleId,
        ruleName: rule.name,
        category: rule.category,
        severity: rule.severity,
        evidence,
        description: rule.description,
        remediation: rule.remediation
      };
    }
  }

  return JTAGSecurityAuditor;
});
