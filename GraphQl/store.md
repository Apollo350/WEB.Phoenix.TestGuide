# Store

Let's take the article store as an example, and add tests. Here it is as-is as of 2/14/19.

```javascript
// store/article.js
import globalAppConfig from '../app/PhoenixQlConfig';
import NetworkRequest from '../lib/networkRequest';
import Logger from '../lib/logger';

const { PRO_AUTH_API } = globalAppConfig.getProperties();

/**
 * Generates Skyrock API request URL
 * @param {string} authCode
 * @returns {string}
 */
const generateURL = (uid, sessionToken) => `${PRO_AUTH_API}${uid}/validateProUser?token=${sessionToken}`;

/**
 * Determines whether a user is 'Pro' user or not
 * @param {string} authCode
 * @returns {boolean}
 */
export async function resolveProAuthentication({
  uid = 'Not Logged In',
  sessionToken = 'Not Logged In',
}, { networkClient }) {
  try {
    if (uid === 'Not Logged In') return false;
    const url = generateURL(uid, sessionToken);
    const { isValidProUser = false } = await networkClient.load({ url }) || {};
    return isValidProUser;
  } catch (error) {
    Logger.error({
      msg: 'Failed to fetch auth data service',
      args: { uid, sessionToken },
      err: error.message,
    });
    return false;
  }
}

/**
 * Fetches article from CAPI
 * @param {number} args.id
 * @returns {object}
 */
function find({ id, url }, { capi }) {
  return capi.find({ id, url });
}

export function createStore({ capi }) {
  const networkClient = new NetworkRequest();
  return {
    find: args => find(args, { capi }),
    resolveProAuthentication: args => resolveProAuthentication(args, { networkClient }),
  };
}
```

The first step to making this file unit testable is to isolate dependencies. Let's look at `resolveProAuthentication()`. It depends on `globalAppConfig`, `Logger`, and `networkClient`. It looks like `globalAppConfig` is configured to work in a test context already. If we want to test logging, we need to dependency inject `Logger`. `networkClient` is already being passed in as a dependency, so we can just mock that.

So we can change our implementation code to [dependency inject](../General/dependencyInjection.md) Logger.

```javascript
 export async function resolveProAuthentication(
   {
    uid = 'Not Logged In',
    sessionToken = 'Not Logged In',
  },
  { networkClient },
  dependency: { logger: Logger }) {
  // ...
  // Use dependency.logger.error()
  // instead of Logger.error()
}
```
Next, `find()` can also be tested. Its dependency `capi` is being passed in, so we can go ahead and write the test. It's not exported, so add an `export` statement to things you want to test.

We'll write unit tests for `resolveProAuthentication` and `find`. And we can write a simple smoke test for `createStore`.

```javascript
// store/article.test.js
import { resolveProAuthentication, find } from './article/js';

describe('find()', () => {
  it('calls capi', () => {
    const mockCapi = {
      find: jest.fn()
    };
    const id = '123';
    const url = 'http://google.com';
    find({ id, url }, { capi: mockCapi })
    expect(mockCapi.find).toBeCalledWith({ id, url });
  }
});
describe('resolveProAuthentication()', () => {
  it('makes a network call to retrieve pro auth status', () => {
    const mockNetworkClient = {
      load: jest.fn().mockResolvedValue({ isValidProUser: true })
    };
    expect().assertions(2);
    return resolveProAuthentication(
      {
        uuid: 'myuuid',
        sessionToken: 'mysessiontoken'
      },
      mockNetworkClient
    ).then((isValidProUser) => {
      expect(mockNetworkClient.load).toBeCalledWith({
        url: 'http://register-qa.cnbc.com/auth/api/v1/14/myuuid/validateProUser?token=mysessiontoken'
      })
      expect(isValidProUser).toEqual(true);
    });
  });
  it('logs errors on network failure', () => {
    const mockNetworkClient = {
      // This will generate a failed promise,
      // and trigger the catch().
      load: jest.fn().mockRejectedValue(new Error('Network error'))
    };
    const mockLogger = {
      error: jest.fn()
    };
    expect.assertions(1);
    return resolvedProAuthentication(
      {
        uuid: 'myuuid',
        sessionToken: 'mysessiontoken'
      },
      mockNetworkClient,
      // Injecting logger as dependency
      { logger: mockLogger }
    ).then(() => {
      expect(mockLogger.error).toBeCalledWith({
        msg: 'Failed to fetch auth data service',
        args: { 'myuuid', 'mysessiontoken' },
        err: 'Network error',
      });
    });
  });
});
// This is a smoke test that will fail if createStore()
// throws an exception.
describe('createStore()' () => {
  it('can instantiate an article store', () => {
    const store = createStore({ capi: {} });
    expect(store).toBeInstanceOf(Object);
  });
});
```
