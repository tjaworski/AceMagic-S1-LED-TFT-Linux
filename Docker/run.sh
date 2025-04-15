docker run --rm --detach --privileged --name acemagic  --device=/dev/ttyUSB0 -v /dev/bus/usb  -v /sys/class/net/ -p 8686:8686 acemagic-s1panel:latest 
