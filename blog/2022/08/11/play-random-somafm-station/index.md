---
title: "Play SomaFM from shell"
teaser: >
    Simple shell alias to play your favorite internet radio.
scripts:
    - /static/js/copy-to-clipboard.js
---

Here is a simple shell script that allows you to simply play SomaFM stations from the command line.
If you don't choose a station, it will automatically pick one at random.

It will also check if a 256k stream is available and play that instead of the standard 128k.

Requirements:

- `mpv`
- `curl`

Usage:

```shell
$ soma --list         # print all stations
$ soma <STATION_NAME> # play particular station
$ soma                # play a random station
```

To use it, put this in your `~/.bashrc` or `~/.zshrc` file:

<div>
<button class="copy-to-clipboard"></button>
```shell
function soma {
    if [ -z ${1+x} ]; then
        radio=$(shuf -n 1 $HOME/dotfiles/soma-radios);
    else
        radio="${1}"
    fi
    if [ "$radio" = "--list" ]; then
        cat $HOME/dotfiles/soma-radios;
        return;
    fi;
    url="https://somafm.com/$radio.pls"
    url256="https://somafm.com/${radio}256.pls"
    if curl --head --silent --fail $url256 > /dev/null 2>&1; then
        mpv $url256
    else
        mpv $url
    fi
}
```
</div>

And also put the [list of stations](https://somafm.com/#alpha) in `$HOME/dotfiles/soma-radios`.

<div style="height: 10em; overflow: auto; margin: 1em 0;">
<button class="copy-to-clipboard"></button>
```shell
7soul
beatblender
bootliquor
brfm
cliqhop
covers
darkzone
deepspaceone
defcon
digitalis
dronezone
dubstep
fluid
folkfwd
groovesalad
gsclassic
illstreet
indiepop
live
lush
metal
missioncontrol
n5md
poptron
reggae
scanner
secretagent
seventies
sf1033
sonicuniverse
spacestation
specials
suburbsofgoa
synphaera
thetrip
thistle
u80s
vaporwaves
```
</div>

Do not save the file with a trailing newline – otherwise you might play the radio station *"empty string"*.

Don't forget to [support SomaFM](https://somafm.com/support/)!