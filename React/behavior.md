# Behavior Tests
You can use [enzyme](https://airbnb.io/enzyme/) for rich tests against your components. You should have tests if your component:

* **Transforms data** - Your component filters or transforms data before rendering
* **Has interactivity** - Has interactive elements like buttons and inputs

```javascript
// SantasList/index.js
import NiceSection from './NiceSection';
import NaughtySection from './NaughtySection';

class SantasList extends React.Component {
  static propTypes = {
    children: PropTypes.arrayOf(
      PropTypes.shape({
        naughty: PropTypes.bool,
        name: PropTypes.string
      })
    ),
    onListChange: PropTypes.func
  }
  constructor(props) {
    super(props);
    this.toggleNaughty = this.toggleNaughty.bind(this);
  }

  // This is logic we want to test!
  toggleNaughty(evt) {
    const { child } = evt;
    const { naughty, name } = child;
    const newList = this.props.children.slice();
    const index = newList
      .findIndex((c) => c.name === name);
    newList[index] = {
      naughty: !naughty,
      name
    }
    this.props.onListChange({ list: newList });
  }

  render() {
    const { children } = this.props;
    // We split the list between naughty and nice
    // This looks like something we should test
    const naughtyChildren =
      children.filter((c) => c.naughty);
    const niceChildren =
      children.filter((c) => !c.naughty);
    <div>
      <NaughtySection
        children={naughtyChildren}
        onToggle={this.toggleNaughty} />
      <NiceSection
        children={niceChildren}
        onToggle={this.toggleNaughty} />
    </div>
  }
}
```
Looking at `SantasList`, it looks children can be toggled from naughty to nice and vice versa. We should test this. This component also renders two sections, for naughty and nice, respectively. We should test this, too.

First we need mock data:
```javascript
// SantasList/__mocks__/children.js
export default [
  { naughty: true, name: 'Mary' },
  { naughty: false, name: 'Bob' },
  { naughty: true, name: 'Larry' },
  { naughty: false, name: 'Samus' },
  { naughty: true, name: 'Nicole' }
];
```

Then we can write our tests:
```javascript
// SantasList/index.test.js
import { shallow } from 'enzyme';
import React from 'react';
import toJson from 'enzyme-to-json';
import mockChildren from './__mocks__/children';
import SantasList from '.';
import NiceSection from './NiceSection';
import NaughtySection from './NaughtySection';

describe('SantasList', () => {
  it('renders correctly', () => {
    const santasList = shallow(
      <SantasList children={mockChildren} onListChange={() => {}} />
    );
    expect(toJson(santasList)).toMatchSnapshot();
  });

  // Tests the behavior using simulate()
  // https://airbnb.io/enzyme/docs/api/ShallowWrapper/simulate.html
  it('toggles children', () => {
    const mockListChange = jest.fn();
    const mary = { naughty: true, name: 'Mary' };
    const bob = { naughty: false, name: 'Bob' };
    const shortChildrenList = [mary, bob];
    const santasList = shallow(
      <SantasList children={shortChildrenList} onListChange={mockListChange} />
    );
    santasList.find(NaughtySection).simulate('toggle', { child: mary });
    expect(mockListChange).toBeCalledWith([
      { naughty: false, name: 'Mary' }, // Mary got moved off the naught list
      bob
    ])
  });

  // Test it renders the right thing
  it('has NaughtySection and NiceSection', () => {
    const santasList = shallow(
      <SantasList children={mockChildren} onListChange={() => {}} />
    );
    // Naughty!
    const naughty = santasList.find(NaughtySection);
    // There's only one NaughtySection component
    expect(naughty.length).toEqual(1);
    // Mock data has 3 naughty children
    expect(naughty.props('children').length).toEqual(3);
    // Nice!
    const nice = santasList.find(NiceSection);
    // There's only one NiceSection component
    expect(nice.length).toEqual(1);
    // Mock data has 2 nice children
    expect(nice.props('children').length).toEqual(2);
  });
})
```