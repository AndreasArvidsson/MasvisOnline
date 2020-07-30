
//import Graph from "owp.graph";
import Graph from "../../owp.graph/src/index";
import React from "react";
import PropTypes from "prop-types";

class GraphReact extends React.Component {

    static propTypes = {
        options: PropTypes.object.isRequired,
        spin: PropTypes.bool,
        highlight: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.ref = React.createRef();
        this.state = {
            options: props.options,
            spin: props.spin,
            highlight: props.highlight
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.options !== state.options
            || props.spin !== state.spin
            || props.highlight !== state.highlight) {
            return props;
        }
        return null;
    }

    componentDidMount() {
        this.graph = new Graph(this.ref.current, this.state.options);
        this.graph.spin(this.state.spin)
        if (this.state.highlight) {
            const h = this.state.highlight;
            this.graph.highlight(h.x1, h.y1, h.x2, h.y2, h.color);
        }
        else {
            this.graph.clearHighlight();
        }
    }

    componentDidUpdate() {
        if (this.graph) {
            this.graph.setOptions(this.state.options);
            this.graph.spin(this.state.spin)
        }
    }

    render() {
        return (
            <div
                ref={this.ref}
                style={{ width: "100%", height: "100%" }}
            />
        );
    }
}

export default GraphReact;