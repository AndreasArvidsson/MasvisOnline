const times: Record<string, number | undefined> = {};

export const Timer = {
    start: (name: string): void => {
        times[name] = performance.now();
    },
    stop: (name: string): void => {
        const t1 = performance.now();
        const t0 = times[name];
        if (t0 == null) {
            console.warn(`Timer "${name}" doesn't exist`);
            return;
        }
        delete times[name];
        console.debug(`${name}: ${t1 - t0} ms`);
    },
};
