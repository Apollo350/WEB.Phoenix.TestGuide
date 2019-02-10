# Dependency Injection
When you are writing a unit test for a function, class, or component; you want to isolate your test to only test that specific code.

But the code you want to test often interacts with external code, such as imported libraries--the dependencies.

Dependency injection is a technique that allows you specifiy dependencies at runtime. This is very useful for testing, since you can supply a mock version your dependency.

Take this example:

```javascript
// tellMomILoveHer.js
import callMom from 'call-mom';

const tellMomILoveHer = () => {
  callMom({ say: 'I love you.' });
}
```

`callMom()` is a function that calls my mom. I don't want to invoke it every time I run the test, because it takes a long time to execute, and is expensive (long distance call). We want to change our code to inject it as a dependency and write a test against `tellMomILoveHer()`.

```javascript
// tellMomILoveHer.js
import callMom from 'call-mom';

const tellMomILoveHer = (dependency = { callMom }) => {
  dependency.callMom({ say: 'I love you.' });
}
```

When I invoke this function in production, I don't pass any parameters into `tellMomILoveHer()`, so it uses the default imported `callMom`.

In my test, I create a mock dependency, and "inject" it:

```javascript
// tellMomILoveHer.test.js
import tellMomILoveHer from './tellMomILoveHer';
describe('tellMomILoveHer()', () => {
  it('invokes callMom()', () => {
    const mockCallMom = jest.fn();
    tellMomILoveHer({ callMom: mockCallMom });
    expect(mockCallMom).toBeCalledWith({ say: 'I love you.' });
  })
})
```

## References
* https://en.wikipedia.org/wiki/Dependency_injection
