# AceMagic-S1-LED-TFT-Linux
ACEMAGIC S1 Mini TFT/LCD Control for Linux

# First: My Rant

While this mini pc is great, I found the lack of any information about the TFT front screen and LED strip very annoying. The product on amazon itself is listed as "with DIY LCD Display" and the missing support for linux is disapointing at best. The end goal is to be able to control both of these devices in linux so that projects like Batocera.linux can utilize it. Anyone wants to join the effort, drop me a note here.   

## LED Strip

The LED strip from what I gather is controlled by the USB-SERIAL CH340.

https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux

![alt text](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux/blob/main/images/ch340.png?raw=true)

## TFT-LCD Display

The TFT-LCD display is controlled via the USB HID device. the contro board has a Holtek HT32 chip on it. There is some firmware doing the drawing. 

![alt text](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux/blob/main/images/tft-lcd.png?raw=true)

DeviceClass             : HIDCLASS
DeviceID                : HID\VID_04D9&PID_FD01&MI_00\7&3A7B026B&0&0000
DeviceName              : HID-compliant consumer control device
HardWareID              : HID\VID_04D9&PID_FD01&REV_0110&MI_00

DeviceClass             : HIDCLASS
DeviceID                : HID\VID_04D9&PID_FD01&MI_01\7&16A3C4A9&0&0000
DeviceName              : HID-compliant vendor-defined device
HardWareID              : HID\VID_04D9&PID_FD01&REV_0110&MI_01

the HT32 control board:

![alt text](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux/blob/main/images/board.jpeg?raw=true)


as you can see in the photo below, the sample traffic sent to the device:

![alt text](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux/blob/main/images/capture1.png?raw=true)

## Code

soon...

## Additional Documentation and Acknowledgments

* WireShark
* IDA
