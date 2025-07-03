let animationFrameId = null;

function loop(callback, lastTime) {
    const currentTime = performance.now();
    const tick = currentTime - lastTime;
    callback(tick);
    animationFrameId = requestAnimationFrame(() => loop(callback, currentTime));
}

export function start(callback) {
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => loop(callback, performance.now()));
    }
}

export function stop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}
