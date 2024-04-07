<template>

<div class="flex flex-wrap justify-content-start w-full mt-3 gap-3">

    <div class="flex align-items-center justify-content-center w-16rem">
        <div>
            <label class="w-full text-sm" for="x">X (0 - {{getRectMaxX() }})</label>
            <InputNumber id="x" v-model.number="rect.x" class="w-full mb-3" :useGrouping="false" @update:modelValue="onSetRectX()"/>
            <Slider v-model="rect.x" class="w-full" :min="0" :max="getRectMaxX()" @update:modelValue="onUpdateRect()"/>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div>
            <label class="w-full text-sm" for="x">Y (0 - {{ getRectMaxY() }})</label>
            <InputNumber id="Y" v-model.number="rect.y" class="w-full mb-3" :useGrouping="false" @update:modelValue="onSetRectY()"/>
            <Slider v-model="rect.y" class="w-full" :min="0" :max="getRectMaxY()" @update:modelValue="onUpdateRect()"/>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div>
            <label class="w-full text-sm" for="width">Width (1 - {{ getRectMaxWidth() }})</label>
            <InputNumber id="width" v-model.number="rect.width" class="w-full mb-3" :useGrouping="false" @update:modelValue="onSetRectWidth()"/>
            <Slider v-model="rect.width" class="w-full" :min="1" :max="getRectMaxWidth()" @update:modelValue="onUpdateRect()"/>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div>
            <label class="w-full text-sm" for="height">Height (1 - {{getRectMaxHeight()}})</label>
            <InputNumber id="height" v-model.number="rect.height" class="w-full mb-3" :useGrouping="false" @update:modelValue="onSetRectHeight()"/>
            <Slider v-model="rect.height" class="w-full" :min="1" :max="getRectMaxHeight()" @update:modelValue="onUpdateRect()"/>
        </div>
    </div>

</div>

</template>

<script> 

/*!
 * s1panel-gui - RectEdit.vue
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */

export default {
    props: ['portrait', 'rect'],
    emits: ['update:modelValue'],
    data() {
        return { 
        };
    },
    methods: {

        onSetRectX() {

            const _screen_width = this.portrait ? 170 : 320;

            if (this.rect.x + this.rect.width > _screen_width) {
                this.rect.x = _screen_width - this.rect.width;
            }

            this.$emit('update:modelValue', this.rect);
        },
        onSetRectY() {

            const _screen_height = this.portrait ? 320 : 170;

            if (this.rect.y + this.rect.height > _screen_height) {
                this.rect.y = _screen_height - this.rect.height;
            }
            this.$emit('update:modelValue', this.rect);
        },
        onSetRectWidth() {

            const _screen_width = this.portrait ? 170 : 320;

            if (this.rect.x + this.rect.width > _screen_width) {
                this.rect.width = _screen_width - this.rect.x;
            }
            else if (this.rect.width < 1) {
                this.rect.width = 1;
            }
            this.$emit('update:modelValue', this.rect);
        },
        onSetRectHeight(id, rect) {

            const _screen_height = this.portrait ? 320 : 170;

            if (this.rect.y + this.rect.height > _screen_height) {
                this.rect.height = _screen_height - this.rect.y;
            }
            else if (this.rect.width < 1) {
                this.rect.width = 1;
            }
            this.$emit('update:modelValue', this.rect);
        },
        getRectMaxX(rect) {

            const _screen_width = this.portrait ? 170 : 320;
            return _screen_width - this.rect.width;
        },            
        getRectMaxY(rect) {

            const _screen_height = this.portrait ? 320 : 170;
            return _screen_height - this.rect.height;
        },
        getRectMaxWidth(rect) {

            const _screen_width = this.portrait ? 170 : 320;
            return _screen_width - this.rect.x;
        },
        getRectMaxHeight(rect) {

            const _screen_height = this.portrait ? 320 : 170;
            return _screen_height - this.rect.y;
        },
        onUpdateRect() {
            this.$emit('update:modelValue', this.rect);
        }
    }
}

</script>