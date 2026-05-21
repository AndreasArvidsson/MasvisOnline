/** @type {import('stylelint').Config} */
const config = {
    extends: ["stylelint-config-standard"],
    rules: {
        "at-rule-empty-line-before": null,
        "comment-empty-line-before": null,
        "shorthand-property-no-redundant-values": null,
    },
};

// oxlint-disable-next-line import/no-default-export
export default config;
