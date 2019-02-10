#  Split monolithic components
Characteristics of monolithic components:
1. Many lines of code
2. Repeated code
3. A lot of conditional logic
4. Many props

## Use composition
You can break down large components into smaller components.

See: [Composite simpler components](./composite.md)

## Avoid being overly generic
Its tempting to build very generic components. For instance, you may want a `Hero` component for featuring a piece of content. The content can be of different types, like `Article` or `Video`. For videos, you can show `clip` or `thumbnail`. And there are different layouts of Heroes, like `Wide` or `Narrow`.

The following component attempts to do too much:

```javascript
class Hero extends React.Component {
  static propTypes = {
    content: PropTypes.object, // video or article
    contentType: PropTypes.string,
    showVideoClip: PropTypes.bool,
    layout: PropTypes.string
  }

  render() {
    const { content, contentType, layout, showVideoClip }
      = this.props;
    const isVideo = contentType === 'video';
    const useVideoClip =
      isVideo &&
      showVideoClip;
    const title = isVideo ?
      content.title :
      content.headline;
    const className = (layout === 'wide') ?
      'hero--wide' :
      'hero--narrow';
    return (
      <div className={className}>
        {useVideoClip &&
        <VideoClip video={content} />}
        {!useVideoClip &&
        <Thumbnail image={content.thumbnailImage} contentType={contentType} />}
        <div>{title}</div>
      </div>
    );
  }
}
```
Even in this simple example, we start seeing some problems:

1. We're introducing conditional logic to assign the title beause the data model for videos and articles are not the same. If the data models diverge more in the future, this component can be brittle and difficult to maintain.
2. We've added a prop `showVideoClip` that is meaningless for articles, adding cognitive overhead for developers that only want to modify the Hero for articles.
3. We are introducing rigidity. It will be difficult for videos and articles to be given significantly different treatments without adding large code branches.

Here are all the possible combinations. And this list explodes for every prop you add.

* `Video` Hero with `clip` that's `wide`
* `Video` Hero with `thumbnail` that's `wide`
* `Video` Hero with `clip` that's `narrow`
* `Video` Hero with `thumbnail` that's `narrow`
* `Article` Hero with `thumbnail` that's `wide`
* `Article` Hero with `thumbnail` that's `narrow`

We can refactor the Hero component into separate components. But we want to find the right balance. It would be unreasonable to create a component for every combination.

In our example `wide` vs `narrow` is only a CSS style change, so that can stay a prop. A lot of the if statements are around `contentType`, so we likely want to create separate components for `Video` and `Article` to get rid of the conditional logic. And `clip` vs `thumbnail` only applies to `Video`, so if a `clip` is different enough from `thumbnail`, we should make it a separate component. For this exercise, let's go ahead and do that.

We end up with three components below. Keep in mind, in this trivial example, code is being duplicated. But assuming these components will independently evolve, they are free to diverge. The way you get code re-use is by having these components share sub-components through composition.

```javascript
class VideoClipHero extends React.Component {
  static propTypes = {
    video: PropTypes.object,
    layout: PropTypes.string
  }

  render() {
    const { video, layout } = this.props;
    const className = (layout === 'wide') ?
      'hero--wide' :
      'hero--narrow';
    return (
      <div className={className}>
        <VideoClip video={video} />}
        <div>{video.title}</div>
      </div>
    );
  }
}
```

```javascript
class VideoThumbnailHero extends React.Component {
  static propTypes = {
    video: PropTypes.object,
    layout: PropTypes.string
  }

  render() {
    const { video, layout } = this.props;
    const className = (layout === 'wide') ?
      'hero--wide' :
      'hero--narrow';
    return (
      <div className={className}>
        <Thumbnail image={video.thumbnailImage} />}
        <div>{video.title}</div>
      </div>
    );
  }
}
```

```javascript
class ArticleHero extends React.Component {
  static propTypes = {
    article: PropTypes.object,
    layout: PropTypes.string
  }

  render() {
    const { article, layout } = this.props;
    const className = (layout === 'wide') ?
      'hero--wide' :
      'hero--narrow';
    return (
      <div className={className}>
        <Thumbnail image={article.thumbnailImage} />}
        <div>{article.headline}</div>
      </div>
    );
  }
}
```

The parent component that hosts the components above should either know which one it wants. If it doesn't, the parent component can inspect the data, and perform the conditional branching, keeping that logic out of each individual components.
