<template>

<div class="flex flex-wrap justify-content-start w-full mt-3 gap-3">

    <div class="flex align-items-center justify-content-center w-16rem">
        <div class="w-16rem">
            <label class="w-full text-sm" for="family">Family</label>
            <Dropdown id="family" class="w-full" v-model="edit_family" :options="family" placeholder="Pick a Font"  @update:modelValue="onChange()">
                <template #option="item">
                    <div :style="'font-family:' + item.option">{{ item.option }}</div> 
                </template>
            </Dropdown>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div class="w-16rem">
            <label class="w-full text-sm" for="size">Size</label>
            <InputNumber id="size" inputClass="w-10rem" v-model="edit_size" suffix=" px" :min="7" :max:="32" showButtons buttonLayout="horizontal" :step="1" :useGrouping="false"  @update:modelValue="onChange()">
                <template #incrementbuttonicon>
                    <span class="pi pi-plus" />
                </template>
                <template #decrementbuttonicon>
                    <span class="pi pi-minus" />
                </template>
            </InputNumber>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div class="w-16rem">
            <label class="w-full text-sm" for="style">Style</label>
            <Dropdown id="style" class="w-full" v-model="edit_style" :options="style" placeholder="Normal"  @update:modelValue="onChange()"/>
        </div>
    </div>

    <div class="flex align-items-center justify-content-center w-16rem">
        <div class="w-16rem">
            <label class="w-full text-sm" for="weight">Weight</label>
            <Dropdown id="weight" class="w-full" v-model="edit_weight" :options="weight" placeholder="Normal"  @update:modelValue="onChange()"/>
        </div>
    </div>

</div>
    
</template>
    
<script> 

/*!
 * s1panel-gui - FontEdit.vue
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */

export default {
    props: ['value'],
    emits: ['update:modelValue'],
    data() {
        return { 
            edit_family: null,
            edit_size: null,
            edit_style: 'Normal',
            edit_weight: 'Normal',
            style: [ 'Normal', 'Italic', 'Oblique' ],
            weight: [ 'Normal', 'Bold', 'Bolder', 'Lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900' ],
            size: 12,
            family: [ 'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Helvetica', 'Garamond' ].sort(),
        };
    },
    mounted() {

        if (this.value && this.value.font) {

            const _regex = /(?:^(.*)\s)?(\d+px)\s(.*)$/i;
            const _font = this.value.font;

            var _matches = _font.match(_regex);
            if (_matches) {

                if (_matches[1]) {

                    _matches[1].split(' ').forEach(token => {
                        
                        this.edit_style = this.style.find(each => {

                            const _value = each.toLowerCase();
                            return _value !== 'normal' && token.includes(_value);

                        }) || 'Normal';

                        this.edit_weight = this.weight.find(each => {   

                            const _value = each.toLowerCase();
                            return _value !== 'normal' && token.includes(_value);

                        }) || 'Normal';
                    });                
                }

                if (_matches[2]) {
                    this.edit_size = parseInt(_matches[2]);
                }

                if (_matches[3]) {
                    this.edit_family = _matches[3];
                } 
            }
        }       
    },
    methods: {
        onChange() {

            var _font_string = '';
            var _count = 0;

            if (this.edit_style && this.edit_style !== 'Normal') {

                _font_string = this.edit_style.toLowerCase();
                _count++;
            }

            if (this.edit_weight && this.edit_weight !== 'Normal') {
               
                if (_count) {
                    _font_string += ' ' + this.edit_weight.toLowerCase();
                }
                else {
                    _font_string =  this.edit_weight.toLowerCase();
                }
                _count++;
            }

            if (this.edit_size) {
             
                if (_count) {
                    _font_string += ' ' + this.edit_size + 'px';
                }
                else {
                    _font_string = this.edit_size + 'px';
                }
                _count++;
            }

            if (this.edit_family) {

                if (_count) {
                    _font_string += ' ' + this.edit_family;
                }
                else {
                    _font_string = this.edit_family;
                }
                _count++;
            }

            this.value.font = _font_string;

            if (_count > 1) {
                this.$emit('update:modelValue', _font_string);
            }
        }
    }
}

</script>