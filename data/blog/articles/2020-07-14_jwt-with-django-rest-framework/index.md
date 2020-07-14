---
title: JWT with Django REST framework
teaser: >
    Django REST framework already provides an easy way to issue JSON Web Tokens.
    But what if you only want to validate tokens issued by another server?
---

With [Django REST framework](https://www.django-rest-framework.org/), you can easily
build beautiful, well-documented APIs with an automatically generated developer interface - given you are already
familiar with [Django](https://www.djangoproject.com/). It offers
[multiple authentication mechanisms](https://www.django-rest-framework.org/api-guide/authentication/) out of the box,
and there are a couple of third party plugins available. One of them is
[SimpleJWT](https://github.com/SimpleJWT/django-rest-framework-simplejwt), which does a great job if your goal is
to let your server generate JWT and consume the tokens itself.

However, my use-case was a little different, having these requirements:

- A JWT issuing server already exists
- My Django application does not know the **user accounts** beforehand - they should be generated **on-the-fly**