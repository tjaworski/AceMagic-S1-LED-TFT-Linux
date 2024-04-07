# s1panel

This is my attempt at a panel software for linux. 

## Dependencies

you should at least have minimal version of node installed

```
$ node -v
v18.13.0
```

## Install

clone this repo

```
git clone https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux.git acemagic
```

install this as a service

```
cd acemagic/s1panel
sudo ./install
```

open your browser to the gui page http://localhost:8686

### top panel

this shows you the preview screen, and the settings which can be found in config.json file.

![alt text](screenshots/top-panel.png?raw=true)

### bottom panel

this is the theme configuration screen where you can add, remove and change the panel components.

![alt text](screenshots/bottom-panel.png?raw=true)

### widgets

expanding each widget shows you the configuration for that widget

![alt text](screenshots/widget-config.png?raw=true)

## Work in Progress

Things i still need to work on are theme management, more widgets and sensors. I'm still trying to find the fan speed. but with all this you can roll your own widgets and sensors. I will be creating a more detail wiki on how all this works in the coming weeks.

if you make changes to config.json or the theme.json manually make sure you restart the service.
