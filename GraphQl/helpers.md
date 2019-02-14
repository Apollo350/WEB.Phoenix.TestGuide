# Lib and Helpers

`/lib` and `/helpers` contain the helpers used throughout the project.

Because most helpers are self-contained logic without external dependencies, they should be relatively straightforward to test.

Besides the benefit of re-use, writing helpers is a very good way to isolate business logic, and make it testable.

Let's look at `helpers/analytics.js` as of 2/14/19, and add some tests!

```javascript
// analytics.js
const SLASH_REGEX = /^\/|\/$/g;

export function resolvePageName(id, url) {
  const formattedUrl = url && url.split('.html')[0].replace(SLASH_REGEX, '');
  const pageName = formattedUrl && `${id}|${formattedUrl}`;
  return pageName;
}

export function formatDate(datePublished) {
  if (datePublished) {
    const dateObj = new Date(datePublished);
    const month = dateObj.getMonth() + 1;
    const formattedMonth = month < 9 ? `0${month}` : month;
    const date = dateObj.getDate();
    const formattedDate = date < 9 ? `0${date}` : date;
    return `${formattedMonth}/${formattedDate}/${dateObj.getFullYear()}`;
  }
  return 'NA';
}

```

We want to test `resolvePageName()` and `formatDate()`. Here are the tests:

```javascript
// helpers/analytics.test.js
import { resolvePageName, formatDate } from './analytics.js';
describe('analytics helper', () => {
  it('resolvePageName() can build a page name', () => {
    const id = '123';
    const url = '/2017/11/16/cisco-csco-stock-up-after-earnings-for-q1-2018.html';
    const expectedResult =
      '123|/2017/11/16/cisco-csco-stock-up-after-earnings-for-q1-2018';
    const rpn = resolvePageName(id, url);
    expect(rpn).toEqual(expectedResult);
  });
  it('formatDate() formats date as MM/DD/YYYY', () => {
    expect(formatDate('2017-10-06T17:33:47+0000')).toEqual('10/06/2017');
    // We can add more examples ...
  });
});
```