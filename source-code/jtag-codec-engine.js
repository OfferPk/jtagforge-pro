/**
 * JTAGForge Pro - 32-Bit IDCODE & Instruction Register Codec
 * Standards: IEEE 1149.1-2013 Section 7, JEDEC JEP106 Manufacturer Standard
 * Pure ES6+ Module - Zero External Runtime Dependencies
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JTAGCodecEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // JEDEC Standard Manufacturer Identifiers (11-bit)
  const JEDEC_MANUFACTURERS = {
    0x093: 'Xilinx / AMD',
    0x0DD: 'Intel / Altera',
    0x041: 'STMicroelectronics',
    0x021: 'STMicroelectronics',
    0x049: 'Xilinx / AMD',
    0x06E: 'Intel / Altera',
    0x017: 'Texas Instruments',
    0x029: 'Microchip / Atmel',
    0x015: 'NXP Semiconductors',
    0x00B: 'Broadcom',
    0x026: 'Analog Devices',
    0x01F: 'Lattice Semiconductor',
    0x037: 'Infineon Technologies',
    0x00E: 'Cypress Semiconductor',
    0x004: 'Fujitsu',
    0x04A: 'Silicon Labs',
    0x001: 'AMD (Legacy)'
  };

  // Standard IEEE 1149.1 Instructions
  const STANDARD_INSTRUCTIONS = [
    { name: 'BYPASS', description: 'Mandatory 1-bit bypass register between TDI and TDO (All 1s opcode)', isMandatory: true },
    { name: 'EXTEST', description: 'Mandatory PCB trace interconnect test; drives outputs and samples inputs', isMandatory: true },
    { name: 'SAMPLE_PRELOAD', description: 'Mandatory non-intrusive pin state sampling and preloading', isMandatory: true },
    { name: 'IDCODE', description: 'Selects 32-bit Device Identification Register', isMandatory: false },
    { name: 'USERCODE', description: 'Selects user-programmable 32-bit identification register', isMandatory: false },
    { name: 'INTEST', description: 'Internal chip logic verification testing', isMandatory: false },
    { name: 'CLAMP', description: 'Clamps outputs to preloaded states while selecting bypass register', isMandatory: false },
    { name: 'HIGHZ', description: 'Tri-states all boundary-scan output pins to prevent bus contention', isMandatory: false }
  ];

  class JTAGCodecEngine {
    constructor() {
      this.JEDEC_MANUFACTURERS = JEDEC_MANUFACTURERS;
      this.STANDARD_INSTRUCTIONS = STANDARD_INSTRUCTIONS;
    }

    /**
     * Synthesizes 32-Bit IDCODE Word (IEEE 1149.1 Section 7.2)
     */
    buildIDCODE(options = {}) {
      const {
        version = 0,         // 4 bits (0..15)
        partNumber = 0x1234, // 16 bits (0..65535)
        manufacturerId = 0x093 // 11 bits (JEDEC)
      } = options;

      let id = 0;
      id |= ((version & 0x0F) << 28);
      id |= ((partNumber & 0xFFFF) << 12);
      id |= ((manufacturerId & 0x7FF) << 1);
      id |= 0x01; // Mandatory Bit 0 = 1 in IEEE 1149.1

      return id >>> 0;
    }

    /**
     * Dissects a 32-Bit IDCODE Word
     */
    parseIDCODE(idWord) {
      const word = (typeof idWord === 'string' ? parseInt(idWord, 16) : idWord) >>> 0;

      const version = (word >>> 28) & 0x0F;
      const partNumber = (word >>> 12) & 0xFFFF;
      const mfgId = (word >>> 1) & 0x7FF;
      const bit0 = word & 0x01;

      const mfgName = JEDEC_MANUFACTURERS[mfgId] || `Unknown Vendor (0x${mfgId.toString(16).toUpperCase()})`;
      const isValidIEEE = bit0 === 1;

      return {
        rawHex: '0x' + word.toString(16).padStart(8, '0').toUpperCase(),
        version,
        partNumberHex: '0x' + partNumber.toString(16).padStart(4, '0').toUpperCase(),
        partNumber,
        manufacturerIdHex: '0x' + mfgId.toString(16).padStart(3, '0').toUpperCase(),
        manufacturerId: mfgId,
        manufacturerName: mfgName,
        bit0,
        isValidIEEE,
        validationNote: isValidIEEE ? 'Bit 0 is 1 (Valid IEEE 1149.1)' : 'ERROR: Bit 0 is 0 (Violates IEEE 1149.1 spec)'
      };
    }

    /**
     * Resolves standard instruction opcode for given IR length
     */
    getInstructionOpcode(name, irLength = 5) {
      const allOnes = (1 << irLength) - 1;

      switch (name.toUpperCase()) {
        case 'BYPASS':
          return allOnes; // All 1s
        case 'EXTEST':
          return 0x00;   // Usually 0x00
        case 'IDCODE':
          return 0x01;
        case 'SAMPLE':
        case 'SAMPLE_PRELOAD':
          return 0x05;
        case 'HIGHZ':
          return 0x0A;
        case 'CLAMP':
          return 0x0B;
        default:
          return allOnes;
      }
    }
  }

  return JTAGCodecEngine;
});
