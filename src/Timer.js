const times = {};

const Timer = {
    start: name => {
        times[name] = performance.now();
    },
    stop: name => {
        const t1 = performance.now();
        const t0 = times[name];
        if (t0 === undefined) {
            console.warn(`Timer "${name}" doesn’t exist`);
        }
        delete times[name];
        console.debug(`${name}: ${t1 - t0} ms`);
    }
};

export default Timer;