# Extract business logic
Your components should be focused around presentation and UI, and not doing too much more. This [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) makes your components:

* Easier to understand
* More re-useable
* More testable

Your component should:

* Handle user actions, such as clicks
* Do some simple data manipulation

Your component should *not*:

* Make network calls directly
* Handle JavaScript callbacks (instead, it  should respond to prop changes)
* Have very complicated logic in handlers
* Handle complicated data transformation

## Example
We want a component that makes an asynchronous GraphQL call to fetch related content.

```javascript
// RecommendedContent/index.js
import getRecommendationsQuery from '../../queries/getRecommendationsQuery';
import ErrorView from '../ErrorView';
import PreLoader from '../PreLoader';
import Thumbnail from '../Thumbnail';

const DEFAULT_STATE = {
  recommendations: [],
  loading: false,
  error: false
};

class RecommendedContent extends React.Component {
  static propTypes = {
    seedContent: PropTypes.object,
    gqlClient: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = DEFAULT_STATE;
  }

  componentDidMount() {
    loadRecommendations();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.seedContent.id !==
      this.props.seedContent.id
    ) {
      loadRecommendations();
    }
  }

  loadRecommendations() {
    if (!this.props.seedContent) {
      this.setState(DEFAULT_STATE);
    }

    // Make GraphQL call
    const { gqlClient, seedContent }  = this.props;
    // Start loading
    this.setState({ loading: true });
    return gqlClient.query({
      query: getRecommendationsQuery,
      variables: {
        id: seedContent.id
      },
      fetchPolicy: 'network-only'
    // Success!
    }).then((results) => {
      this.setState({
        loading: false,
        error: false,
        recommendations: results.data.getRecommendations
      });
    // Failure!
    }).catch(() => {
      this.setState({
        loading: false,
        error: true
      });
    });
  }

  render() {
    const { recommendations, loading, error } = this.state;
    if (error) {
      return <ErrorView />;
    }
    if (loading) {
      return <PreLoader />;
    }
    return (
      <div>
        Recommendations
        {recommendations.map((rec) => (
          <Thumbnail content={rec} />
        ))}
      </div>
    );
  }
}
```
Why does this make it difficult to test? It's possible to mock `gqlClient`. Let's write one test and see.

```javascript
// RecommendedContent/index.test.js
import RecommendedContent from  '.';
import { shallow } from 'enzyme';
import React from 'react';

describe('RecommendedContent', () => {
  it('can fetch data', () => {
    const mockGqlClient = {
      query: jest.fn().mockResolvedValue({
        data: {
          getRecommendations: [
            { id: '123' },
            { id: '456' }
          ]
        }
      })
    };
    const seedContent = {
      id: '789'
    };
    shallow(
      <RecommendedContent
        seedContent={seedContent}
        gqlClient={mockGqlClient}
      />
    );
    expect(mockGqlClient.query).toBeCalledWith({
      query: expect.any(object),
      variables: {
        id: seedContent.id
      },
      fetchPolicy: 'network-only'
    });
  });
});
```
We see some things happening:
* It's taking a lot of effort to mock `gqlClient`.
* We're writing tests that's not related to UI interactions or rendering, which is what components should be focusing on.
* We can't test intermediate states where `{ loading: true }`, because `mockGqlClient.query()` returns immediately, and if we add a delay, it would slow down the tests and add a race conditions.
* The implementation and test are both very verbose. In this simple example, it may still be manageable, but monolithic components become harder to evolve as they grow.

This is all because the business logic is not properly abstracted in my component.

Let's refactor this! Our component should not interact with the `gqlClient` directly. We'll take that logic out and put it in a generic `utility`. Because loading the recommendations is asynchronous, and the loading state and data will change over time, we will use [Redux Thunk action creator](https://github.com/reduxjs/redux-thunk) and a Redux reducer to manage state. And we'll be able to test each piece in isolation!

In total we're creating 4 implementation files, and corresponding tests. Its a lot more files, but each file will be much more maintainable! And it opens the door up for potential re-use.

First let's put our GraphQL code in a `utility`. This function is React agnostic, and can be re-used for any purpose.

```javascript
// utility/getRecommendations.js
import getRecommendationsQuery from '../queries/getRecommendationsQuery';

const getRecommendations = (gqlClient, seedContentId) => {
  return gqlClient.query({
    query: getRecommendationsQuery,
    variables: {
      id: seedContentId
    },
    fetchPolicy: 'network-only'
  }).then((results) => {
    return results.data.getRecommendations;
  });
}
export default getRecommendations;
```

Next we test the query is well-formed, and returns the data we expect. The test is still verbose, but we are now testing the fetching logic directly and not indirectly through a component.

```javascript
// utility/getRecommendations.test.js
import getRecommendations from './getRecommendations';
import getRecommendationsQuery from '../queries/getRecommendationsQuery';

describe('getRecommendations()', () => {
  it('builds the correct query', () => {
    const recs = [
      { id: '123' },
      { id: '456' }
    ];
    const mockGqlClient = {
      query: jest.fn().mockResolvedValue({
        data: {
          getRecommendations: recs
        }
      })
    };
    // Need to specify how many assertions for
    // async tests
    expect.assertions(2);
    return getRecommendations(mockGqlClient, '111')
      .then((results) => {
        // Check query is well formed
        expect(mockGqlClient.query)
          .toBeCalledWith({
            query: getRecommendationsQuery,
            variables: { id: '111' },
            fetchPolicy: 'network-only'
          });
        // Check correct data is returned
        expect(results).toEqual(recs);
      });
  });
});
```

Fetching data is async. It can take time, and it can error out. We want to maintain state of where we are in the data fetching lifecycle. But we don't want to do this inside the component. We can do it with a [Thunk aciton creator](https://github.com/reduxjs/redux-thunk).

Let's create our action creators. It will import our `getRecommendations` utility.

```javascript
// actions/getRecommendations.js
import { getRecommendations } from '../utilities/getRecommendations';

export const GET_RECOMMENDATION_ACTIONS = {
  SET_LOADING_STATUS: 'SET_LOADING_STATUS',
  SET_RECOMMENDATIONS: 'SET_RECOMMENDATIONS',
}

// Note: the following action creators are not exported.
// Components should not be setting loading state, because
// the full lifecycle of this fetch is handled by Thunk
function setLoadingStatus(seedId, loading, error) {
  return {
    type: GET_RECOMMENDATION_ACTIONS.SET_LOADING_STATUS,
    seedId,
    loading,
    error
  }
};
function setRecommendations(seedId, recommendations) {
  return {
    type: GET_RECOMMENDATION_ACTIONS.SET_RECOMMENDATIONS,
    seedId,
    recommendations
  }
}

// This is a Thunk action creator that handles all the
// loading states for recommendations
export function getRecommendations(
  gqlClient,
  seedId,
  dependency: { getRecs: getRecommendations }
) {
  return (dispatch) => {
    // Start loading
    dispatch(setLoadingStatus(seedContentId, true, false));
    return dependency.getRecs(gqlClient, seedContentId)
      .then((recommendations) => {
        // Loading successfully completed
        dispatch(setLoadingStatus(seedContentId, false, false));
        // Setting the recommendations
        dispatch(setRecommendations(seedContentId, recommendations));
      }).catch((error) => {
        // Loading failed
        dispatch(setLoadingStatus(seedContentId, false, true));
      });
  };
}
```

If the fetching logic was embedded inside your component, it would be very difficult to test the full loading lifecycle. There'd be no chain of actions. But with Thunk, we can now test the behavior more precisely. And because we made a utility to actually perform the fetching, our action creator tests are primarily testing our state management. Our tests for the action creators will cover the success and the error paths:

```javascript
// actions/getRecommendations.test.js
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getRecommendations, GET_RECOMMENDATION_ACTIONS } from './getRecommendations';

// Set up mock middleware and store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('async getRecommendations() action', () =>{
  it('creates actions, and stores recommendations', () => {
    const recArray = [1,2,3,4].map((id) => ({ id }));
    const mockGetRecs = jest.fn().mockReturnValue(Promise.resolve(recArray));
    const seedId = '123';
    const gqlClient = {};
    // The expected actions to receive.
    const expectedActions = [
      {
        type: GET_RECOMMENDATION_ACTIONS.SET_LOADING_STATUS,
        seedId,
        loading: true,
        error: false
      },
      {
        type: GET_RECOMMENDATION_ACTIONS.SET_LOADING_STATUS,
        seedId,
        loading: false,
        error: false
      },
      {
        type: GET_RECOMMENDATION_ACTIONS.SET_RECOMMENDATIONS,
        seedId,
        recommendations: recArray
      }
    ];
    const store = mockStore({});
    expect.assertions(2);
    return store.dispatch(getRecommendations(
      gqlClient,
      seedId,
      { getRecs: mockGetRecs }
    )).then(() => {
      expect(mockGetRecs).toBeCalledWith(
        gqlClient,
        seedId
      );
      const actions = store.getActions();
      expect(actions).toEqual(expectedActions);
    });
  });
  it('sets error to true if something goes wrong', () => {
    const error = new Error('an error')
    const mockGetRecs = jest.fn().mockReturnValue(Promise.reject(error));
    const seedId = '123';
    const gqlClient = {};
    // The expected actions to receive.
    const expectedActions = [
      {
        type: GET_RECOMMENDATION_ACTIONS.SET_LOADING_STATUS,
        seedId,
        loading: true,
        error: false
      },
      {
        type: GET_RECOMMENDATION_ACTIONS.SET_LOADING_STATUS,
        seedId,
        loading: false,
        error: true
      }
    ];
    const store = mockStore({});
    expect.assertions(1);
    return store.dispatch(getRecommendations(
      gqlClient,
      seedId,
      { getRecs: mockGetRecs }
    )).then(() => {
      const actions = store.getActions();
      expect(actions).toEqual(expectedActions);
    });
  });
})
```

TODO: Add reducer and reducer test. Skipping for now, its pretty straightforward.

Finally, that brings us back to our original component! Let's put it all together.

```javascript
// components/RecommendedContent/index.js
import getRecommendations from '../../actions/getRecommendations.js';
import ErrorView from '../ErrorView';
import PreLoader from '../PreLoader';
import Thumbnail from '../Thumbnail';

class RecommendedContent extends React.Component {
  static propTypes = {
    seedContent: PropTypes.object,
    gqlClient: PropTypes.object,
    // This component is now stateless.
    // The following props used to be from state:
    recommendations: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.bool
    // This is the action dispatch
    getRecommendations: PropTypes.func
  }

  componentDidMount() {
    this.getRecs();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.seedContent.id !==
      this.props.seedContent.id
    ) {
      this.getRecs();
    }
  }

  getRecs() {
    const { getRecommendations, gqlClient, seedContent } = this.props;
    getRecommendations(gqlClient, seedContent.id);
  }

  render() {
    const { recommendations, loading, error } = this.props;
    if (error) {
      return <ErrorView />;
    }
    if (loading) {
      return <PreLoader />;
    }
    return (
      <div>
        Recommendations
        {recommendations.map((rec) => (
          <Thumbnail content={rec} />
        ))}
      </div>
    );
  }
}

const mapDispatchToProps = {
  getRecommendations
};
// We can optionally test this, if there's
// nontrivial business logic
const mapStateToProps = (state) => {
  // ...
};

// We test this component:
export { RecommendedContent };
// We don't test the wired-up component:
export default connect(mapStateToProps, mapDispatchToProps)(RecommendedContent);
```

Finally, let's write our component unit test! We can now focus on testing component-centric things. Instead of mocking a whole GraphQL response like we were doing originally, we just are just mocking `getRecommendations` a generic prop function. And we can add some UI tests to test whatever state of the component we like, just by passing in the right props.

The UI tests can be accomplished through Snapshots, too, but the [BDD format](https://en.wikipedia.org/wiki/Behavior-driven_development) is more descriptive. UI tests like the ones below are a good compliment to Snapshot tests.

```javascript
// components/RecommendedContent/index.test.js
import { RecommendedContent } from '.';
import { shallow } from 'enzyme';
import React from 'react';
import ErrorView from '../ErrorView';
import PreLoader from '../PreLoader';
import Thumbnail from '../Thumbnail';

const seedContent = { id: '111' };
const mockGqlClient = {};
describe('RecommendedContent', () => {
  // Test that its fetching recs
  it('calls props.getRecommendations()', () => {
    const mockGetRecs = jest.fn();
    const rec = shallow(
      <RecommendedContent
        seedContent={seedContent}
        gqlClient={mockGqlClient}
        getRecommendations={mockGetRecs}
        loading={false}
        error={false}
        recommendations={[]}
      />
    );
    expect(mockGetRecs).toBeCalledWith(mockGqlClient, '111');
    // calls again when seed changes
    rec.setProps({ seedContent: { id: '222' }});
    expect(mockGetRecs).toBeCalledWith(mockGqlClient, '222');
  });
  // Test the UI!
  it('shows error state if error', () => {
    const mockGetRecs = jest.fn();
    const rec = shallow(
      <RecommendedContent
        seedContent={seedContent}
        gqlClient={mockGqlClient}
        getRecommendations={mockGetRecs}
        loading={false}
        error={true} // Error!
        recommendations={[]}
      />
    );
    expect(rec.find(ErrorView).length).toEqual(1);
  });
  // We couldn't test loader before! Now we can because
  // we everything is a prop including loading state
  it('shows loading state if loading', () => {
    const mockGetRecs = jest.fn();
    const rec = shallow(
      <RecommendedContent
        seedContent={seedContent}
        gqlClient={mockGqlClient}
        getRecommendations={mockGetRecs}
        loading={true} // Loading!
        error={false}
        recommendations={[]}
      />
    );
    expect(rec.find(PreLoader).length).toEqual(1);
  });
  it('shows a thumbnail for each recommendation', () => {
    const mockGetRecs = jest.fn();
    const recs = ['1','2','3'].map((id) => { id });
    const rec = shallow(
      <RecommendedContent
        seedContent={seedContent}
        gqlClient={mockGqlClient}
        getRecommendations={mockGetRecs}
        loading={false}
        error={false}
        recommendations={recs}
      />
    );
    expect(rec.find(PreLoader).length).toEqual(recs.length);
  });
});
```
