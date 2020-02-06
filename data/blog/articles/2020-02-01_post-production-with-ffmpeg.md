---
devto_post_id: 0
title: Post-production with ffmpeg
teaser: >
    `ffmpeg` may not be very intuitive to use – but it can remove a lot of repetitive work when using
    it in bash scripts. I'll show you how I automated syncing two videos, combining them, and adding
    an intro and outro to the result. [Audacity](https://www.audacityteam.org/),
    [mpv](https://mpv.io/) and [sox](http://sox.sourceforge.net/) are also part of the toolchain.
---

# TODO: Escaping issues in codeblocks / pre formatted

A while ago, we, the Chaos Computer Club Kassel, [flipdot e.V.](https://flipdot.org), organized a public
event, called the [hackumenta](https://2019.hackumenta.de/). Our talks were recorded and we wanted to
published them at [meda.ccc.de](https://media.ccc.de). Speaker and slides were separately recorded and
need to be synced, merged, and cut, so I've created a little ffmpeg-toolchain.

The final toolchain is available at &fa-github;
[github.com/flipdot/0xA-voc-toolchain](https://github.com/flipdot/0xA-voc-toolchain/) (subject to change).

It works by consecutively executing the numbered bash scripts. But first, set `INPUT_DIR` and
`WORKING_DIR` in &fa-github; [settings.env](https://github.com/flipdot/0xA-voc-toolchain/blob/master/settings.env)

```console
$ git clone https://github.com/flipdot/0xA-voc-toolchain.git
$ cd 0xA-voc-toolchain
$ vim settings.env
$ ./1_preprocess_raw_files.sh
$ ./2_extract_audio.sh
$ ./3_
```

Each script will iterate through all directories inside `INPUT_DIR` / `WORKING_DIR` and execute commands
inside of them.

## 1: Preprocess raw files

Script: &fa-github; [`1_preprocess_raw_files.sh`](https://github.com/flipdot/0xA-voc-toolchain/blob/master/1_preprocess_raw_files.sh)

Let's begin by taking a look at our raw video material:

```text
INPUT_DIR
├── 01_Opening
│   ├── cam.MP4
│   ├── screen_raw.avi
│   └── title.txt
└── 02_CUDA_Basics
    ├── cam_01.MP4
    ├── cam_02.MP4
    ├── screen_raw.avi
    └── title.txt
```

Due to our recording setup, we ended up with multiple "cam_xx.MP4" files, depending on the length of the
talk. Using `ffmpeg -f concat` together with a loop for the `-i` parameter allows us to combine all
`cam_xx.MP4` files into a single `cam.mp4`.

Also, the screen recordings were uncompressed.
`ffmpeg -hwaccel vaapi -vaapi_device /dev/dri/renderD128 -c:v h264_vaapi` allows us to efficiently re-encode
the recordings as H264.

Let's run the above commands by executing
&fa-github; [`1_preprocess_raw_files.sh`](https://github.com/flipdot/0xA-voc-toolchain/blob/master/1_preprocess_raw_files.sh).
It will produce these files:

```text
WORKING_DIR
├── 01_Opening
│   ├── cam.mp4
│   └── screen.mp4
└── 02_CUDA_Basics
    ├── cam.mp4
    └── screen.mp4
```

## 2: Extracting and normalizing audio

Script: &fa-github; [`2_extract_audio.sh`](https://github.com/flipdot/0xA-voc-toolchain/blob/master/2_extract_audio.sh)