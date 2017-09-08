(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('prop-types')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react', 'prop-types'], factory) :
	(factory((global.message = {}),global.React,global.PropTypes));
}(this, (function (exports,React,PropTypes) { 'use strict';

var React__default = 'default' in React ? React['default'] : React;
PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

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
            return React__default.createElement(child.nodeName || child.tagName, _extends({}, getElementAttrs(child), { key: key }), child.childNodes.length ? transformDOMToReact(child, values) : null);
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
    var opts = _extends({}, defaultOptions, options);
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
    inherits(Message, _Component);

    function Message() {
        classCallCheck(this, Message);
        return possibleConstructorReturn(this, (Message.__proto__ || Object.getPrototypeOf(Message)).apply(this, arguments));
    }

    createClass(Message, [{
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
