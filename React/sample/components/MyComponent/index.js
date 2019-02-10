import React from 'react';
import awesomeHoc from '../../hocs/awesomeHoc';

class MyComponent extends React.Component {
  render() {
    return (
      <div>

      </div>
    );
  }
}

export { MyComponent };
export default awesomeHoc(MyComponent);
