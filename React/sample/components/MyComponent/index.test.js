import { shallow } from 'enzyme';
import React from 'react';
import toJson from 'enzyme-to-json';
import { MyComponent } from '.';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const myComponent = shallow(<MyComponent />);
    expect(toJson(myComponent)).toMatchSnapshot();
  });
});
