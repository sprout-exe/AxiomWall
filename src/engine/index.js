// sample = { t, V, I, T, SoC, P, speed, digitalValid }
export function evaluate(sample, history = [], command = null) {
    return {
        risk: 0,
        response: 'ALLOW',
        reasons: [],
        localization: null,
        impact: null,
    }
}