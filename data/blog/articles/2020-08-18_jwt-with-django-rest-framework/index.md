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

However, my use-case is a little different, having these requirements:

- A JWT issuing server already exists
- My Django application does not know the **user accounts** beforehand - they should be generated **on-the-fly**

We start with an example application, Django and Django REST framework are already configured. It also has a route
that returns a list of all users if you are logged in. You can get the source at
[soerface/django_pyjwt_example@eb9a46e](https://github.com/soerface/django_pyjwt_example/tree/eb9a46ea8f1b4d99f2c0740dce13e984b5cbfeab).

It looks like this:

<video width="100%" autoplay loop muted>
    <source src="api-explorer.mp4" type="video/mp4">
</video>

## Add a custom authentication scheme

To add our custom JWT authentication, we add a new python file `django_pyjwt_example/authentication.py`:

```python
from rest_framework.authentication import BaseAuthentication, get_authorization_header


class JWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        # TODO: return tuple (user, auth) if authentication succeeds or None otherwise.
        #       You can also raise AuthenticationFailed
        # https://www.django-rest-framework.org/api-guide/authentication/#custom-authentication
        return None
```

Add your custom authentication class to the `DEFAULT_AUTHENTICATION_CLASSES` setting of DRF. We also add the default
authentication classes so we will still be able to login via the webinterface. To do so, add those lines to `settings.py`:

```python hl_lines="2 3 4 5 6"
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'django_pyjwt_example.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.DjangoModelPermissions'
    ]
}
```

## Add a public certificate

To validate the token we get from our clients, we need to check the tokens signature. For simplicity, we will add the
certificate directly to our `settings.py` – you may consider reading them from the environment variables using
[`os.getenv(KEY)`](https://stackoverflow.com/a/4907053/458274) or similar.

If you do not have a certificate, use OpenSSL to generate one:

```shell
# Generate a private key
openssl genrsa -out private.pem -aes256 4096
# Generate the corresponding public key
openssl rsa -pubout -in private.pem -out public.pem
# Print the public key
cat public.pem
```

`settings.py`:

```python
JWT_PUBLIC_KEY = """
-----BEGIN PUBLIC KEY-----
MIICIjANBgkq.....jh1K9Id5MCAwEAAQ==
-----END PUBLIC KEY-----
"""
```

## Validate a JWT

We will use [pyjwt](https://pyjwt.readthedocs.io/en/latest/) in our custom authentication class to decode and verify
the token. All that is needed is essentially calling `jwt.decode(token, pub_key)`. Some sanity checks are made for
proper error handling. Enforcing the JWT algorithm makes sure that the user can't choose another one

```python hl_lines="10 17 19"
from django.conf import settings
import jwt  # pip install pyjwt
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed


class JWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        # An authorization with a JWT token typically starts with `Bearer`
        # https://jwt.io/introduction/
        # Only continue this authentication method if the header consists of
        # the word 'Bearer' and a token
        if len(auth) != 2 or auth[0].decode() != 'Bearer':
            return None
        _, encoded_token = auth
        try:
            token = jwt.decode(encoded_token, settings.JWT_PUBLIC_KEY, algorithms=['RS512'])
        except jwt.exceptions.DecodeError:
            raise AuthenticationFailed('Malformed token')
        print(token)
```

### Bonus validation: Use JSON Schema

[JSON Schema](https://json-schema.org/) provides a powerful way to validate json documents. It not only gives you a
way to make sure certain keys are present, but also that they have the correct type. You can use it to make sure all
tokens have a proper username and an expiration date.

According to [pyjwt.readthedocs.io](https://pyjwt.readthedocs.io/en/latest/usage.html#requiring-presence-of-claims)
it is possible to enforce the presence of keys by using the "options" parameter and giving it a list of keys.
However, this had no effect. Further research showed that you need to use the `"require_exp": True` option
([pypi.org/project/PyJWT/1.4.0/](https://pypi.org/project/PyJWT/1.4.0/),
sections "Skipping Claim Verification" and "Requiring Optional Claims").

This leaves me with an uneasy feeling to the options of pyjwt. Since JSON Schema also allows me to verify more than
just the JWT claims, I will use it for extended validation:

```python hl_lines="5 9 10 11 12 13 14 15 16 33"
from django.conf import settings
import jwt
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
import jsonschema


class JWTAuthentication(BaseAuthentication):
    token_schema = {
        'type': 'object',
        'properties': {
            'username': {'type': 'string'},
            'exp': {'type': 'integer'}
        },
        'required': ['username', 'exp']
    }

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        # An authorization with a JWT token typically starts with `Bearer`
        # https://jwt.io/introduction/
        # Only continue this authentication method if the header consists of
        # the word 'Bearer' and a token
        if len(auth) != 2 or auth[0].decode() != 'Bearer':
            return None
        _, encoded_token = auth
        try:
            token = jwt.decode(encoded_token, settings.JWT_PUBLIC_KEY, algorithms=['RS512'])
        except jwt.exceptions.DecodeError:
            raise AuthenticationFailed('Malformed token')

        try:
            jsonschema.validate(token, JWTAuthentication.token_schema)
        except jsonschema.ValidationError as e:
            raise AuthenticationFailed({
                'detail': f'Invalid JWT schema: {e.message}',
                'schema': e.schema
            }, 400)

```

## Create user accounts on the fly

This part is the easiest. We use the [`get_or_create()`](https://docs.djangoproject.com/en/3.1/ref/models/querysets/#get-or-create)
method of the [`User`](https://docs.djangoproject.com/en/3.1/topics/auth/default/#user-objects) object to create a new
user. Additionally, we emit the [`user_logged_in`](https://docs.djangoproject.com/en/3.1/ref/contrib/auth/#django.contrib.auth.signals.user_logged_in)
signal so Django and other parts of our project are notified accordingly. For example, Django will add a `last_login`
timestamp to each user.

```python hl_lines="41 42 43 44"
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model, user_logged_in
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
import jsonschema


class JWTAuthentication(BaseAuthentication):
    token_schema = {
        'type': 'object',
        'properties': {
            'username': {'type': 'string'},
            'exp': {'type': 'integer'}
        },
        'required': ['username', 'exp']
    }

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        # An authorization with a JWT token typically starts with `Bearer`
        # https://jwt.io/introduction/
        # Only continue this authentication method if the header consists of
        # the word 'Bearer' and a token
        if len(auth) != 2 or auth[0].decode() != 'Bearer':
            return None
        _, encoded_token = auth
        try:
            token = jwt.decode(encoded_token, settings.JWT_PUBLIC_KEY, algorithms=['RS512'])
        except jwt.exceptions.DecodeError:
            raise AuthenticationFailed('Malformed token')

        try:
            jsonschema.validate(token, JWTAuthentication.token_schema)
        except jsonschema.ValidationError as e:
            raise AuthenticationFailed({
                'detail': f'Invalid JWT schema: {e.message}',
                'schema': e.schema
            }, 400)

        user, created = get_user_model().objects.get_or_create(username=token['username'])
        # Sending a signal allows Django proper population of fields like last_login
        user_logged_in.send(sender=JWTAuthentication, request=request, user=user)
        return user, None
```

## Test everything

For simple testing, I've added a script that will generate a JWT for you. Check it out:
[create_jwt.py](https://github.com/soerface/django_pyjwt_example/blob/5d511c5c4728b3412d7a7a5d2298d8df205a013a/create_jwt.py)

Create a JWT and use curl to send it in a `Authorization: Bearer <token>` header:

```shell
JWT_TOKEN=$(./create_jwt.py hello)
curl -sH "Authorization: Bearer $JWT_TOKEN" localhost:8000/users/
```

Demonstration:

<video width="100%" autoplay loop muted>
    <source src="demo.mp4" type="video/mp4">
</video>

The complete project source can be found on [github.com/soerface/django_pyjwt_example](https://github.com/soerface/django_pyjwt_example)