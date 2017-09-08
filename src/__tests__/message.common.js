import React from 'react';
import {Message, getMessage} from '../';
import {shallow} from 'enzyme';
describe('Message Component', () => {

    it('should return message without processing', () => {
        const message = 'This is a test message.';
        expect(getMessage('some-id', null, {'some-id': message})).toBe(message);
    });

    it('should return message with iterpolated values', () => {
        const message = 'This is a ${foo} ${fooWith4Numbers1234-1} message.';
        const evaluatedMessage = 'This is a bar 1234 message.';

        expect(
            getMessage('some-id', {foo: 'bar', 'fooWith4Numbers1234-1': 1234}, {'some-id': message}).join('')
        ).toBe(evaluatedMessage);
    });


    it('should return React tree when HTML is passed', () => {
        const message = 'This is a <strong id="strong-id" data-attr="1">a very ${foo}</strong> message.';
        const instance = shallow(
            <Message id="some-id"
                     values={{foo: 'STRONG!!'}}
                     messages={{'some-id': message}}
            />);
        expect(instance).toMatchSnapshot();
        expect(instance.find('#strong-id').length).toBe(1);
    });

    it('should correctly parse message with HTML tags and no variables', () => {
        const message = 'This is a message <a href="test"><strong id="test-id">test</strong></a>!';

        const instance = shallow(
            <Message id="some-id" messages={{'some-id': message}} />
        );

        expect(instance).toMatchSnapshot();
        expect(instance.find('#test-id').length).toBe(1);
    });

    it('should print error if id is missing', () => {
        const message = 'This is a ${foo} message.';

        expect(
            () => getMessage(null, {foo: 'bar'}, {'some-id': message}, {throwErrors: true})
        ).toThrow('[cp-message-catalogue] Please provide ID of needed message');
    });

    it('should print error if message is missing', () => {
        const message = 'This is a ${foo} message.';

        expect(
            () => getMessage('some-id', {foo: 'bar'}, {'diff-id': message}, {throwErrors: true})
        ).toThrow('[cp-message-catalogue] No message for id: some-id');
    });

    it('should print error if variable expected and values is undefined', () => {
        const message = 'This is a ${foo} message.';

        /* eslint-disable no-undefined */
        expect(
            () => getMessage('some-id', undefined, {'some-id': message}, {throwErrors: true})
        ).toThrow('[cp-message-catalogue] Please provide value for foo');
        /* eslint-enable no-undefined */
    });

    it('should print error if variable expected doesn\'t exist in properties', () => {
        const message = 'This is a message ${foo}!';

        expect(
            () => getMessage('some-id', {variables: 1}, {'some-id': message}, {throwErrors: true})
        ).toThrow('[cp-message-catalogue] Please provide value for foo');
    });

    it('should print error if values are passed but no variables are expected in the message', () => {
        const message = 'This is a message without variables!';

        expect(
            () => getMessage('some-id', {variables: 1}, {'some-id': message}, {throwErrors: true})
        ).toThrow('[cp-message-catalogue] Message variables do not match up for some-id');
    });


    it('should not print error if valuesOptional is true even if values and variables mismatch', () => {
        const message = 'This is a message without variables!';

        expect(
            () => getMessage('some-id', {variables: 1}, {'some-id': message}, {valuesOptional: true, throwErrors: true})
        ).not.toThrow('[cp-message-catalogue] Message variables do not match up for some-id');
    });
});

