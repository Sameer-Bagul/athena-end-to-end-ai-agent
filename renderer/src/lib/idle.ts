import * as THREE from "three";

const idleTarget = new THREE.Vector3(0, 0, 1);

export function startIdle(emit: (v: THREE.Vector3) => void) {
    let active = true;

    async function loop() {
        while (active) {
            // Random wait 1.2s - 2.4s
            await new Promise(r => setTimeout(r, 1200 + Math.random() * 1200));

            if (!active) break;

            // very subtle motion
            // Assuming 0,0 is center screen/forward
            idleTarget.x = (Math.random() - 0.5) * 0.5; // Increased range slightly
            idleTarget.y = (Math.random() - 0.5) * 0.2;
            idleTarget.z = 1.0; // Look generally forward

            emit(idleTarget);
        }
    }

    loop();

    return () => {
        active = false;
    };
}
