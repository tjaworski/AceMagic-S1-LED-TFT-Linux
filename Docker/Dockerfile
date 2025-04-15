# Используем Alpine Linux с Node.js 18.13
FROM alpine:latest

# Устанавливаем зависимости: Node.js, npm, git и sudo (хотя в Docker sudo обычно не нужен)
RUN apk --no-cache add \
    nodejs \
    make \
    g++ \
    gcc \
    npm \
    git \
    bash \
    sudo \
    python3 \
    py3-pip \
    build-base \
    autoconf \
    automake \
    libtool \
    pkgconf \
    libusb \
    libusb-dev \
    libudev-zero \
    python3-dev

# Клонируем репозиторий
RUN git clone https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux.git /acemagic
RUN git clone https://github.com/Piero24/acemagic-S1-panel-conf.git /acemagic_theme_main
RUN cp -r /acemagic_theme_main/main /acemagic/s1panel/themes/

RUN apk add --no-cache \
    libffi-dev \
    openssl-dev \
    libjpeg-turbo-dev \
    zlib-dev \
    cairo-dev \
    pango-dev \
    pangomm-dev \
    libpng \
    libpng-dev \
    giflib-dev \
    jpeg-dev \
    freetype-dev
RUN apk add --no-cache pixman pixman-dev cairo pango giflib librsvg-dev
RUN apk add --no-cache font-liberation
RUN fc-cache -f

RUN mkdir /usr/share/fonts/truetype && cp -r /usr/share/fonts/liberation /usr/share/fonts/truetype
# Проверяем версии
RUN node -v && npm -v && python3 --version && pip --version && gcc --version && make --version

# Переходим в директорию s1panel и запускаем установку
WORKDIR /acemagic/s1panel
# RUN chmod +x ./install
RUN npm update
WORKDIR /acemagic/s1panel/gui
RUN npm install
RUN npm run build

COPY ./config.json /acemagic/s1panel
COPY ./portrait_simple.json /acemagic/s1panel/themes/simple_demo
# (Опционально) Можно указать команду для запуска после установки
expose 8686
WORKDIR /acemagic/s1panel
ENTRYPOINT node main.js
