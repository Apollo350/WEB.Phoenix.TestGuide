# Snapshots

Snapshot are automatically generated, and are a good sanity check when you change components. Snapshot tests look like this:

```javascript
// MyComponent/index.test.js
import { shallow } from 'enzyme';
import React from 'react';
import toJson from 'enzyme-to-json';
import { MyComponent } from '.';
import mockData from './__mocks__/data';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const myComponent = shallow(
      <MyComponent data={mockData} />
    );
    expect(toJson(myComponent)).toMatchSnapshot();
  });
});
```

A `__mocks__` folder can hold props data for your component. `__snapshots__` has the generated `snap` files. And the test above lives in `index.test.js`.

---
* 📁components
  * 📁MyComponent
    * 📁\_\_mocks__
      * data.js
    * 📁\_\_snapshots__
      * index.test.js.snap
    * index.js
    * index.test.js
---

If you're using Visual Studio Code, you can use the following plugin to rebuild snapshots when tests fail:
https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest

## References
* https://jestjs.io/docs/en/snapshot-testing