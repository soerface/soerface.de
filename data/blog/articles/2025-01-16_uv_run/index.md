---
title: "uv run"
scripts:
    - /static/js/copy-to-clipboard.js
---

No need anymore to use virtualenvs to quickly try a package out. Use:

```
uv run --python 3.12 --with pandas ipython
```

Via [https://valatka.dev/2025/01/12/on-killer-uv-feature.html](https://valatka.dev/2025/01/12/on-killer-uv-feature.html).

You can also use uv to [put your dependencies at the top of your script](https://blog.holz.nu/2025/01/12/0.html).
This is a powerful replacement for bash scripts, without requiring the user to install a bunch of stuff beforehand.
