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
import getRecommendationsQuery from '../queries/getRecommendationsQuery';

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
      return <Error />;
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
Why does this make it difficult to test? It's possible to mock `gqlClient`. Let's write the test and see.

```javascript
// RecommendedContent/index.test.js
import RecommendedContent from  '.';
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

const getRecommendations = (gqlClient, seedContent) => {
  return gqlClient.query({
    query: getRecommendationsQuery,
    variables: {
      id: seedContent.id
    },
    fetchPolicy: 'network-only'
  }).then((results) => {
    return results.data.getRecommendations;
  });
}
export default getRecommendations;
```
Next we test the query is well-formed, and returns the data we expect.
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
    return getRecommendations(mockGqlClient, { id: '111' })
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

```javascript
// actions/getRecommendations.js
// TODO
```

```javascript
// actions/getRecommendations.test.js
// TODO
```

```javascript
// reducers/getRecommendations.js
// TODO
```

```javascript
// reducers/getRecommendations.test.js
// TODO
```

```javascript
// components/RecommendedContent/index.js
// TODO
```

```javascript
// components/RecommendedContent/index.test.js
// TODO
```