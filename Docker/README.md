## Run AceMagic-S1-LED-TFT-Linux in Docker

Just quick and dirty docker container for running panel control in a Docker.

This is first step to wrap it in Home assistant addon

My theme is heavily based on https://github.com/Piero24/acemagic-S1-panel-conf
which is also added to container if you want to use it.

## How to build locally
```bash
docker build -t acemagic-s1panel .
```

## How to run

```bash
docker run --rm --detach --privileged --name acemagic  --device=/dev/ttyUSB0 -v /dev/bus/usb  -v /sys/class/net/ -p 8686:8686 acemagic-s1panel:latest 
```


## How You can help making it better

- Clean up packages added to container. I'm not sure that they all are needed.
- Add all font packages needed by main code
- Figure out the correct way of passing network interfaces information. I don't like the idea of using host network for such a container.
- Make better screens
- Make Portrait layout
