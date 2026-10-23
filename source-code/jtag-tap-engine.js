/**
 * JTAGForge Pro - Core TAP Controller & Protocol Engine
 * Standard: IEEE 1149.1-2013 (Boundary-Scan Architecture) & IEEE 1149.6
 * Pure ES6+ Module - Zero External Runtime Dependencies
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JTAGTAPEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // IEEE 1149.1 16-State TAP Controller Finite State Machine
  const TAP_STATES = {
    TEST_LOGIC_RESET: 'TEST_LOGIC_RESET',
    RUN_TEST_IDLE:    'RUN_TEST_IDLE',
    SELECT_DR_SCAN:   'SELECT_DR_SCAN',
    CAPTURE_DR:       'CAPTURE_DR',
    SHIFT_DR:         'SHIFT_DR',
    EXIT1_DR:         'EXIT1_DR',
    PAUSE_DR:         'PAUSE_DR',
    EXIT2_DR:         'EXIT2_DR',
    UPDATE_DR:        'UPDATE_DR',
    SELECT_IR_SCAN:   'SELECT_IR_SCAN',
    CAPTURE_IR:       'CAPTURE_IR',
    SHIFT_IR:         'SHIFT_IR',
    EXIT1_IR:         'EXIT1_IR',
    PAUSE_IR:         'PAUSE_IR',
    EXIT2_IR:         'EXIT2_IR',
    UPDATE_IR:        'UPDATE_IR'
  };

  // State transitions: state -> [nextStateIfTMS0, nextStateIfTMS1]
  const TRANSITIONS = {
    TEST_LOGIC_RESET: ['RUN_TEST_IDLE', 'TEST_LOGIC_RESET'],
    RUN_TEST_IDLE:    ['RUN_TEST_IDLE', 'SELECT_DR_SCAN'],
    SELECT_DR_SCAN:   ['CAPTURE_DR',    'SELECT_IR_SCAN'],
    CAPTURE_DR:       ['SHIFT_DR',      'EXIT1_DR'],
    SHIFT_DR:         ['SHIFT_DR',      'EXIT1_DR'],
    EXIT1_DR:         ['PAUSE_DR',      'UPDATE_DR'],
    PAUSE_DR:         ['PAUSE_DR',      'EXIT2_DR'],
    EXIT2_DR:         ['SHIFT_DR',      'UPDATE_DR'],
    UPDATE_DR:        ['RUN_TEST_IDLE', 'SELECT_DR_SCAN'],
    SELECT_IR_SCAN:   ['CAPTURE_IR',    'TEST_LOGIC_RESET'],
    CAPTURE_IR:       ['SHIFT_IR',      'EXIT1_IR'],
    SHIFT_IR:         ['SHIFT_IR',      'EXIT1_IR'],
    EXIT1_IR:         ['PAUSE_IR',      'UPDATE_IR'],
    PAUSE_IR:         ['PAUSE_IR',      'EXIT2_IR'],
    EXIT2_IR:         ['SHIFT_IR',      'UPDATE_IR'],
    UPDATE_IR:        ['RUN_TEST_IDLE', 'SELECT_DR_SCAN']
  };

  class JTAGTAPEngine {
    constructor(initialState = TAP_STATES.TEST_LOGIC_RESET) {
      this.currentState = initialState;
      this.history = [];
      this.instructionRegister = 0x01; // Default
      this.irLength = 5;               // Default 5-bit IR
      this.dataRegister = 0x00000000;
      this.logState('INIT');
    }

    logState(action, tms = null) {
      this.history.unshift({
        timestamp: new Date().toISOString(),
        action,
        tms,
        state: this.currentState
      });
      if (this.history.length > 50) this.history.pop();
    }

    /**
     * Advances TAP state machine by one TCK clock pulse with given TMS bit (0 or 1)
     */
    clockTMS(tmsBit) {
      const bit = tmsBit ? 1 : 0;
      const next = TRANSITIONS[this.currentState][bit];
      this.currentState = next;
      this.logState('CLOCK_TMS', bit);
      return this.currentState;
    }

    /**
     * Resets TAP state machine to TEST_LOGIC_RESET (Guaranteed in 5 clocks of TMS=1)
     */
    resetTAP() {
      for (let i = 0; i < 5; i++) {
        this.clockTMS(1);
      }
      return this.currentState;
    }

    /**
     * Solves shortest TMS sequence to navigate from currentState to targetState (BFS)
     */
    getTMSPath(fromState, toState) {
      if (fromState === toState) return [];

      const queue = [{ state: fromState, path: [] }];
      const visited = new Set([fromState]);

      while (queue.length > 0) {
        const { state, path } = queue.shift();
        const neighbors = TRANSITIONS[state];

        for (let tms = 0; tms <= 1; tms++) {
          const nextState = neighbors[tms];
          const newPath = [...path, tms];

          if (nextState === toState) {
            return newPath;
          }

          if (!visited.has(nextState)) {
            visited.add(nextState);
            queue.push({ state: nextState, path: newPath });
          }
        }
      }
      return [];
    }

    /**
     * Navigates TAP controller to targetState
     */
    navigateTo(targetState) {
      const path = this.getTMSPath(this.currentState, targetState);
      for (const tms of path) {
        this.clockTMS(tms);
      }
      return {
        path,
        finalState: this.currentState
      };
    }

    /**
     * Simulates shifting N bits through IR or DR in SHIFT_IR / SHIFT_DR state
     */
    shiftBits(bitArray, isIR = false) {
      const targetShiftState = isIR ? TAP_STATES.SHIFT_IR : TAP_STATES.SHIFT_DR;
      const targetUpdateState = isIR ? TAP_STATES.UPDATE_IR : TAP_STATES.UPDATE_DR;

      // Navigate to shift state
      this.navigateTo(targetShiftState);

      const capturedTDO = [];
      for (let i = 0; i < bitArray.length; i++) {
        const isLastBit = (i === bitArray.length - 1);
        const tms = isLastBit ? 1 : 0; // Last bit exits to EXIT1
        const tdi = bitArray[i] ? 1 : 0;

        // Mock TDO: returns arbitrary or register bit
        capturedTDO.push(tdi);
        this.clockTMS(tms);
      }

      // Move from EXIT1 to UPDATE
      this.clockTMS(1);
      // Move from UPDATE to RUN_TEST_IDLE
      this.clockTMS(0);

      return {
        tdiShifted: bitArray,
        tdoCaptured: capturedTDO,
        finalState: this.currentState
      };
    }

    /**
     * Synthesizes OpenOCD configuration script
     */
    generateOpenOCDConfig(options = {}) {
      const {
        chipName = 'target_chip',
        irLength = 5,
        expectedId = 0x09300093,
        adapterSpeedKHz = 1000
      } = options;

      const idHex = '0x' + (expectedId >>> 0).toString(16).padStart(8, '0');

      return `# ==============================================================================
# JTAGForge Pro - OpenOCD Boundary-Scan Configuration
# Standard: IEEE 1149.1-2013 | Target: ${chipName}
# ==============================================================================

adapter driver ftdi
adapter speed ${adapterSpeedKHz}

# Declare JTAG TAP
jtag newtap ${chipName} tap -irlen ${irLength} -expected-id ${idHex}

# Initialize TAP
init
scan_chain
echo "[JTAGFORGE] JTAG TAP initialized and verified."
`;
    }

    /**
     * Synthesizes SVF (Serial Vector Format) script for boundary-scan test execution
     */
    generateSVF(options = {}) {
      const {
        irLength = 5,
        idcodeInstr = 0x01,
        expectedIdHex = '09300093',
        sampleInstr = 0x05
      } = options;

      const irHex = idcodeInstr.toString(16).padStart(2, '0');
      const sampleHex = sampleInstr.toString(16).padStart(2, '0');

      return `// JTAGForge Pro - Serial Vector Format (SVF) Test Script
// Standard: IEEE 1149.1 Boundary Scan Validation

TRST OFF;
ENDIR IDLE;
ENDDR IDLE;

// Step 1: Reset TAP Controller
STATE RESET;
STATE IDLE;

// Step 2: Shift IDCODE Instruction
SIR ${irLength} TDI (${irHex});

// Step 3: Shift Out 32-bit IDCODE Register
SDR 32 TDI (00000000) TDO (${expectedIdHex}) MASK (FFFFFFFF);

// Step 4: Shift SAMPLE/PRELOAD Instruction
SIR ${irLength} TDI (${sampleHex});
RUNTEST 10 TCK;

// Step 5: Return to Idle
STATE IDLE;
`;
    }
  }

  return {
    JTAGTAPEngine,
    TAP_STATES,
    TRANSITIONS
  };
});
