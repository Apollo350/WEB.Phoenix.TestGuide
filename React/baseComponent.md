## Test your base component only
The goal of your unit test is to isolate the logic within your component and focus on testing that. It's tempting to invoke and test dependencies here. Avoid doing that, because that's a job for integration tests.

Specifically, don't test HOCs that wrap your component. Instead, export your base component and pass in props in your test.

The example component below uses Apollo's `graphql()` and Redux's `connect()` HOC functions. Since we don't want to test that, we isolate our tests to the base React component, and the `mapStateToProps` function.

```javascript
// MyComponent.js
// ...
class MyComponent extends React.Component {
  // ...
}

const mapStateToProps = (state) => {
  const { stateProp } = state;
  return { mappedProp: stateProp };
};

// Export the things you want to test
export { MyComponent };
export { mapStateToProps };

// Build your default export with HOCs
// You won't directly test these
const MyComponentWithQuery =
  graphql(query)(MyComponent);
export default connect(
  mapStateToProps,
  MyComponentWithQuery
);
```

```javascript
// MyComponent.test.js
import { MyComponent, mapStateToProps } from './MyComponent';
describe('MyComponent', () => {
  it('does something', () => {
    // ...
    const mc = shallow(<MyComponent
      // Pass in HOC props to component
      mappedProp={myReduxState} // from connect()
      data={mockGqlData} // from graphql()
      otherProps={}
    />);
    // Make assertions:
    // expect(...) ...
  });
  it('mapStateToProps() maps state', () => {
    const mockState = {
      stateProp: 'value'
    };
    const expectedProps = {
      mappedProp: 'value'
    };
    expect(mapStateToProps(mockState))
      .toEqual(expectedProps);
  });
});
```
