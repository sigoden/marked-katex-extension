# marked-katex-extension

Render [katex](https://katex.org/) code in marked

```markdown
This is inline katex: $c = \\pm\\sqrt{a^2 + b^2}$

This is block level katex:

$$
c = \\pm\\sqrt{a^2 + b^2}
$$
```

You will still need to include the css in your html document to allow katex styles.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossorigin="anonymous">
```

## Usage

```js
import {marked} from "marked";
import markedKatex from "@sigodenjs/marked-katex-extension";

// or in the browser
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@{version}/dist/katex.min.css">
// <script defer src="https://cdn.jsdelivr.net/npm/katex@{version}/dist/katex.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked@{version}/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/@sigodenjs/marked-katex-extension@{version}/lib/index.umd.js"></script>

const options = {
  throwOnError: false,
  inlineTolerantNoSpace: true,
};

marked.use(markedKatex(options));

marked.parse("katex: $c = \\pm\\sqrt{a^2 + b^2}$");
```

![image](https://github.com/user-attachments/assets/a24c3c3b-3085-463d-ad12-ed6e92c30e3c)