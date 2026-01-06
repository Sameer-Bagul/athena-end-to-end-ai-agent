import { VRM } from "@pixiv/three-vrm";

export function startBlinking(vrm: VRM) {
    let blinking = true;

    async function blinkLoop() {
        while (blinking) {
            if (!vrm.expressionManager) return;

            // wait random time (2.5s – 6s)
            const wait = 2500 + Math.random() * 3500;
            await new Promise(r => setTimeout(r, wait));

            if (!blinking) break;

            // blink down
            await animateBlink(vrm, 1, 80);

            // blink up
            await animateBlink(vrm, 0, 120);

            // rare double blink
            if (Math.random() < 0.15) {
                if (!blinking) break;
                await new Promise(r => setTimeout(r, 50)); // tiny pause
                await animateBlink(vrm, 1, 70);
                await animateBlink(vrm, 0, 120);
            }
        }
    }

    blinkLoop();

    return () => {
        blinking = false;
    };
}

async function animateBlink(vrm: VRM, value: number, duration: number) {
    const step = 10; // ms per step
    const steps = duration / step;
    const startValue = vrm.expressionManager?.getValue("blink") || 0;
    const delta = value - startValue;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps; // 0 to 1
        // Ease out quad ?? or linear. Code implies linear-ish but we can just lerp.
        const current = startValue + delta * t;

        vrm.expressionManager?.setValue("blink", current);
        vrm.expressionManager?.update(); // Force update if needed, though usually main loop handles it. 
        // Actually expressionManager.update() is usually called in vrm.update(). 
        // But setting value is synchronous.

        await new Promise(r => setTimeout(r, step));
    }
}
