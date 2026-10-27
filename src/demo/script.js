// src/demo/script.js
// 90-second retimed demo mode script.
// Designed with reset() between attack scenarios to clear risk hysteresis.

export const TOTAL_DEMO_SECONDS = 90

export const DEMO_STEPS = [
  {
    stepIndex: 1,
    startSec: 0,
    endSec: 8,
    mode: 'drive',
    attack: null,
    resetBefore: true,
    title: 'Baseline Normal Driving',
    caption: 'Normal driving. Digital VALID, Physics PLAUSIBLE. The twin matches the sensors.',
  },
  {
    stepIndex: 2,
    startSec: 8,
    endSec: 20,
    mode: 'fastChargeRamp',
    attack: null,
    resetBefore: false,
    title: 'Legitimate Fast-Charge Ramp',
    caption: 'Strong current, physically consistent: stays ALLOW. It does not cry wolf.',
  },
  {
    stepIndex: 3,
    startSec: 20,
    endSec: 45,
    mode: 'drive',
    attack: 'freeze_T',
    resetBefore: true,
    title: 'Temperature Freeze Attack',
    caption: 'The pack heats but the sensor stays flat. Digital still VALID, Physics IMPLAUSIBLE. (Thermal time-scale ×20)',
  },
  {
    stepIndex: 4,
    startSec: 45,
    endSec: 58,
    mode: 'drive',
    attack: 'discharge_off',
    resetBefore: true,
    title: 'DISCHARGE_OFF at Speed',
    caption: 'Delhi e-rickshaw scenario: a valid power-off command at speed. Blocked by pre-check.',
  },
  {
    stepIndex: 5,
    startSec: 58,
    endSec: 70,
    mode: 'charge',
    attack: 'malicious_cmd',
    resetBefore: true,
    title: 'Malicious Command Limit',
    caption: 'An out-of-range command, blocked before execution.',
  },
  {
    stepIndex: 6,
    startSec: 70,
    endSec: 80,
    mode: 'drive',
    attack: 'forged_packet',
    resetBefore: true,
    title: 'Forged Packet (Layer 1)',
    caption: 'A forged packet is stopped at layer 1, before physics.',
  },
  {
    stepIndex: 7,
    startSec: 80,
    endSec: 90,
    mode: 'drive',
    attack: null,
    resetBefore: true,
    title: 'Run Complete',
    caption: '90s Guided Run Complete. Summary of measured physical firewall enforcements.',
    showSummary: true,
  },
]
