import React from 'react';

const awesomeHoc = (WrappedComponent) => {
  class AwesomeComponent extends React.Component {
    render() {
      return <WrappedComponent compliment="I'm awesome" />;
    }
  }
  return AwesomeComponent;
};

export default awesomeHoc;