import awesomeHoc from './awesomeHoc';
import { shallow } from 'enzyme';
import React from 'react';

describe('awesomeHoc()', () => {
  it('adds compliment prop', () => {
    const MyComponent = () => {};
    const AwesomeComponent = awesomeHoc(MyComponent);
    const awesomeComponent = shallow(<AwesomeComponent />);
    expect(awesomeComponent.prop('compliment')).toEqual('I\'m awesome');
  });
});
