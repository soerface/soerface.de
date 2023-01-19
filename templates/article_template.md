---
title: "{{ article.title }}"
{%- if article.teaser %}
teaser: >
    {{ article.teaser }}
{% endif %}
scripts:
    - /static/js/copy-to-clipboard.js
---

{{ article.content }}