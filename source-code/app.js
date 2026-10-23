/**
 * JTAGForge Pro - Web Application Controller (app.js)
 * Coordinates UI interactions across TAP FSM, IDCODE Dissector, BSDL Parser,
 * Hardware Security Auditor, and SVF/OpenOCD Synthesizers.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize TAP Simulator instance
    const tapEngine = new JtagTapEngine();
    const codecEngine = new JtagCodecEngine();
    const bsdlEngine = new JtagBsdlEngine();
    const securityAuditor = new JtagSecurityAuditor();

    // Setup Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });

    // Populate Target State Selector in Tab 1
    const targetStateSelect = document.getElementById('select-target-state');
    if (targetStateSelect && JtagTapEngine.STATES) {
        Object.keys(JtagTapEngine.STATES).forEach(st => {
            const opt = document.createElement('option');
            opt.value = st;
            opt.textContent = st;
            targetStateSelect.appendChild(opt);
        });
        targetStateSelect.value = 'SHIFT_DR';
    }

    // Tab 1: TAP FSM Clock Controls
    const currentDisplay = document.getElementById('tap-current-display');
    const navResult = document.getElementById('nav-path-result');

    function updateFsmDisplay() {
        if (currentDisplay) {
            currentDisplay.textContent = tapEngine.currentState;
        }
    }

    document.getElementById('btn-tms-0')?.addEventListener('click', () => {
        tapEngine.step(0);
        updateFsmDisplay();
    });

    document.getElementById('btn-tms-1')?.addEventListener('click', () => {
        tapEngine.step(1);
        updateFsmDisplay();
    });

    document.getElementById('btn-tap-reset')?.addEventListener('click', () => {
        tapEngine.reset();
        updateFsmDisplay();
        if (navResult) {
            navResult.textContent = 'Hardware reset executed (5 clocks TMS=1). FSM forced to TEST_LOGIC_RESET.';
        }
    });

    document.getElementById('btn-navigate-path')?.addEventListener('click', () => {
        const target = targetStateSelect.value;
        const nav = tapEngine.navigateToState(target);
        if (navResult) {
            navResult.innerHTML = '<strong>Path Calculated:</strong> ' + nav.path.join(' &rarr; ') + '<br>' +
                                  '<strong>TMS Bitstream:</strong> <code class="font-mono">[' + nav.tmsSequence.join(', ') + ']</code> (' + nav.tmsSequence.length + ' TCK clocks)';
        }
        updateFsmDisplay();
    });

    // Shift Register Simulation
    document.getElementById('btn-execute-shift')?.addEventListener('click', () => {
        const regType = document.getElementById('scan-register-type').value;
        const bitsVal = document.getElementById('scan-input-bits').value;
        const len = parseInt(document.getElementById('scan-bit-length').value, 10) || 32;

        const shiftRes = tapEngine.shiftTransaction(regType, bitsVal, len);
        const shiftPanel = document.getElementById('shift-results-panel');
        const shiftLog = document.getElementById('shift-log');
        if (shiftPanel && shiftLog) {
            shiftPanel.style.display = 'block';
            shiftLog.textContent = JSON.stringify(shiftRes, null, 2);
        }
        updateFsmDisplay();
    });

    // Tab 2: IDCODE Dissector Controls
    function renderIdcodeAnalysis(idcodeVal) {
        const analysis = codecEngine.dissectIdcode(idcodeVal);

        document.getElementById('bf-version-val').textContent = '0x' + analysis.version.toString(16).toUpperCase();
        document.getElementById('bf-part-val').textContent = '0x' + analysis.partNumberHex.toUpperCase();
        document.getElementById('bf-mfg-val').textContent = analysis.manufacturerName + ' (0x' + analysis.manufacturerIdHex + ')';
        document.getElementById('bf-bit0-val').textContent = analysis.bit0Valid ? '1 (Valid)' : '0 (Invalid)';

        document.getElementById('res-hex').textContent = analysis.rawHex;
        document.getElementById('res-binary').textContent = analysis.binaryFormatted;
        document.getElementById('res-mfg-name').textContent = analysis.manufacturerName;
        document.getElementById('res-jedec-bank').textContent = 'Bank ' + analysis.jedecBank + ' (ID: 0x' + analysis.manufacturerIdHex + ')';

        const badge = document.getElementById('idcode-validity-badge');
        const bit0Stat = document.getElementById('res-bit0-status');
        if (analysis.bit0Valid) {
            badge.className = 'badge badge-success';
            badge.textContent = 'IEEE 1149.1 Valid';
            bit0Stat.innerHTML = '<span class="badge badge-success">Pass (Bit 0 is 1)</span>';
        } else {
            badge.className = 'badge badge-danger';
            badge.textContent = 'Spec Violation';
            bit0Stat.innerHTML = '<span class="badge badge-danger">Failed (Bit 0 must be 1)</span>';
        }
    }

    document.getElementById('btn-dissect-idcode')?.addEventListener('click', () => {
        const hex = document.getElementById('idcode-hex-input').value;
        renderIdcodeAnalysis(hex);
    });

    document.querySelectorAll('.badge-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const hex = btn.getAttribute('data-idcode');
            document.getElementById('idcode-hex-input').value = hex;
            renderIdcodeAnalysis(hex);
        });
    });

    document.getElementById('btn-build-idcode')?.addEventListener('click', () => {
        const ver = parseInt(document.getElementById('build-version').value, 10) || 0;
        const part = parseInt(document.getElementById('build-partno').value, 16) || 0;
        const mfg = parseInt(document.getElementById('build-mfg').value, 16) || 0;

        const built = codecEngine.buildIdcode(ver, part, mfg);
        document.getElementById('idcode-hex-input').value = built.idcodeHex;
        renderIdcodeAnalysis(built.idcodeHex);
    });

    // Initial IDCODE render
    renderIdcodeAnalysis('0x04991043');

    // Tab 3: BSDL Parser Controls
    const sampleStm32Bsdl = `-- BSDL Model for STM32F407 Microcontroller
entity STM32F407 is
  generic (PHYSICAL_CONSTRAINT: string := "LQFP144");
  port (
    TCK: in bit;
    TMS: in bit;
    TDI: in bit;
    TDO: out bit;
    TRST: in bit;
    PA0: inout bit;
    PA1: inout bit
  );
  use JTAG_1149_1_2001.all;
  attribute INSTRUCTION_LENGTH of STM32F407: entity is 5;
  attribute INSTRUCTION_OPCODE of STM32F407: entity is
    "BYPASS (11111), " &
    "IDCODE (01110), " &
    "SAMPLE (00010), " &
    "EXTEST (00000)";
  attribute IDCODE_REGISTER of STM32F407: entity is
    "0000" &               -- 4-bit Version
    "0100100110010001" &   -- 16-bit Part Number
    "00001000001" &       -- 11-bit Manufacturer
    "1";                   -- Mandatory bit
  attribute BOUNDARY_LENGTH of STM32F407: entity is 280;
end STM32F407;`;

    const sampleZynqBsdl = `-- BSDL Model for Xilinx Zynq-7000 SoC
entity XC7Z020 is
  generic (PHYSICAL_CONSTRAINT: string := "CLG400");
  port (
    TCK: in bit;
    TMS: in bit;
    TDI: in bit;
    TDO: out bit;
    VREF: in bit;
    IO_L1P: inout bit
  );
  use JTAG_1149_1_2001.all;
  attribute INSTRUCTION_LENGTH of XC7Z020: entity is 6;
  attribute INSTRUCTION_OPCODE of XC7Z020: entity is
    "BYPASS (111111), " &
    "IDCODE (001001), " &
    "SAMPLE (000001), " &
    "EXTEST (000000), " &
    "HIGHZ  (001010)";
  attribute IDCODE_REGISTER of XC7Z020: entity is
    "0000" &               -- Version 0
    "0011011000101000" &   -- Part
    "00001001001" &       -- Xilinx Mfg (0x093)
    "1";
  attribute BOUNDARY_LENGTH of XC7Z020: entity is 672;
end XC7Z020;`;

    document.getElementById('btn-load-sample-bsdl')?.addEventListener('click', () => {
        document.getElementById('bsdl-editor').value = sampleStm32Bsdl;
    });

    document.getElementById('btn-load-zynq-bsdl')?.addEventListener('click', () => {
        document.getElementById('bsdl-editor').value = sampleZynqBsdl;
    });

    document.getElementById('btn-generate-bsdl-template')?.addEventListener('click', () => {
        const tmpl = bsdlEngine.generateBsdlTemplate('CUSTOM_SILICON_SOC', 5, '0x04991043', 128);
        document.getElementById('bsdl-editor').value = tmpl;
    });

    document.getElementById('btn-parse-bsdl')?.addEventListener('click', () => {
        const src = document.getElementById('bsdl-editor').value;
        const res = bsdlEngine.parse(src);
        const container = document.getElementById('bsdl-results-container');
        const badge = document.getElementById('bsdl-status-badge');

        if (res.valid) {
            badge.className = 'badge badge-success';
            badge.textContent = 'Validation Passed';
            let opcodesHtml = '<ul>';
            Object.keys(res.instructions).forEach(ins => {
                opcodesHtml += '<li><strong>' + ins + '</strong>: <code>' + res.instructions[ins] + '</code></li>';
            });
            opcodesHtml += '</ul>';

            container.innerHTML = 
                '<table class="table-spec">' +
                    '<tbody>' +
                        '<tr><td>Entity Name:</td><td><strong>' + (res.entityName || 'N/A') + '</strong></td></tr>' +
                        '<tr><td>Instruction Length:</td><td>' + res.instructionLength + ' bits</td></tr>' +
                        '<tr><td>Boundary Scan Length:</td><td>' + res.boundaryLength + ' cells</td></tr>' +
                        '<tr><td>Extracted IDCODE:</td><td class="font-mono">' + (res.idcodeHex || 'None') + '</td></tr>' +
                        '<tr><td>Standard Compliance:</td><td>IEEE 1149.1 Compliant</td></tr>' +
                    '</tbody>' +
                '</table>' +
                '<h4 style="margin-top: 15px;">Standard Instructions Found</h4>' +
                opcodesHtml;
        } else {
            badge.className = 'badge badge-danger';
            badge.textContent = 'Errors Found';
            container.innerHTML = '<div class="alert alert-danger"><h4>BSDL Parsing Errors</h4><ul>' + res.errors.map(e => '<li>' + e + '</li>').join('') + '</ul></div>';
        }
    });

    // Load initial sample in BSDL editor
    if (document.getElementById('bsdl-editor')) {
        document.getElementById('bsdl-editor').value = sampleStm32Bsdl;
    }

    // Tab 4: Security Auditor Controls
    document.getElementById('btn-run-security-audit')?.addEventListener('click', () => {
        const device = document.getElementById('sec-target-device').value;
        const lockState = document.getElementById('sec-lock-state').value;
        const extestState = document.getElementById('sec-boundary-scan-extest').value;
        const allowMemRead = document.getElementById('sec-chk-firmware-read').checked;
        const antiTamper = document.getElementById('sec-chk-anti-tamper').checked;
        const glitchResist = document.getElementById('sec-chk-glitch-protection').checked;

        const auditReport = securityAuditor.audit({
            device,
            lockState,
            extestState,
            allowMemRead,
            antiTamper,
            glitchResist
        });

        const resBox = document.getElementById('security-audit-results');
        resBox.style.display = 'block';

        const scoreNum = document.getElementById('audit-score-num');
        const scoreCircle = document.getElementById('audit-score-circle');
        const ratingTitle = document.getElementById('audit-rating-title');
        const ratingDesc = document.getElementById('audit-rating-desc');
        const findingsList = document.getElementById('audit-findings-list');

        scoreNum.textContent = auditReport.score;
        ratingTitle.textContent = 'Security Rating: ' + auditReport.rating + ' (' + auditReport.riskLevel + ' Risk)';
        ratingDesc.textContent = auditReport.summary;

        if (auditReport.score >= 80) {
            scoreCircle.style.borderColor = '#10b981';
            scoreNum.style.color = '#10b981';
        } else if (auditReport.score >= 50) {
            scoreCircle.style.borderColor = '#f59e0b';
            scoreNum.style.color = '#f59e0b';
        } else {
            scoreCircle.style.borderColor = '#ef4444';
            scoreNum.style.color = '#ef4444';
        }

        let findingsHtml = '';
        auditReport.checks.forEach(chk => {
            const passBadge = chk.passed
                ? '<span class="badge badge-success">PASS</span>'
                : '<span class="badge badge-danger">FAIL (-' + chk.penalty + ' pts)</span>';
            findingsHtml += 
                '<div class="finding-card ' + (chk.passed ? 'pass' : 'fail') + '">' +
                    '<div class="finding-header">' +
                        '<strong>' + chk.id + ': ' + chk.title + '</strong>' +
                        passBadge +
                    '</div>' +
                    '<p class="finding-desc">' + chk.description + '</p>' +
                    (chk.remediation ? '<p class="finding-remediation"><strong>Remediation:</strong> ' + chk.remediation + '</p>' : '') +
                '</div>';
        });
        findingsList.innerHTML = findingsHtml;
    });

    document.getElementById('btn-quick-audit')?.addEventListener('click', () => {
        const secTabBtn = document.querySelector('[data-tab="tab-security"]');
        secTabBtn.click();
        document.getElementById('btn-run-security-audit').click();
    });

    // Tab 5: OpenOCD & SVF Synthesizer Controls
    document.getElementById('btn-generate-openocd')?.addEventListener('click', () => {
        const chip = document.getElementById('cfg-chip-name').value;
        const idcode = document.getElementById('cfg-idcode').value;
        const irlen = parseInt(document.getElementById('cfg-irlen').value, 10) || 5;
        const speed = parseInt(document.getElementById('cfg-speed-khz').value, 10) || 2000;

        const script = tapEngine.generateOpenOcdConfig(chip, idcode, irlen, speed);
        document.getElementById('openocd-output').textContent = script;
    });

    document.getElementById('btn-generate-svf')?.addEventListener('click', () => {
        const irHex = document.getElementById('svf-ir-hex').value;
        const expIdcode = document.getElementById('svf-expected-idcode').value;
        const freq = parseInt(document.getElementById('svf-freq-hz').value, 10) || 1000000;

        const svf = tapEngine.generateSvfScript(irHex, expIdcode, freq);
        document.getElementById('svf-output').textContent = svf;
    });

    // Run initial generators
    document.getElementById('btn-generate-openocd')?.click();
    document.getElementById('btn-generate-svf')?.click();
});
