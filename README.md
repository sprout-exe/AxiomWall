# AxiomWall

**A physics-plausibility firewall for connected EVs and energy systems.**
AxiomWall detects cyberattacks that look digitally valid but are physically impossible, explains the evidence in plain English, and recommends a graded response.

> Built for VIT Sustainathon, Sustainable AI & Cybersecurity track, **PS AI-01: The Physically Plausible Cyberattack Problem**.
> Live demo: `<add Vercel URL>`

---

## The problem

Modern EVs, chargers and energy systems rely on digital communication. A malicious command or sensor value can pass every conventional check (valid signature, correct format, authorised sender) and still produce physically abnormal behaviour. Traditional security asks *who sent this?* It does not ask *does this make physical sense?*

## Our approach

AxiomWall adds a **semantic security** layer next to the digital checks. Every sample and command is tested against battery and thermal physics and against a live digital twin. When the digital status says **VALID** but the physical status says **IMPLAUSIBLE**, AxiomWall raises a risk score, localizes the likely origin, predicts the damage, and recommends **Allow / Warn / Limit / Block**.

> **Honesty note:** all telemetry is a *simulated digital twin*. Limit and Block are *recommended gateway actions*, not hardware enforcement.

## Features

| # | Feature | Where in the app |
|---|---|---|
| 1 | **Physics Plausibility Engine**: hard limits, I²R heating, SoC conservation, power = V·I | `src/engine/rules.js` |
| 2 | **Digital Twin residuals**: predicted vs measured V, T, SoC | `src/engine/twin.js`, `TwinChart.jsx` |
| 3 | **Cross-sensor consistency**: V·I vs P, temperature trend vs current | `src/engine/crossSensor.js` |
| 4 | **Attack localization**: Sensor, Comms, Controller or Actuator | `src/engine/localize.js`, `LocalizationPipeline.jsx` |
| 5 | **Cyber-to-physical impact prediction**: command → current → heat → damage | `src/engine/impact.js`, `ImpactChain.jsx` |
| 6 | **Graded response** from a 0 to 100 risk score | `src/engine/risk.js`, `RiskGauge.jsx` |
| 7 | **Attack Lab**: inject spoofing, replay, false-data and command attacks live | `AttackLab.jsx` |
| 8 | **Explainable dashboard**: Digital vs Physical status with a plain-English "why" | `DigitalVsPhysical.jsx`, `IncidentFeed.jsx` |

Additional pieces in this repo: Firebase login with roles, a telemetry inspector, evidence export, a hardware link to a Wokwi simulation, and a sustainability card. `<confirm and adjust this list>`

## The physics (summary)

- Terminal voltage: `V = OCV(SoC) − I·R_int`
- Thermal: `C_th · dT/dt = I²·R_int − (T − T_amb) / R_th`
- Charge conservation: `ΔSoC = −(I·Δt) / (3600·Q_nom)`, flagged above the physical maximum rate
- Power consistency: `|P_reported − V·I| < ε`
- Residual: `r = |measured − predicted| / tolerance`
- Risk: `100 · min(1, 0.30·Residual + 0.25·CrossSensor + 0.25·HardLimit + 0.20·Impact)`

| Risk score | Recommended response |
|---|---|
| 0 to 25 | ALLOW |
| 25 to 50 | WARN |
| 50 to 75 | LIMIT (cap current) |
| 75 to 100 | BLOCK |

A hard-limit violation forces at least LIMIT, and hysteresis (escalate after 3 samples, recover after 10) prevents flicker.

## Attack scenarios

1. **Temperature freeze**: temperature pinned at 25 °C while current is high
2. **Replay**: a recorded clean window looped
3. **SoC false-data injection**: SoC jumps faster than physics allows
4. **Coordinated spoof**: voltage, current and power falsified together
5. **Malicious command**: valid, signed `SET_CURRENT = 120 A`, predicted unsafe before execution

Each attack shows the same moment: **Digital PASSED, Physical FAILED**, then the response and the reason.

## Tech stack

- React + Vite (JavaScript)
- Firebase (authentication) `<confirm: Auth only, or also Firestore?>`
- oxlint for linting
- Deployed on Vercel `<confirm>`

## Project structure

```
AxiomWall/
├── index.html
├── vite.config.js
├── public/                  static assets and background images
└── src/
    ├── App.jsx, main.jsx, index.css
    ├── components/          dashboard UI (AttackLab, RiskGauge, TwinChart, ...)
    ├── engine/              physics and detection logic (no UI code)
    │   ├── twin.js          battery and thermal digital twin
    │   ├── rules.js         plausibility rules and hard limits
    │   ├── crossSensor.js   cross-sensor consistency
    │   ├── localize.js      attack localization
    │   ├── impact.js        forward impact prediction
    │   ├── risk.js          risk score and response
    │   └── index.js         engine entry point
    ├── sim/                 telemetry simulator and Wokwi link
    └── store/useStore.js    application state
```

## Getting started

**Prerequisites:** Node.js 18 or newer and npm.

```bash
git clone https://github.com/sprout-exe/AxiomWall.git
cd AxiomWall
npm install
npm run dev
```

Open the local URL that Vite prints (usually `http://localhost:5173`).

Other scripts `<verify against package.json>`:

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
npm run lint      # run the linter
```

## Environment variables

Create a `.env.local` file in the project root. It is git-ignored; never commit it.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

`<confirm the exact variable names used in your Firebase config>`

## Demo walkthrough (about 90 seconds)

1. Normal state, everything green.
2. Run the legitimate fast-charge ramp: it stays **ALLOW**.
3. Inject the temperature freeze: Digital **VALID**, Physical **IMPLAUSIBLE**.
4. Open the twin chart: at high current the pack must warm, the sensor shows no rise.
5. Check localization (the temperature sensor) and the impact chain.
6. The response reaches **BLOCK**; open the "Why" panel.

## Limitations

- Data is simulated; no real vehicle or charger is connected.
- Digital checks (signature and authentication) are simulated policy checks, not real cryptography.
- A perfectly coordinated spoof can be hard to identify without a trusted reference.
- Limit and Block are recommendations; real enforcement belongs in an edge gateway or the BMS.

## Team

| Name | Role |
|---|---|
| `<name>` | `<role>` |
| `<name>` | `<role>` |

## License

See [LICENSE](./LICENSE).
