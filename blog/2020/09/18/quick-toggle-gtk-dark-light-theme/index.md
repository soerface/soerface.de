---
title: Quick toggle your GTK theme between light and dark
teaser: >
    Want to use both, dark and light theme, but need a simple way to toggle between them? Search no more.
---

I like dark themes - but I also like light themes. It all depends on the situation.
Don't tell me it is enjoyable to code with a dark IDE while the sun is shining right at your display!

Therefore I was searching for a *quick toggle* between two themes. And it is actually pretty simple.
Add this to your `~/.bashrc` or `~/.zshrc` for **Linux Mint** (with Cinnamon) or **Ubuntu** (with Gnome Shell / Unity):

```shell
function dark {
    if lsb_release -i | grep -q 'Linuxmint'; then
        gsettings set org.cinnamon.desktop.wm.preferences theme 'Mint-Y-Dark'
        gsettings set org.cinnamon.desktop.interface gtk-theme 'Mint-Y-Dark'
        gsettings set org.cinnamon.desktop.interface icon-theme 'Mint-Y-Dark'
        gsettings set org.cinnamon.theme name 'Mint-Y-Dark'
    fi
    if lsb_release -i | grep -q 'Ubuntu'; then
        gsettings set org.gnome.desktop.interface gtk-theme 'Yaru-dark'
    fi
}

function light {
    if lsb_release -i | grep -q 'Linuxmint'; then
        gsettings set org.cinnamon.desktop.wm.preferences theme 'Mint-Y'
        gsettings set org.cinnamon.desktop.interface gtk-theme 'Mint-Y'
        gsettings set org.cinnamon.desktop.interface icon-theme 'Mint-Y'
        gsettings set org.cinnamon.theme name 'Mint-Y'
    fi
    if lsb_release -i | grep -q 'Ubuntu'; then
        gsettings set org.gnome.desktop.interface gtk-theme 'Yaru'
    fi
}
``` 

Now open a new terminal and just type `light` or `dark`!

<video width="100%" autoplay loop muted>
    <source src="toggle-cli.mp4" type="video/mp4">
</video>

---

I've got the idea from the Linux Mint welcome screen. It has a neat toggle for dark and light, but I didn't find any
taskbar widget or something like that, so I took a quick look in the
[source code of the welcome screen](https://github.com/linuxmint/mintwelcome/blob/a2cb7ee48cb21c65f2fc96ea6c3953d0a43f3846/usr/lib/linuxmint/mintwelcome/mintwelcome.py#L271).
It was embarrassingly easy, just changing some GTK options with `gsettings` should have come to my mind earlier.
But here are the options for you to simply copy and paste them, allowing you to change the theme easily with a single command.

<video width="100%" autoplay loop muted>
    <source src="toggle-welcome-screen.mp4" type="video/mp4">
</video>

Enjoy!