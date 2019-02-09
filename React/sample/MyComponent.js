import React from 'react';
import awesomeHoc from './awesomeHoc';

class MyComponent extends React.Component {
  render() {
    return null;
  }
}

export { MyComponent };
export default awesomeHoc(MyComponent);
