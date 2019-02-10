# Composite simpler components
Components that have a lot of logic are difficult to test and are difficult to reason with. If your component gets really big, break them down into smaller components, and composite them. This also potentially creates opportunities for component re-use.

We'll examine some common refactoring patterns.

## Pattern 1: Divergent conditional blocks in render()
When you have conditional variations where there is substantial DOM or logic in each condition, you should keep the base component, and refactor each condition into a separate component.


```javascript
render() {
  if (conditionA) {
    // Complex Variation A
  }
  if (conditionB) {
    // Complex Variation B
  }
}
```
Example:
In this example, we will refactor `MyComplexComponent` into 3 components.

```javascript
class MyComplexComponent extends React.Component {
  static propTypes = {
    variation: PropTypes.string.isRequired,
    onValueSelect: PropTypes.func.isRequired
  };

  constructor(prop) {
    super(props);
    this.state = {
      textValue: ''
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleTextSubmit = this.handleTextSubmit.bind(this);
  }

  handleButtonClick(evt) {
    const { value } = evt;
    this.props.onValueSelect({ value });
  }

  handleTextChange(evt) {
    const textValue = evt.target.value;
    this.setState({
      textValue
    });
  }

  handleTextSubmit(evt) {
    const { textValue: value } = this.state;
    this.props.onValueSelect({ value });
  }

  render() {
    const { variation } = this.props;
    if (variation === 'threeButtons') {
      const buttons = ['A', 'B', 'C'];
      return (
        <div>
          {buttons.map((value) => (
            <button
              key={value}
              onClick={() => { this.handleButtonClick({ value })}} >
              {value}
            </button>
          ))}
        </div>
      );
    }
    if (variation === 'textButtonCombo') {
      return (
        <div>
          <textarea
            onChange={this.handleTextChange}
            value={this.state.textValue}
          />
          <button onClick={this.handleTextSubmit} />
        </div>
      );
    }
    return null;
  }
}
```
Let's analyze the code. We have 3 handlers, and our `render()` function has 2 code paths, depending on the `variation` prop being passed into the component. Each variation contains form elements which invoke the handlers. This can grow out of hand very quickly if we add one or two more variations. This is a very good candidate for refactoring, because the DOM is very different for each code path.

Let's start by isolating each if branch into a component. We'll create `ThreeButtons` and `TextButtonCombo`.

```javascript
class ThreeButtons extends React.Component {
  static propTypes = {
    onValueSelect: PropTypes.func.isRequired
  };

  constructor(prop) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(evt) {
    const { value } = evt;
    this.props.onValueSelect({ value });
  }

  render() {
    const buttons = ['A', 'B', 'C'];
    return (
      <div>
        {buttons.map((value) => (
          <button
            key={value}
            onClick={() => { this.handleClick({ value })}} >
            {value}
          </button>
        ))}
      </div>
    );
  }
}
```

```javascript
class TextButtonCombo extends React.Component {
  static propTypes = {
    onValueSelect: PropTypes.func.isRequired
  };

  constructor(prop) {
    super(props);
    this.state = {
      textValue: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    const textValue = evt.target.value;
    this.setState({
      textValue
    });
  }

  handleSubmit(evt) {
    const { textValue: value } = this.state;
    this.props.onValueSelect({ value });
  }

  render() {
    return (
      <div>
        <textarea
          onChange={this.handleTextChange}
          value={this.state.textValue}
        />
        <button onClick={this.handleTextSubmit} />
      </div>
    );
  }
}
```

The individual components become much easier to reason with. Next let's put it all together. We'll rename `MyComplexComponent` to `MyCompositedComponent`.

```javascript
import ThreeButtons from './ThreeButtonCombo';
import TextAndButtonCombo from './TextAndButtonCombo';

class MyCompositedComponent extends React.Component {
  static propTypes = {
    variation: PropTypes.string.isRequired,
    onValueSelect: PropTypes.func.isRequired
  };

  render() {
    const { variation } = this.props;
    if (variation === 'threeButtons') {
      return(
        <ThreeButtons
          onValueSelect={this.props.onValueSelect}
        />
      );
    }
    if (variation === 'textButtonCombo') {
      return (
        <TextButtonCombo
          onValueSelect={this.props.onValueSelect}
        />
      );
    }
    return null;
  }
}
```

## Pattern 2: Sub-render() function
Sometimes in a component's `render()` statement, sub-render() functions are called. This is usually because there needs to be additional data manipulation or conditional code that is too awkward to put in JSX. When you find this happening, it is often a good idea to create a sub-component, instead.

```javascript
subRender() {
  // Complex Render Logic
}
render() {
  return (
    <div>
      {/* JSX */}
      {this.subRender()}
      {/* JSX */}
    </div>
  );
}
```
The result would match this:

```javascript
render() {
  return (
    <div>
      {/* JSX */}
      <SubComponent props={props} />
      {/* JSX */}
    </div>
  );
}
```