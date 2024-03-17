# AceMagic-S1-LED-TFT-Linux
ACEMAGIC S1 Mini TFT/LCD Control for Linux

# First: My Rant

While this mini PC offers impressive features, the absence of information regarding the TFT front screen and LED strip is frustrating. Despite being advertised as 'with DIY LCD Display' on Amazon, the lack of Linux support is disappointing. My objective is to enable control of these devices in Linux, facilitating integration with projects like Batocera.linux. If you're interested in contributing to this effort, please reach out.   

## LED Strip

The LED strip from what I gather is controlled by the USB-SERIAL CH340.

![alt text](images/ch340.png?raw=true)

## TFT-LCD Display

The TFT-LCD display is controlled via the USB HID device. the control board has a Holtek HT32 chip on it. There is some firmware doing the drawing. 

![alt text](images/tft-lcd.png?raw=true)

    DeviceClass             : HIDCLASS
    DeviceID                : HID\VID_04D9&PID_FD01&MI_00\7&3A7B026B&0&0000
    DeviceName              : HID-compliant consumer control device
    HardWareID              : HID\VID_04D9&PID_FD01&REV_0110&MI_00

    DeviceClass             : HIDCLASS
    DeviceID                : HID\VID_04D9&PID_FD01&MI_01\7&16A3C4A9&0&0000
    DeviceName              : HID-compliant vendor-defined device
    HardWareID              : HID\VID_04D9&PID_FD01&REV_0110&MI_01

the HT32 control board:

![alt text](images/board.jpeg)


as you can see in the photo below, the sample traffic sent to the device:

![alt text](images/capture1.png?raw=true)

## commands for TFT screen

all commands have an 8 byte header. total buffer sent is always 4104 bytes, that is 8 bytes for header, and 4096 for data. the header always starts with a signature byte (0x55), followed by command byte. the next byte tells if this is a start (0xF0), continue (0xF1), or final command (0xF2). 

#### set_time (0xA1)

this is used to keep the internal clock updated and as a heartbeat..

```
struct set_time {
    uint8_t header;   // 0x55
    uint8_t command1; // 0xA1
    uint8_t command2; // 0xF2 = end
    uint8_t hour;     // 0x0E = 14 hours (2pm)
    uint8_t minute;   // 0x1C = 28 minutes
    uint8_t second;   // 0x2D = 45 seconds
    uint16_t unused;
};
```

data looks like this:
```
55 a1 f2 0e 1c 2d 00 00    2:28:45
55 a1 f2 0e 1c 2e 00 00    2:28:46
```

#### set_image (0xA3)

```
struct set_image {
    uint8_t header;   // 0x55
    uint8_t command1; // 0xA3
    uint8_t command2; // 0xF0 = start, 0xF1 = continue, 0xF2 = end
    uint8_t sequence; // 0x01 - 0x1B
    uint16_t offset;  // 
    uint16_t length;  //
};
```

data looks like this (image data omited):

```
    0  1  2  3  4  5  6  7    offset - length
   55 a3 f0 01 00 00 00 10         0 - 4096      
   55 a3 f1 02 00 10 00 10      4096 - 4096      
   55 a3 f1 03 00 20 00 10      8192 - 4096            
   55 a3 f1 04 00 30 00 10     
   55 a3 f1 05 00 40 00 10     
   55 a3 f1 06 00 50 00 10     
   55 a3 f1 07 00 60 00 10     
   55 a3 f1 08 00 70 00 10     
   55 a3 f1 09 00 80 00 10     
   55 a3 f1 0a 00 90 00 10     
   55 a3 f1 0b 00 a0 00 10     
   55 a3 f1 0c 00 b0 00 10     
   55 a3 f1 0d 00 c0 00 10      
   55 a3 f1 0f 00 e0 00 10      
   55 a3 f1 10 00 f0 00 10     
   55 a3 f1 11 00 00 00 10     
   55 a3 f1 12 00 10 00 10     
   55 a3 f1 13 00 20 00 10     
   55 a3 f1 14 00 30 00 10     
   55 a3 f1 15 00 40 00 10     
   55 a3 f1 16 00 50 00 10     
   55 a3 f1 17 00 60 00 10     
   55 a3 f1 18 00 70 00 10     
   55 a3 f1 19 00 80 00 10     
   55 a3 f1 1a 00 90 00 10     
   55 a3 f2 1b 00 a0 00 09    40960 - 2304
```

#### draw_image (0xA2)

draw on image at x,y coordinates. this will send small image data that has the counters like temp, load, memory usage, power usage, time, date, fan speed, etc... 

```
struct patch_image {
    uint8_t header;   // 0x55
    uint8_t command;  // 0xA2
    uint16_t x;       // 0x0012 x=18
    uint16_t y;       // 0x0032 y=50
    uint16_t length;  // 0x0C18 3096 bytes
}
```

data looks like this (image data omited):

```
55 a2 12 00 32 00 18 0c 
55 a2 12 00 26 00 18 0c 
55 a2 12 00 18 00 18 0c 
55 a2 12 00 0a 00 18 0c
```

## Code

soon...

## Additional Documentation and Acknowledgments

* WireShark
* IDA
