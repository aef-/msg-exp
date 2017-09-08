(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('prop-types')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react', 'prop-types'], factory) :
	(factory((global.message = {}),global.React,global.PropTypes));
}(this, (function (exports,React,PropTypes) { 'use strict';

var React__default = 'default' in React ? React['default'] : React;
PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

// messages
var isServer = typeof window === 'undefined';

var parse5 = isServer ? require('parse5') : null;

var TOKENIZER = /(\${[a-z0-9-]+})/gi;
// Can't use TOKENIZER regex to test due to quirk with global flag
// https://siderite.blogspot.com/2011/11/careful-when-reusing-javascript-regexp.html
var TOKEN_TESTER = /(\${[a-z0-9-]+})/i;
var HTML_TESTER = /<[a-z][\s\S]*>/i;

/*
 * Convert attributes of an element to a proper object.
 * @param {DOM.Node} el
 * @returns {object}
 */
function getElementAttrs(el) {
    if (el.attribs) {
        // Parse5 AST
        return el.attribs;
    } else if (el.attributes && el.attributes.length) {
        return [].slice.call(el.attributes).reduce(function (keys, attr) {
            keys[attr.name] = attr.value;
            return keys;
        }, {});
    }

    return {};
}

/*
 * @param {string} error
 * @param {object} options
 * @param {boolean} options.throwErrors
 * @returns {undefined}
 */
function handleError(error, _ref) {
    var throwErrors = _ref.throwErrors;

    if (throwErrors) {
        throw new Error(error);
    } else {
        console.error(error);
    }
}

/*
 * "Global values" are defined in `global-values.js` and are available to all messages.
 *  Values passed through `values` param will take precedent over them.
 *
 * @param {String} message String potentially with variables to be interpolated.
 * @param {Object} values Values whose key corresponds with the variables in `message`. Identified with the following syntax: `${variable}`
 * @param {Object} options
 * @return {[Any]} JSX.Node, String, Number, anything renderable by React may be passed as a value.
 */
function interpolateValues(message) {
    var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments[2];

    return message.split(TOKENIZER).map(function (token, i) {
        if (~token.indexOf('${')) {
            var key = token.substring(2, token.length - 1);
            var value = values[key];
            if (!value) {
                handleError('[cp-message-catalogue] Please provide value for ' + key, options);
            }
            return React__default.isValidElement(value) ? React__default.cloneElement(value, { key: i }) : value;
        }
        return token;
    });
}

/*
 * Takes a DOM tree and converts it to React Elements while interpolating variables in text.
 *
 * @param {DOM.Node|htmlparser2.Element} elem Tree to traverse
 * @param {Object} values Variables to be interpolated
 * @param {Object} options
 * @return {[String|JSX.Node]}
 */
function transformDOMToReact(elem, values, options) {
    return [].slice.call(elem.childNodes).map(function (child, i) {
        if (child.nodeType === 3) {
            // Node.TextNode
            return interpolateValues(child.nodeValue, values, options);
        } else if (child.nodeType === 1) {
            //Node.ElementNode
            var key = i; // Message will never change dynamically
            return React__default.createElement(child.nodeName || child.tagName, babelHelpers.extends({}, getElementAttrs(child), { key: key }), child.childNodes.length ? transformDOMToReact(child, values) : null);
        }

        throw new Error('[cp-message-catalogue] Unexpected node in message string.');
    });
}

/*
 * Takes a string and converts it to React Elements while interpolating variables in text.
 *
 * @param {DOM.Node} elem Tree to traverse
 * @param {Object} values Variables to be interpolated
 * @return {[String|JSX.Node]}
 */
function transformStringToReact(message, values, options) {
    var div = void 0;
    if (isServer) {
        // http://inikulin.github.io/parse5/modules/ast.htmlparser2.html
        div = parse5.parseFragment(message, { treeAdapter: parse5.treeAdapters.htmlparser2 });
    } else {
        div = document.createElement('div');
        div.innerHTML = message;
    }
    return transformDOMToReact(div, values, options);
}

/*
 * @param {String} id Identifier of message as defined in cp-message-catalogue
 * @param {Object} values
 * @param {Object} messages Messages whose keys equate to the ids
 * @param {Object} options
 * @param {Object} options.valuesOptional In some cases when message ids are auto-generated,
 *   we may pass values that aren't necessarily needed. If this is true we do not check
 *   for whether there are variables in a string when values are passed.
 * @param {Object} options.throwErrors Throw errors when message and values passed don't align, otherwise warn on console
 * @return {[String|JSX.Node]|String} Renderable through JSX
 */
var defaultOptions = { valuesOptional: false, throwErrors: false };
function getMessage(id, values, messages, options) {
    var opts = babelHelpers.extends({}, defaultOptions, options);
    var message = messages[id];

    if (!id) {
        handleError('[cp-message-catalogue] Please provide ID of needed message', opts);
        return null;
    } else if (!message) {
        handleError('[cp-message-catalogue] No message for id: ' + id, opts);
        return null;
    }

    var containsVariables = TOKEN_TESTER.test(message);
    var containsHTML = HTML_TESTER.test(message);
    if (!opts.valuesOptional && !containsVariables && values) {
        handleError('[cp-message-catalogue] Message variables do not match up for ' + id, opts);
        return null;
    } else if (!containsVariables && !values && !containsHTML) {
        return message;
    }

    try {
        if (containsHTML) {
            return transformStringToReact(message, values, opts);
        }
        return interpolateValues(message, values, opts);
    } catch (e) {
        handleError(e, opts);
        return null;
    }
}

var Message = function (_Component) {
    babelHelpers.inherits(Message, _Component);

    function Message() {
        babelHelpers.classCallCheck(this, Message);
        return babelHelpers.possibleConstructorReturn(this, (Message.__proto__ || Object.getPrototypeOf(Message)).apply(this, arguments));
    }

    babelHelpers.createClass(Message, [{
        key: 'shouldComponentUpdate',


        // perf optimization, messages are permanent when they are rendered
        value: function shouldComponentUpdate() {
            return false;
        }
    }, {
        key: 'render',
        value: function render() {
            var _props = this.props,
                id = _props.id,
                values = _props.values,
                messages = _props.messages,
                valuesOptional = _props.valuesOptional,
                parser = _props.parser,
                throwErrors = _props.throwErrors;
            // TODO It's possible to return arrays in React 16.

            return React__default.createElement(
                'span',
                null,
                getMessage(id, values, messages, { valuesOptional: valuesOptional, throwErrors: throwErrors })
            );
        }
    }]);
    return Message;
}(React.Component);
Message.propTypes = {
    id: PropTypes.string.isRequired,
    values: PropTypes.object,
    messages: PropTypes.object,
    valuesOptional: PropTypes.bool,
    throwErrors: PropTypes.bool
};

exports.getMessage = getMessage;
exports.Message = Message;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bundle.js.map
