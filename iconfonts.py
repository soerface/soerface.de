"""
IconFonts Extension for Python-Markdown
========================================

Version: 2.1

Description:
	Use this extension to display icon font icons in python markdown. Just add the css necessary for your font and add this extension.

Features:
	- Support FontAwesome or Bootstrap 3/Glyphicons or both at the same time!
	- Allow users to specify additional modifiers, like 'fa-2x' from FontAwesome
	- Force users to use pre-defined classes to style their icons instead of
		allowing them to specify styles themselves
	- Allow users to specify additional classes, like 'red'

Syntax:
	- Accepts a-z, A-Z, 0-9, _ (underscore), and - (hypen)
	- Uses HTML Entity like syntax

	&icon-html5;
	&icon-css3;
	&icon-my-icon;

	&icon-html5:2x;
	&icon-quote:3x,muted;
	&icon-spinner:large,spin;


Example Markdown:
	I love &icon-html5; and &icon-css3;
	&icon-spinner:large,spin; Sorry we have to load...
	&icon-spinner:large,spin:red; Sorry we have to load...

Output:
	I love <i aria-hidden="true" class="icon-html5"></i> and <i aria-hidden="true" class="icon-css3"></i>
	<i aria-hidden="true" class="icon-spinner icon-large icon-spin"></i> Sorry we have to load...
	<i aria-hidden="true" class="icon-spinner icon-large icon-spin red"></i> Sorry we have to load...


Installation:
	Just drop it in the extensions folder of the markdown package. (markdown/extensions).
	Also check out: https://pythonhosted.org/Markdown/extensions/index.html

Usage/Setup:
	Default Prefix is "icon-":
		In a Django Template:
			{{ textmd|markdown:"safe,iconfonts" }}

		In Python:
			>>> text = '&icon-html5;'
			>>> md = markdown.Markdown(extensions=['iconfonts'])
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="icon-html5"></i>'


	Use a custom Prefix:
		In a Django Template:
			{{ textmd|markdown:"safe,iconfonts(prefix=mypref-)" }}

		In Python:
			>>> text = '&mypref-html5;'
			>>> md = markdown.Markdown(extensions=['iconfonts(prefix=mypref-)'])
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="mypref-html5"></i>'


	Use no prefix (just in case you couldn't figure it out :P):
		In a Django Template:
			{{ textmd|markdown:"safe,iconfonts(prefix=)" }}

		In Python:
			>>> text = '&html5;'
			>>> md = markdown.Markdown(extensions=['iconfonts(prefix=)'])
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="html5"></i>'

	Use the base option which allows for Bootstrap 3 and FontAwesome 4:
		In Python:
			>>> text = '&fa-html5;'
			>>> md = markdown.Markdown(extensions=['iconfonts(prefix=fa-, base=fa)'])
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="fa icon-html5"></i>'

			>>> text = '&glyphicon-remove;'
			>>> md = markdown.Markdown(extensions=['iconfonts(prefix=glyphicon-, base=glyphicon)'])
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="glyphicon glyphicon-remove"></i>'

	Or support both Bootstrap 3/Glyphicons and FontAwesome 4 at the same time:
		In Python:
			>>> text = '&fa-html5; &glyphicon-remove;''
			>>> md = markdown.Markdown(extensions=['iconfonts'],
			>>>                        extension_configs={
			>>>                            'fa': 'fa',
			>>>                            'glyphicon': 'glyphicon',
			>>>                        })
			>>> converted_text = md.convert(text)
			'<i aria-hidden="true" class="fa fa-html5"></i>'
			'<i aria-hidden="true" class="glyphicon glyphicon-remove"></i>'


Copyright 2014 [Eric Eastwood](http://ericeastwood.com/)

Use it in any personal or commercial project you want.
"""

import markdown
import re
from xml.etree.ElementTree import Element


class IconFontsExtension(markdown.Extension):
    """IconFonts Extension for Python-Markdown."""

    def __init__(self, **kwargs):
        # Define default configs
        self.config = {
            "prefix": ["icon-", "Custom class prefix."],
            "base": ["", "Base class added to each icon"],
            "prefix_base_pairs": [{}, "Prefix/base pairs"],
        }
        # Set user configurations
        super().__init__(**kwargs)

    def add_inline(self, md, name, klass, pattern, config):
        # compiled_pattern = re.compile(pattern)
        processor = klass(pattern, md, config)
        md.inlinePatterns.register(processor, name, 175)

    def extendMarkdown(self, md):
        config = self.getConfigs()

        # Define the regex for icons
        prefix = config["prefix"]
        icon_regex_start = r"&"
        icon_regex_end = (
            r"(?P<name>[a-zA-Z0-9-]+)"
            r"(:(?P<mod>[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*)?)?"
            r"(:(?P<user_mod>[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*)?)?;"
        )
        icon_regex = "".join([icon_regex_start, prefix, icon_regex_end])

        # Register the global pattern
        self.add_inline(md, "iconfonts", IconFontsPattern, icon_regex, config)

        # Register each of the prefix/base pair patterns
        for _prefix, _base in config["prefix_base_pairs"].items():
            _prefix_base = _prefix.rstrip("-")
            icon_regex = "".join([icon_regex_start, _prefix, icon_regex_end])
            self.add_inline(
                md,
                f"iconfonts_{_prefix_base}",
                IconFontsPattern,
                icon_regex,
                {"prefix": _prefix, "base": _base},
            )


class IconFontsPattern(markdown.inlinepatterns.InlineProcessor):
    def __init__(self, pattern, md, config):
        super().__init__(pattern)
        self.md = md
        self.config = config

    def handleMatch(self, match, data):
        match_dict = match.groupdict()

        # Create the <i> element
        el = Element("i")
        base = self.config["base"]
        prefix = self.config["prefix"]
        icon_class_name = match_dict.get("name")

        # Process modifier classes
        mod_classes = [
            f"{prefix}{c}" for c in (match_dict.get("mod") or "").split(",") if c
        ]
        mod_classes_string = " ".join(mod_classes)

        # Process user-defined modifier classes
        user_mod_classes = [
            c for c in (match_dict.get("user_mod") or "").split(",") if c
        ]
        user_mod_classes_string = " ".join(user_mod_classes)

        # Final icon class
        icon_class = f"{prefix}{icon_class_name}" if prefix else icon_class_name
        classes = f"{base} {icon_class} {mod_classes_string} {user_mod_classes_string}".strip()
        classes = re.sub(r"\s{2,}", " ", classes)  # Clean up whitespace

        # Set attributes
        el.set("class", classes)
        el.set("aria-hidden", "true")
        return el, match.start(), match.end()


def makeExtension(**kwargs):
    return IconFontsExtension(**kwargs)
