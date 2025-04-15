FROM alpine:latest

RUN apk --no-cache add \
    make \
    g++ \
    gcc \
    git \
    bash \
    sudo \
    pkgconf \
    openssl-dev \
    python3 \
    python3-dev \
    py3-pip \
    build-base \
    autoconf \
    automake

RUN apk --no-cache add \
    npm \
    nodejs

RUN apk --no-cache add \
    libtool \
    libusb \
    libusb-dev \
    libudev-zero \
    libffi-dev \
    libjpeg-turbo-dev \
    zlib-dev \
    cairo-dev \
    pango-dev \
    pangomm-dev \
    libpng \
    libpng-dev \
    giflib-dev \
    jpeg-dev \
    librsvg-dev \
    giflib \
    freetype-dev

RUN apk add --no-cache pixman pixman-dev cairo pango

# Fonts (not all yet installed)
RUN apk add --no-cache font-liberation 
RUN fc-cache -f
RUN mkdir /usr/share/fonts/truetype && cp -r /usr/share/fonts/liberation /usr/share/fonts/truetype

# main repo
RUN git clone https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux.git /acemagic
# additional theme
RUN git clone https://github.com/Piero24/acemagic-S1-panel-conf.git /acemagic_theme_main
RUN cp -r /acemagic_theme_main/main /acemagic/s1panel/themes/

# Just check versions
RUN node -v && npm -v && python3 --version && pip --version && gcc --version && make --version

# collect packages and build what is needed
WORKDIR /acemagic/s1panel
RUN npm update
WORKDIR /acemagic/s1panel/gui
RUN npm install
RUN npm run build


# copy one more theme to container and local config
COPY ./config.json /acemagic/s1panel
ADD ./themes/theme1 /acemagic/s1panel/themes/theme1

expose 8686
WORKDIR /acemagic/s1panel
ENTRYPOINT node main.js
