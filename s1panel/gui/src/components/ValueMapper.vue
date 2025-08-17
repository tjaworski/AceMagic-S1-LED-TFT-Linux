<template>
    <div v-if="modelValue" class="mt-3 p-3 border-1 surface-border border-round">
        <div class="flex align-items-center mb-3">
            <InputSwitch v-model="modelValue.enabled" @update:modelValue="emitUpdate" />
            <label class="ml-2 font-semibold">{{ t('labels.valueMapping.enable') }}</label>
        </div>

        <div v-if="modelValue.enabled">
            <!-- Rules List -->
            <div v-for="(rule, ruleIndex) in modelValue.rules" :key="ruleIndex" class="p-3 border-1 surface-border border-round mb-3">
                <div class="flex align-items-center justify-content-between mb-2">
                    <span class="font-medium text-primary">{{ t('labels.valueMapping.rule') }} {{ ruleIndex + 1 }}</span>
                    <Button 
                        icon="pi pi-trash" 
                        severity="danger" 
                        size="small"
                        text
                        @click="removeRule(ruleIndex)" 
                        :title="t('buttons.remove')"
                    />
                </div>

                <!-- Conditions for this rule -->
                <div v-for="(condition, condIndex) in rule.conditions" :key="condIndex" class="mb-2">
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon font-medium">
                            {{ condIndex === 0 ? t('labels.valueMapping.if') : '' }}
                        </span>
                        
                        <!-- Operator Dropdown -->
                        <Dropdown 
                            v-model="condition.operator" 
                            :options="operatorOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            @update:modelValue="emitUpdate"
                            :placeholder="t('placeholders.valueMapping.operator')"
                            class="w-10rem"
                        />
                        
                        <!-- Value Input -->
                        <InputText 
                            v-model="condition.value" 
                            @update:modelValue="emitUpdate"
                            :placeholder="t('placeholders.valueMapping.conditionValue')" 
                            class="flex-1"
                        />
                        
                        <!-- Logic Operator for chaining (except for last condition) -->
                        <Dropdown 
                            v-if="condIndex < rule.conditions.length - 1"
                            v-model="condition.logicOperator" 
                            :options="logicOperatorOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            @update:modelValue="emitUpdate"
                            class="w-6rem"
                        />
                        
                        <!-- Remove condition button -->
                        <Button 
                            icon="pi pi-minus" 
                            severity="secondary" 
                            @click="removeCondition(ruleIndex, condIndex)"
                            :title="t('buttons.remove')"
                        />
                    </div>
                </div>

                <!-- Add condition button -->
                <div class="mb-2">
                    <Button 
                        :label="t('buttons.valueMapping.addCondition')" 
                        icon="pi pi-plus" 
                        @click="addCondition(ruleIndex)" 
                        size="small"
                        text
                        class="p-button-sm"
                    />
                </div>

                <!-- Then value -->
                <div class="p-inputgroup">
                    <span class="p-inputgroup-addon font-medium">{{ t('labels.valueMapping.then') }}</span>
                    <InputText 
                        v-model="rule.then" 
                        @update:modelValue="emitUpdate"
                        :placeholder="t('placeholders.valueMapping.result')" 
                        class="flex-1"
                    />
                </div>
            </div>

            <!-- Add rule button -->
            <div class="mb-3">
                <Button 
                    :label="t('buttons.valueMapping.addRule')" 
                    icon="pi pi-plus" 
                    @click="addRule" 
                    size="small"
                    outlined
                />
            </div>

            <!-- Default/Else value -->
            <div class="p-inputgroup">
                <span class="p-inputgroup-addon font-medium">{{ t('labels.valueMapping.else') }}</span>
                <InputText 
                    v-model="modelValue.else" 
                    @update:modelValue="emitUpdate"
                    :placeholder="t('placeholders.valueMapping.defaultValue')" 
                    class="flex-1"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({ 
    modelValue: Object 
});
const emit = defineEmits(['update:modelValue']);

const operatorOptions = computed(() => [
    { label: t('labels.valueMapping.operators.equals'), value: 'equals' },
    { label: t('labels.valueMapping.operators.notEqual'), value: 'notEqual' },
    { label: t('labels.valueMapping.operators.greaterThan'), value: 'greaterThan' },
    { label: t('labels.valueMapping.operators.lessThan'), value: 'lessThan' },
    { label: t('labels.valueMapping.operators.greaterOrEqual'), value: 'greaterOrEqual' },
    { label: t('labels.valueMapping.operators.lessOrEqual'), value: 'lessOrEqual' },
    { label: t('labels.valueMapping.operators.contains'), value: 'contains' },
    { label: t('labels.valueMapping.operators.notEmpty'), value: 'notEmpty' }
]);

const logicOperatorOptions = computed(() => [
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' }
]);

function emitUpdate() {
    emit('update:modelValue', props.modelValue);
}

function addRule() {
    if (!props.modelValue.rules) {
        props.modelValue.rules = [];
    }
    props.modelValue.rules.push({
        conditions: [
            { operator: 'equals', value: '', logicOperator: 'AND' }
        ],
        then: ''
    });
    emitUpdate();
}

function removeRule(index) {
    props.modelValue.rules.splice(index, 1);
    emitUpdate();
}

function addCondition(ruleIndex) {
    const rule = props.modelValue.rules[ruleIndex];
    if (!rule.conditions) {
        rule.conditions = [];
    }
    rule.conditions.push({
        operator: 'equals',
        value: '',
        logicOperator: 'AND'
    });
    emitUpdate();
}

function removeCondition(ruleIndex, conditionIndex) {
    const rule = props.modelValue.rules[ruleIndex];
    rule.conditions.splice(conditionIndex, 1);
    
    // If no conditions left, remove the entire rule
    if (rule.conditions.length === 0) {
        removeRule(ruleIndex);
    } else {
        emitUpdate();
    }
}
</script>
