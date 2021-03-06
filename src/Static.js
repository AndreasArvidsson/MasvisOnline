
const Static = {};

Static.tickerLabelformatterTime = function (sampleRate, value, defaultFormatter) {
    return defaultFormatter(value / sampleRate);
};

Static.tickerValuePreFormatter = function (max, value) {
    return value / max;
};

Static.tickerValuePostFormatter = function (max, value) {
    return value * max;
};

Static.toDb = function (value, decimals) {
    if (decimals) {
        return Static.round(20 * log10(value), decimals);
    }
    return 20 * log10(value);
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

Static.getShortName = function (index) {
    if (namesShort >= namesShort.length) {
        return "Ch" + index;
    }
    return namesShort[index];
};

Static.getTitle = function (title) {
    return {
        label: title,
        align: "left",
        size: 17,
        padding: 0
    }
}

Static.getBorder = function () {
    return {
        width: "1px"
    };
}

export default Static;

const log10 = (x) => Math.log(x) / Math.LN10;

const colors = ["#000000", "#0000FF", "#FF0000", "#800080", "#00FF00", "#8080FF", "#FF8080", "#FF00FF", "#00FFFF"];
const names = ["Time(S)", "Left", "Right", "Center", "LFE", "Surr left", "Surr right", "Surr back left", "Surr back right"];
const namesShort = ["S", "L", "R", "C", "LFE", "SL", "SR", "SBL", "SBR"];