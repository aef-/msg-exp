import React, {Component} from 'react';
import PropTypes from 'prop-types';

// messages
const isServer = typeof window === 'undefined';

const parse5 = isServer ? require('parse5') : null;

const TOKENIZER = /(\${[a-z0-9-]+})/gi;
// Can't use TOKENIZER regex to test due to quirk with global flag
// https://siderite.blogspot.com/2011/11/careful-when-reusing-javascript-regexp.html
const TOKEN_TESTER = /(\${[a-z0-9-]+})/i;
const HTML_TESTER = /<[a-z][\s\S]*>/i;

/*
 * Convert attributes of an element to a proper object.
 * @param {DOM.Node} el
 * @returns {object}
 */
function getElementAttrs(el) {
    if (el.attribs) { // Parse5 AST
        return el.attribs;
    } else if (el.attributes && el.attributes.length) {
        return [].slice.call(el.attributes).reduce((keys, attr) => {
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
function handleError(error, {throwErrors}) {
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
function interpolateValues(message, values = {}, options) {
    return message.split(TOKENIZER)
                  .map((token, i) => {
                      if (~token.indexOf('${')) {
                          const key = token.substring(2, token.length - 1);
                          const value = values[key];
                          if (!value) {
                              handleError(`[cp-message-catalogue] Please provide value for ${key}`, options);
                          }
                          return React.isValidElement(value) ? React.cloneElement(value, {key: i}) : value;
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
    return [].slice.call(elem.childNodes).map((child, i) => {
        if (child.nodeType === 3) { // Node.TextNode
            return interpolateValues(child.nodeValue, values, options);
        } else if (child.nodeType === 1) { //Node.ElementNode
            const key = i; // Message will never change dynamically
            return React.createElement(
                child.nodeName || child.tagName,
                {...(getElementAttrs(child)), key},
                child.childNodes.length ? transformDOMToReact(child, values) : null
            );
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
    let div;
    if (isServer) {
        // http://inikulin.github.io/parse5/modules/ast.htmlparser2.html
        div = parse5.parseFragment(message, {treeAdapter: parse5.treeAdapters.htmlparser2});
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
const defaultOptions = {valuesOptional: false, throwErrors: false};
export function getMessage(id, values, messages, options) {
    const opts = {...defaultOptions, ...options};
    const message = messages[id];

    if (!id) {
        handleError('[cp-message-catalogue] Please provide ID of needed message', opts);
        return null;
    } else if (!message) {
        handleError(`[cp-message-catalogue] No message for id: ${id}`, opts);
        return null;
    }

    const containsVariables = TOKEN_TESTER.test(message);
    const containsHTML = HTML_TESTER.test(message);
    if (!opts.valuesOptional && !containsVariables && values) {
        handleError(`[cp-message-catalogue] Message variables do not match up for ${id}`, opts);
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

export class Message extends Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        values: PropTypes.object,
        messages: PropTypes.object,
        valuesOptional: PropTypes.bool,
        throwErrors: PropTypes.bool
    };

    // perf optimization, messages are permanent when they are rendered
    shouldComponentUpdate() {
        return false;
    }

    render() {
        const {id, values, messages, valuesOptional, parser, throwErrors} = this.props;
        // TODO It's possible to return arrays in React 16.
        return <span>{getMessage(id, values, messages, {valuesOptional, throwErrors})}</span>;
    }
}
