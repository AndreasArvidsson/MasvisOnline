
const Static = {};

Static.legendformatterTime = function (sampleRate, value) {
    return Static.round(value / sampleRate, 5) + "s";
};

Static.legendformatterAmplitude = function (value) {
    return Static.round(value, 5);
};

Static.tickerLabelformatterTime = function (sampleRate, value) {
    return Static.round(value / sampleRate, 3);
};

Static.tickerValuePreFormatter = function (max, value) {
    return value / max;
};

Static.tickerValuePostFormatter = function (max, value) {
    return value * max;
};

Static.tickerAmplitude = function (isLog, min, max) {
    function format(value) {
        return Static.round(value, 2);
    }
    const range = max - min;
    return [
        { value: min, label: format(min) },
        { value: min + range * 0.25, label: format(min + range * 0.25) },
        { value: min + range * 0.5, label: format(min + range * 0.5) },
        { value: min + range * 0.75, label: format(min + range * 0.75) },
        { value: max, label: format(max) }
    ];
};

Static.toDb = function (value) {
    if (value === 0) {
        return 0;
    }
    value = 20 * (Static.log10(value));
    return toFixed2(value);
};

Static.round = function (value, decimals) {
    const multiplier = Math.pow(10, decimals);
    return (Math.round(value * multiplier) / multiplier);
};

Static.getColor = function (index) {
    if (index >= colors.length) {
        return "#000000";
    }
    return colors[index];
};

Static.getName = function (index) {
    if (index >= names.length) {
        return "Ch" + index;
    }
    return names[index];
};

Static.log10 = (x) => Math.log(x) / Math.LN10;

export default Static;

function toFixed2(val) {
    val = val.toFixed(2);
    return val !== "-0.00" ? val : "0.00";
}

const colors = ["#000000", "#0000FF", "#FF0000", "#800080", "#00FF00", "#8080FF", "#FF8080", "#FF00FF", "#00FFFF"];
const names = ["Time(S)", "Left", "Right", "Center", "LFE", "Surr left", "Surr right", "unknown", "unknown"];