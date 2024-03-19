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

```c++
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

```c++
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
   55 a3 f1 11 00 00 00 10   (see warning below)  
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

> [!WARNING]
> The offset field is ignored since it wraps around back to 0 at sequence 0x11. I am assuming the firmware will use the sequence to figure out the offset. 

#### draw_sprite (0xA2)

draw a sprite at x,y coordinates. this will send small image data that has the counters like temp, load, memory usage, power usage, time, date, fan speed, etc... because the framebuffer is slow, this is used to update portions of the framebuffer quickly.

```c++
struct draw_sprite {
    uint8_t header;   // 0x55
    uint8_t command;  // 0xA2
    uint16_t x;       // 0x0012 x=18
    uint16_t y;       // 0x0032 y=50
    uint16_t length;  // 0x0C18 3096 bytes
};
```

data looks like this (image data omited):

```
55 a2 12 00 32 00 18 0c 
55 a2 12 00 26 00 18 0c 
55 a2 12 00 18 00 18 0c 
55 a2 12 00 0a 00 18 0c
```
## Image Data

the screen is a 320 x 170 x 2 (16-bit color) framebuffer. the 0,0 is upper right when in portrait orientation, or upper left when in landscape. the pixel format is RGB565. had to do an endian swap when setting the pixel.

```c++

#define RGB565(r, g, b) (((r & 0x1F) << 11) | ((g & 0x3F) << 5) | (b & 0x1F))
#define SWAPENDIAN(num) (num>>8) | (num<<8);

color = RGB565(red, green, blue);
*pixel = SWAPENDIAN(color);

```

here is an example cycle through red, green, blue, and a color gradient. sorry about the quality, it looks much better in person.

![alt text](images/framebuffer.gif?raw=true)
![alt text](images/colors_small.png?raw=true)

here is the code for the above:

```c++
    const int width = 320;
    const int height = 170;
    
    unsigned char *framebuffer =  (unsigned char *)calloc(width * height, 2);
    
    for (int i = 0; i < 5; i++) {
    
        unsigned char* ptr = framebuffer;
    
        for (int y = 0; y < height; y++) {
    
            for (int x = 0; x < width; x++) {
    
                uint16_t* pixel = (uint16_t*)ptr;
                uint16_t color = 0;
    
                switch (i) {
    
                    case 0:  // black, clear the screen
                        break;
    
                    case 1:  // red
                        {
                            uint8_t intensity = (uint8_t)((y * 31) / (height - 1));
                            color = RGB565(intensity, 0, 0);
                        }
                        break;
                    case 2: // green
                        {
                            uint8_t intensity = (uint8_t)((y * 63) / (height - 1));
                            color = RGB565(0, intensity, 0);
                        }
                        break;
                    case 3: // blue
                        {
                            uint8_t intensity = (uint8_t)((y * 31) / (height - 1));
                            color = RGB565(0, 0, intensity);
                        }
                        break;
                    case 4: // gradient
                        {
                            uint8_t red_intensity = (uint8_t)((x * 31) / (width - 1));
                            uint8_t green_intensity = (uint8_t)((y * 63) / (height - 1));
                            uint8_t blue_intesity = (uint8_t)(((width - x - 1) * 31) / (width - 1));
                            color = RGB565(red_intensity, green_intensity, blue_intesity);
                        }
                        break;
                }
    
                *pixel = SWAPENDIAN(color);
                ptr += 2;
            }
        }
    
        if (-1 == set_image(handle)) {
            break;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    }
```

## Commands for LED strip

the LCD strip used a 5 byte buffer, with a signature 0xfa followed by theme, intensity, speed and a checksum. you open the device like a regular serial port and write bytes to it.

```c++
struct led_command {
    uint8_t signature; // 0xfa
    uint8_t theme;     
    uint8_t intensity;
    uint8_t speed; 
    uint8_t checksum;
};
```
#### theme
```
0x01 = rainbow
0x02 = breathing
0x03 = color cycle
0x04 = off
0x05 = automatic
```
#### intensity
```
0x01 = level 5
0x02 = level 4
0x03 = level 3
0x04 = level 2
0x05 = level 1
```
#### speed
```
0x01 = level 5
0x02 = level 4
0x03 = level 3
0x04 = level 2
0x05 = level 1
```
#### checksum

```
crc = LSB(signature + theme + intensity + speed)
```

turning off the led strip you will need to send the intesity and speed too. 


## Putting it all together

coming soon, but the idea is to have a framebuffer that can be drawn on, (charts, text, animation, etc...), and having simple api that can either redraw() the whole screen, or send changed updates(). It is too bad that the screen draw is so slow.

## Additional Documentation and Acknowledgments

* WireShark
* IDA
* [Application Notes for AN0619](https://www.holtek.com/page/applicationNotes/AN0619)
* [ESK32-A2A31_UserManual v100 pdf](https://www.holtek.com/WebAPI/187541/ESK32-A2A31_UserManualv100.pdf/c8975661-c04f-4b33-8cc2-dc2e5aa3026c)
* [ESK32-A2A31 Dev Kit](https://www.holtek.com/page/detail/dev_kit/ESK32-A2A31)

