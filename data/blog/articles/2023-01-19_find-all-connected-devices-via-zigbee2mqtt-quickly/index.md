---
title: "Find All Connected Devices via Zigbee2MQTT quickly"
scripts:
    - /static/js/copy-to-clipboard.js
---

If you use Zigbee2MQTT, this is a quick way to find all your connected devices:

```shell
# print friendly names of all devices
mosquitto_sub -h $HOST -t "zigbee2mqtt/bridge/info" -C 1 | jq '.config.devices[].friendly_name'
# with the friendly names, you can for example turn a light on:
mosquitto_pub -h $HOST -t "zigbee2mqtt/$FRIENDLY_NAME/set" -m '{"state": "ON", "brightness": 255}'
```
