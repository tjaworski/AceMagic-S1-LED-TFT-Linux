<template>

    <ConfirmPopup></ConfirmPopup>

    <ConfirmDialog group="headless1">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                <div class="border-circle bg-red-500 inline-flex justify-content-center align-items-center h-6rem w-6rem -mt-8">
                    <i class="pi pi-exclamation-circle text-5xl"></i>
                </div>
                <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex align-items-center gap-2 mt-4">
                    <Button :label="t('buttons.delete')" @click="acceptCallback" class="w-8rem" severity="danger"></Button>
                    <Button :label="t('buttons.cancel')" outlined @click="rejectCallback" class="w-8rem"></Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>

    <ConfirmDialog group="headless2">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                <div class="border-circle bg-red-500 inline-flex justify-content-center align-items-center h-6rem w-6rem -mt-8">
                    <i class="pi pi-exclamation-circle text-5xl"></i>
                </div>
                <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex align-items-center gap-2 mt-4">
                    <Button :label="t('buttons.save')" @click="acceptCallback" class="w-8rem" severity="success"></Button>
                    <Button :label="t('buttons.discard')" outlined @click="rejectCallback" class="w-8rem" severity="danger"></Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>

    <ConfirmDialog group="headless3">
        <template #container="{ message, rejectCallback }">
            <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                <div class="border-circle bg-red-500 inline-flex justify-content-center align-items-center h-6rem w-6rem -mt-8">
                    <i class="pi pi-exclamation-circle text-5xl"></i>
                </div>
                <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex align-items-center gap-2 mt-4">
                    <Button :label="t('buttons.ok')" outlined @click="rejectCallback" class="w-8rem" severity="danger"></Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>

    <ConfirmDialog group="headless4">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                <div class="border-circle bg-red-500 inline-flex justify-content-center align-items-center h-6rem w-6rem -mt-8">
                    <i class="pi pi-exclamation-circle text-5xl"></i>
                </div>
                <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex align-items-center gap-2 mt-4">
                    <Button :label="t('buttons.rename')" @click="acceptCallback" class="w-8rem" severity="success"></Button>
                    <Button :label="t('buttons.keep')" outlined @click="rejectCallback" class="w-8rem" severity="danger"></Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>

    <Dialog v-model:visible="config_manager.show" maximizable modal :header="t('dialog.settings.header')" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div class="flex justify-content-start flex-wrap w-full gap-3">
            <div class="field p-fluid w-full">
                <label class="w-full text-sm" for="listen">{{ t('dialog.settings.listenLabel') }}</label>
                <InputText id="listen" v-model="config_manager.listen" />
                <small>{{ t('dialog.settings.listenHelp') }}</small>
            </div>
        </div>

        <div class="flex justify-content-start flex-wrap w-full gap-3">
            <div class="field p-fluid w-full">
                <label class="w-full text-sm" for="poll">{{ t('dialog.settings.pollLabel') }}</label>
                <InputNumber id="poll" v-model="config_manager.poll" :useGrouping="false" :min="0" suffix=" ms"></InputNumber>
                <small>{{ t('dialog.settings.pollHelp') }}</small>
            </div>
        </div>

        <div class="flex justify-content-start flex-wrap w-full gap-3">
            <div class="field p-fluid w-full">
                <label class="w-full text-sm" for="refresh">{{ t('dialog.settings.refreshLabel') }}</label>
                <InputNumber id="refresh" v-model="config_manager.refresh" :useGrouping="false" :min="0" suffix=" ms"></InputNumber>
                <small>{{ t('dialog.settings.refreshHelp') }}</small>
            </div>
        </div>

        <div class="flex justify-content-start flex-wrap w-full gap-3">
            <div class="field p-fluid w-full">
                <label class="w-full text-sm" for="heartbeat">{{ t('dialog.settings.heartbeatLabel') }}</label>
                <InputNumber id="heartbeat" v-model="config_manager.heartbeat" :useGrouping="false" :min="0" suffix=" ms"></InputNumber>
                <small>{{ t('dialog.settings.heartbeatHelp') }}</small>
            </div>
        </div>

        <div class="flex justify-content-start flex-wrap w-full gap-3">
            <div class="field p-fluid w-full">
                <label class="w-full text-sm" for="language">{{ t('dialog.settings.languageLabel') }}</label>
                <Dropdown
                    id="language"
                    v-model="config_manager.language"
                    :options="supportedLanguageOptions"
                    optionLabel="name"
                    optionValue="code"
                />
                <small>{{ t('dialog.settings.languageHelp') }}</small>
            </div>
        </div>

        <div class="flex justify-content-end align-items-center gap-2 mt-4">
            <Button :label="t('buttons.save')" class="w-8rem" severity="primary" :disabled="config_manager.saving" @click="onSaveConfig()"></Button>
            <Button :label="t('buttons.cancel')" outlined class="w-8rem" severity="secondary" @click="config_manager.show = false"></Button>
        </div>

    </Dialog>

    <Dialog v-model:visible="theme_manage.show" maximizable modal :header="t('dialog.manageThemes.header')" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div class="h-30rem">
            <DataTable ref="dt" :value="config.theme_list" dataKey="name"
                :paginator="config.theme_list.length > 5"
                :rows="10"
                :filters="theme_manage.filters"
                :rowsPerPageOptions="[5,10,25]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :currentPageReportTemplate="t('dialog.manageThemes.tableHeader')">

                <template #header>
                    <div class="flex justify-content-start flex-wrap w-full gap-3 mb-3">
                        <div class="w-6">
                            <label class="w-full text-sm" for="themeName">{{ t('buttons.addTheme') }}</label>
                            <InputGroup>
                                <InputText id="themeName" v-model="theme_manage.name" :placeholder="t('placeholders.themeName')" />
                                <Button icon="pi pi-plus" severity="success" outlined @click="onAddTheme()" :disabled="!theme_manage.name || !theme_manage.name.length"></Button>
                            </InputGroup>
                        </div>
                    </div>
                </template>

                <Column field="name" :header="t('labels.name')" sortable>
                    <template #body="row">
                        <div class="grid">
                            <div class="col-10">
                                <div class="col-12 text-overflow-ellipsis">
                                    {{ row.data.name }}
                                    <Tag v-if="edit_theme === row.data.config" class="ml-3" severity="info" :value="t('labels.active')" rounded></Tag>
                                </div>
                                <div class="col-12 text-overflow-ellipsis text-sm text-gray-500">{{ row.data.config }}</div>
                            </div>
                            <div class="col-2 flex align-items-center justify-content-center">
                                <Button size="small" text plain @click="onDeleteTheme($event, row.data)" :disabled="config.theme_list.length <= 1 || edit_theme === row.data.config">
                                    <i class="pi pi-trash" style="color: #ff0000"></i>
                                </Button>
                            </div>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </Dialog>

    <Dialog v-model:visible="sensor_manage.show" maximizable modal :header="t('dialog.sensorManage.header')" :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div class="h-65rem">

            <DataTable ref="dt" :value="sensor_manage.list" dataKey="name"
                :paginator="sensor_manage.list.length > 10"
                :rows="10"
                :filters="sensor_manage.filters"
                :rowsPerPageOptions="[5,10,25]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :currentPageReportTemplate="t('dialog.manageThemes.tableHeader')">

                <template #header>
                    <div class="flex justify-content-start flex-wrap w-full gap-3 mb-3">
                        <div class="w-6">
                            <Button size="small" text plain @click="onOpenAddSensor()">
                                <i class="pi pi-plus mr-2" style="color: #1bd443"></i>{{ t('buttons.addSensor') }}
                            </Button>
                        </div>
                    </div>
                </template>

                <Column field="name" :header="t('labels.name')" sortable>

                    <template #body="row">

                        <div class="text-overflow-ellipsis">{{ row.data.name }}</div>

                    </template>

                </Column>

                <Column field="info.name" :header="t('labels.type')" sortable>

                    <template #body="row">

                        <div class="text-overflow-ellipsis">
                            <i v-if="row.data.info.icon" :class="'pi ' + row.data.info.icon +' mr-2'"></i>{{ row.data.info.name }}
                        </div>

                    </template>

                </Column>

                <Column field="info.description" :header="t('labels.description')" sortable>

                    <template #body="row">

                        <div class="text-overflow-ellipsis">{{ row.data.info.description }}</div>

                    </template>

                </Column>

                <Column field="" :header="t('labels.action')">

                    <template #body="row">

                        <div class="flex justify-content-start flex-nowrap w-full gap-1">

                            <Button v-if="row.data.info.fields.length" class="ml-2" size="small" text plain @click="onSensorEdit(row.data)">
                                <i class="pi pi-pencil mr-2" style="color: cyan"></i>{{ t('buttons.edit') }}
                            </Button>

                            <Button v-if="row.data.info.multiple" class="ml-2" size="small" text plain @click="onSensorRemove(row.data)">
                                <i class="pi pi-trash mr-2" style="color: #ff0000"></i>{{ t('buttons.remove') }}
                            </Button>

                        </div>

                    </template>

                </Column>

            </DataTable>

        </div>

    </Dialog>

    <Dialog v-model:visible="sensor_manage.show_add" maximizable modal :header="t('dialog.addSensor.header')" :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div class="h-35rem">

            <div class="w-full md:w-6">
                <label class="w-full text-sm" for="sensor">{{ t('labels.sensor') }}</label>
                <Dropdown id="sensor" v-model="sensor_manage.picked" :options="sensor_manage.sensors" optionValue="id" optionLabel="name" :placeholder="t('placeholders.pickSensor')" class="w-full" @update:modelValue="onSensorAddChange()"/>
            </div>

        </div>

        <div v-if="sensor_manage.picked">

            <ul>
                <li v-for="(item, index) in sensor_manage.config_data.fields" :key="index"  class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                    <div class="text-500 w-11rem font-medium">
                        {{ item.name }}
                    </div>

                    <div class="text-900 w-full">
                        <div v-if="item.type === 'string'">
                            <InputText class="w-full sm:w-16rem" type="text" v-model="item.value"/>
                        </div>
                        <div v-else-if="item.type === 'number'">
                            <InputNumber class="w-full sm:w-16rem" v-model="item.value" :useGrouping="false"/>
                        </div>
                        <div v-else-if="item.type === 'list'">
                            <Dropdown class="w-full sm:w-16rem" v-model="item.value" :options="item.list" :placeholder="t('placeholders.chooseAnOption')"/>
                        </div>
                        <div v-else-if="item.type === 'boolean'">
                            <InputSwitch v-model="item.value"/>
                        </div>
                        <div v-else>
                            {{ item.value }}
                        </div>
                    </div>
                </li>
            </ul>

            <div class="flex justify-content-end align-items-center gap-2 mt-4">
                <Button :label="t('buttons.save')" class="w-8rem" severity="primary" :disabled="sensor_manage.saving" @click="onAddSensor()"></Button>
                <Button :label="t('buttons.cancel')" outlined class="w-8rem" severity="secondary" @click="sensor_manage.show_add = false"></Button>
            </div>

        </div>

    </Dialog>


    <Dialog v-model:visible="sensor_manage.show_edit" maximizable modal :header="t('dialog.editSensor.header')" :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <ul>
            <li v-for="(item, index) in sensor_manage.edit.info.fields" :key="index"  class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                <div class="text-500 w-11rem font-medium">
                    {{ item.name }}
                </div>

                <div class="text-900 w-full">
                    <div v-if="item.type === 'string'">
                        <InputText class="w-full sm:w-16rem" type="text" v-model="item.value"/>
                    </div>
                    <div v-else-if="item.type === 'number'">
                        <InputNumber class="w-full sm:w-16rem" v-model="item.value" :useGrouping="false"/>
                    </div>
                    <div v-else-if="item.type === 'list'">
                        <Dropdown class="w-full sm:w-16rem" v-model="item.value" :options="item.list" :placeholder="t('placeholders.chooseAnOption')"/>
                    </div>
                    <div v-else-if="item.type === 'boolean'">
                        <InputSwitch v-model="item.value"/>
                    </div>
                    <div v-else>
                        {{ item.value }}
                    </div>
                </div>
            </li>
        </ul>

        <div class="flex justify-content-end align-items-center gap-2 mt-4">
            <Button :label="t('buttons.save')" class="w-8rem" severity="primary" :disabled="sensor_manage.saving" @click="onSensorSave()"></Button>
            <Button :label="t('buttons.cancel')" outlined class="w-8rem" severity="secondary" @click="sensor_manage.show_edit = false"></Button>
        </div>

    </Dialog>

    <Dialog v-model:visible="screen_manage.show" maximizable modal :header="t('dialog.manageScreens.header')" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div class="h-30rem">

            <DataTable ref="dt" :value="theme.screens" dataKey="name"
                :paginator="config.theme_list.length > 5"
                :rows="10"
                :filters="theme_manage.filters"
                :rowsPerPageOptions="[5,10,25]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :currentPageReportTemplate="t('dialog.manageThemes.tableHeader')">

                <template #header>

                    <div class="flex justify-content-start flex-wrap w-full gap-3 mb-3">
                        <div class="w-6">
                            <label class="w-full text-sm" for="screen">{{ t('buttons.addScreen') }}</label>
                            <InputGroup>
                                <InputText id="screen" v-model="screen_manage.name" :placeholder="t('placeholders.screenName')" />
                                <Button icon="pi pi-plus" severity="success" outlined @click="onAddScreen()" :disabled="!screen_manage.name || !screen_manage.name.length"></Button>
                            </InputGroup>
                        </div>
                    </div>

                </template>

                <Column field="name" :header="t('labels.name')" sortable>

                    <template #body="row">

                        <div class="flex justify-content-between flex-wrap">
                            <div class="flex align-items-center justify-content-center">
                                {{ row.data.name }} <Tag v-if="screen_manage.active === row.data.id" class="ml-3" severity="info" :value="t('labels.active')" rounded></Tag>
                            </div>
                            <div class="flex align-items-center justify-content-center">
                                <Button size="small" text plain :disabled="screen.id === row.data.id || screen_manage.active === row.data.id" @click="onDeleteScreen($event, row.data.id)">
                                    <i class="pi pi-trash mr-2" style="color: #ff0000"></i>{{ t('buttons.delete') }}
                                </Button>
                            </div>
                        </div>

                    </template>

                </Column>

            </DataTable>

        </div>

    </Dialog>

    <Dialog v-model:visible="widget_manage.show" modal :header="t('dialog.addWidget.header', { screenName: screen?.name })" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div>

            <div class="flex justify-content-start flex-wrap w-full gap-3 mb-3">

                <div class="w-full">
                    <label class="w-full text-sm" for="widget">{{ t('labels.widget') }}</label>
                    <Dropdown class="w-full" id="widget" v-model="widget_manage.name" :options="widgets" optionValue="name" optionLabel="name" :placeholder="t('placeholders.pickWidget')"/>
                </div>
            </div>

            <div class="flex justify-content-end align-items-center gap-2 mt-4">
                <Button :label="t('buttons.add')" class="w-8rem" severity="primary" @click="onAddWidget()"></Button>
                <Button :label="t('buttons.cancel')" outlined class="w-8rem" severity="secondary" @click="widget_manage.show = false"></Button>
            </div>

        </div>

    </Dialog>

    <Dialog v-model:visible="led_manage.show" modal :header="t('dialog.ledStrip.header')" :style="{ width: '40rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div class="flex justify-content-center flex-wrap mb-3">

            <label class="w-full text-sm text-center" for="theme">{{ getLED() }}</label>
            <SelectButton id="theme" v-model="led_manage.theme" :options="led_manage.list" optionLabel="name" optionValue="id" :allowEmpty="false" @update:modelValue="onChangeLED()" >
                <template #option="slotProps">
                    <i :class="slotProps.option.icon" style="font-size: 3rem"></i>
                </template>
            </SelectButton>

        </div>

        <div class="flex justify-content-center flex-wrap gap-3">

            <div class="field p-fluid">

                <Knob v-model="led_manage.speed" id="speed" valueColor="MediumTurquoise" rangeColor="SlateGray" :min="1" :max="5" @update:modelValue="onChangeLED()"/>
                <div class="flex gap-2 justify-content-center">
                    <Button size="small" icon="pi pi-minus" @click="onChangeLED(led_manage.speed--)" :disabled="led_manage.speed <= 1" />
                    <Button size="small" icon="pi pi-plus" @click="onChangeLED(led_manage.speed++)" :disabled="led_manage.speed >= 5" />
                </div>
                <label class="w-full text-sm text-center" for="speed">{{ t('labels.speed') }}</label>
            </div>

            <div class="field p-fluid">
                <Knob v-model="led_manage.intensity" id="intensity" valueColor="MediumTurquoise" rangeColor="SlateGray" :min="1" :max="5" @update:modelValue="onChangeLED()"/>
                <div class="flex gap-2 justify-content-center">
                    <Button size="small" icon="pi pi-minus" @click="onChangeLED(led_manage.intensity--)" :disabled="led_manage.intensity <= 1" />
                    <Button size="small" icon="pi pi-plus" @click="onChangeLED(led_manage.intensity++)" :disabled="led_manage.intensity >= 5" />
                </div>
                <label class="w-full text-sm text-center" for="intensity">{{ t('labels.intensity') }}</label>
            </div>

        </div>

    </Dialog>

    <div class="p-3">
        <div class="grid flud">
            <div class="col-5">

                <Card ref="preview" class="h-full w-full">
                    <template #title>{{ t('card.preview.header') }}</template>

                    <template #content>
                        <div class="flex justify-content-center flex-wrap">
                            <canvas ref="canvas" class="flex align-items-center justify-content-center"></canvas>
                        </div>
                    </template>

                </Card>

            </div>

            <div class="col-7">

                <Card class="h-full">
                    <template #title>{{ t('card.settings.header') }}
                        <i class="cursor-pointer pi pi-cog ml-3" style="color: #1bd443" @click="onEditConfig()"></i>
                        <i class="cursor-pointer pi pi-bolt ml-3" style="color: #ff0000" @click="onOpenSensorManage()"></i>
                    </template>
                    <template #content>

                        <ul class="list-none p-0 m-0">
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.ip') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.listen }} <Tag v-if="!connected" class="ml-2" severity="danger" :value="t('messages.lostConnection')" rounded></Tag></div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.theme') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ getThemeName(config?.theme) }}</div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.poll') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.poll }} ms</div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.refresh') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.refresh }} ms</div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.heartbeat') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.heartbeat }} ms</div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.lcd') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.device }}</div>
                            </li>
                            <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">
                                <div class="text-500 w-6 md:w-3 font-medium">{{ t('card.settings.led') }}</div>
                                <div class="text-900 w-full md:w-7 md:flex-order-0 flex-order-1">{{ config?.led_config.device }}</div>
                            </li>
                        </ul>	

                    </template>
                </Card>

            </div>

            <div class="col-12">
                <Card>
                    <template #title>
                        <div class="flex justify-content-between flex-nowrap">
                            <div class="flex align-items-center justify-content-center gap-3">
                                {{ t('card.config.header') }}<Tag v-if="unsaved_changes" severity="danger" :value="t('messages.unsavedChanges')" rounded></Tag>
                            </div>

                            <div v-if="unsaved_changes" class="flex align-items-center justify-content-center gap-3">

                                <Button severity="primary" outlined @click="onSaveTheme()">
                                    <i class="pi pi-save font-bold"></i>
                                    <span class="ml-2 hidden sm:block">{{ t('buttons.save') }}</span>
                                </Button>

                                <Button severity="info" outlined @click="onRevertTheme()">
                                    <i class="pi pi-undo font-bold"></i>
                                    <span class="ml-2 hidden sm:block">{{ t('buttons.revert') }}</span>
                                </Button>
                            </div>
                        </div>

                    </template>

                    <template #content>

                        <div class="flex justify-content-start flex-wrap w-full gap-3 mb-3">

                            <div class="w-full md:w-auto">
                                <label class="w-full text-sm" for="theme">{{ t('card.config.themeLabel') }}</label>
                                <InputGroup>
                                    <Dropdown id="theme" v-model="edit_theme" :options="config?.theme_list" optionValue="config" optionLabel="name" :placeholder="t('placeholders.pickTheme')" class="w-full" @update:modelValue="onThemeChange()"/>
                                    <Button icon="pi pi-cog" severity="help" outlined @click="onOpenThemeManage()"></Button>
                                </InputGroup>
                            </div>

                            <div class="w-full md:w-2">
                                <label class="w-full text-sm" for="orientation">{{ t('card.config.orientationLabel') }}</label>
                                <Dropdown id="orientation" v-model="edit_orientation" :options="orientationOptions" optionValue="id" optionLabel="name" :placeholder="t('placeholders.pickRefresh')" class="w-full" @update:modelValue="onOrientationChange()"/>
                            </div>

                            <div class="w-full md:w-2">
                                <label class="w-full text-sm" for="refresh">{{ t('card.config.refreshLabel') }}</label>
                                <Dropdown id="refresh" v-model="edit_refresh" :options="refreshMethodOptions" optionValue="id" optionLabel="name" :placeholder="t('placeholders.pickRefresh')" class="w-full" @update:modelValue="onRefreshChange()"/>
                            </div>

                            <div class="w-full md:w-auto">
                                <label class="w-full text-sm" for="screen">{{ t('card.config.screenLabel') }}</label>
                                <InputGroup>
                                    <Dropdown id="screen" v-model="edit_screen" :options="theme?.screens" optionValue="id" optionLabel="name" :placeholder="t('placeholders.pickScreen')" class="w-full" @update:modelValue="onScreenChange()"/>
                                    <Button icon="pi pi-cog" severity="warning" outlined @click="onOpenScreenManage()"></Button>
                                </InputGroup>
                            </div>

                        </div>

                        <Accordion :multiple="true" v-model:activeIndex="active_widgets">

                            <AccordionTab :header="screen?.name">

                                <Toolbar class="border-none -mt-4 -mb-2">

                                    <template #start>
                                    </template>

                                    <template #center>
                                    </template>

                                    <template #end>
                                        <Button size="small" text plain @click="onShowAddWidget()">
                                            <i class="pi pi-plus mr-2" style="color: green"></i>{{ t('buttons.addWidget') }}
                                        </Button>
                                    </template>

                                </Toolbar>

                                <ul class="list-none p-0 m-0">

                                    <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ t('labels.name') }}
                                        </div>
                                        <div class="text-900 w-full">

                                            <InputText class="w-full sm:w-16rem" type="text" v-model="edit_screen_name" @update:modelValue="onSetScreenName()"/>

                                        </div>
                                    </li>

                                    <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ t('labels.duration') }}
                                        </div>
                                        <div class="text-900 w-full">

                                            <InputNumber id="duration" v-model="edit_duration" class="w-full sm:w-16rem" :useGrouping="false" :min="0" suffix=" ms" @update:modelValue="onSetScreenDuration()"></InputNumber>

                                        </div>
                                    </li>

                                    <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ t('labels.background') }}
                                        </div>
                                        <div class="text-900 w-full">

                                            <div class="flex flex-nowrap w-full sm:w-16rem">
                                                <ColorPicker class="align-content-center mr-2" v-model="edit_background" inputId="cp-hex" format="hex" @update:modelValue="onSetBackground()"/>
                                                <InputText class="w-full" type="text" v-model="edit_background" @update:modelValue="onSetBackground()"/>
                                            </div>
                                        </div>
                                    </li>

                                    <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ t('labels.wallpaper') }}
                                        </div>
                                        <div class="text-900 w-full">

                                            <Image v-if="screen?.wallpaper" :src="'/api/wallpaper?screen=' + screen.id" alt="Image"/>
                                            <Button v-if="screen?.wallpaper" size="small" text plain @click="onDeleteWallpaper($event)">
                                                <i class="pi pi-trash mr-2" style="color: #6e6e6e"></i>{{ t('buttons.remove') }}
                                            </Button>
                                            <FileUpload v-if="!screen?.wallpaper" mode="basic" name="uploading" :url="'/api/upload_wallpaper?screen=' + screen?.id" accept="image/png" :maxFileSize="1000000" @upload="onUploadWallpaper" :auto="true" :chooseLabel="t('buttons.upload')" />

                                        </div>
                                    </li>

                                    <li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ t('labels.ledStrip') }}
                                        </div>
                                        <div class="text-900 w-full">

                                            <Button class="led-button" size="small" :label="t('buttons.change')" @click="onOpenLED()"></Button>

                                        </div>
                                    </li>

                                </ul>

                            </AccordionTab>

                            <AccordionTab v-for="(widget, index) in screen?.widgets" :key="widget.id">

                                <template #header>

                                    <span class="flex align-items-center w-full">
                                        {{ widget?.name }} <i class="pi pi-ellipsis-v"></i> {{ widget?.value }}
                                    </span>

                                </template>

                                <Toolbar class="border-none -mt-4 -mb-2">

                                    <template #start>
                                        <Checkbox v-model="widget.debug_frame" id="debug" :binary="true" @update:modelValue="onSetDebugFrame(widget.id)" />
                                        <label for="debug" class="ml-2 text-sm"> {{ t('labels.showFrame') }} </label>
                                    </template>

                                    <template #center>
                                        <div class="ml-auto">
                                            <Button v-tooltip.top="t('tooltips.moveTop')"    :disabled="isFirst(widget.id)" size="small" icon="pi pi-angle-double-up"   text plain rounded @click="onSwapTop(widget.id, 1 + index)" />
                                            <Button v-tooltip.top="t('tooltips.moveUp')"     :disabled="isFirst(widget.id)" size="small" icon="pi pi-angle-up"          text plain rounded @click="onSwapUp(widget.id, 1 + index)" />
                                            <Button v-tooltip.top="t('tooltips.moveDown')"   :disabled="isLast(widget.id)"  size="small" icon="pi pi-angle-down"        text plain rounded @click="onSwapDown(widget.id, 1 + index)" />
                                            <Button v-tooltip.top="t('tooltips.moveBottom')" :disabled="isLast(widget.id)"  size="small" icon="pi pi-angle-double-down" text plain rounded @click="onSwapBottom(widget.id, 1 + index)" />
                                        </div>
                                    </template>

                                    <template #end>
                                        <Button size="small" text plain @click="onDeleteWidget($event, widget.id)">
                                            <i class="pi pi-trash mr-2" style="color: #6e6e6e"></i>{{ t('labels.widget') }}
                                        </Button>
                                    </template>

                                </Toolbar>

                                <ul class="list-none p-0 m-0">
                                    <li v-for="(item, index2) in widget.table" :key="index2"  class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-nowrap">

                                        <div class="text-500 w-11rem font-medium">
                                            {{ widgetPropertyNames[item.name] || item.name }}
                                        </div>

                                        <div class="text-900 w-full">
                                            <div v-if="item.type === 'string'">

                                                <div v-if="item.name === 'name'">

                                                    {{ item.value }}

                                                </div>
                                                <div v-else-if="item.name === 'value'">

                                                    <InputGroup>
                                                        <Dropdown
                                                            class="w-full"
                                                            v-model="item.value"
                                                            :options="sensors"
                                                            optionValue="name"
                                                            optionLabel="name"
                                                            :placeholder="t('placeholders.sensorOrText')"
                                                            editable
                                                            @update:modelValue="onSensorChange(widget, item)"
                                                        />
                                                        <InputGroupAddon v-if="isAmbiguousValue(item.value)" v-tooltip.top="t('tooltips.sensorToggle')">
                                                            <InputSwitch
                                                                v-model="widget.sensor"
                                                                @update:modelValue="onSensorToggle(widget)"
                                                            />
                                                        </InputGroupAddon>
                                                    </InputGroup>

                                                </div>
                                                <div v-else>

                                                    <InputText class="w-full sm:w-16rem" type="text" v-model="item.value" @update:modelValue="onPropertyChange(widget.id, item)"/>

                                                </div>

                                            </div>
                                            <div v-else-if="item.type === 'number'">

                                                <InputNumber class="w-full sm:w-16rem" v-model="item.value" :useGrouping="false" @update:modelValue="onPropertyChange(widget.id, item)"/>

                                            </div>
                                            <div v-else-if="item.type === 'color'">

                                                <div class="flex flex-nowrap w-full sm:w-16rem">
                                                    <ColorPicker class="align-content-center mr-2" v-model="item.value" inputId="cp-hex" format="hex" @update:modelValue="onSetColorPicker(widget.id, item)"/>
                                                    <InputText class="w-full" type="text" v-model="item.value" @update:modelValue="onSetColorPicker(widget.id, item)"/>
                                                </div>

                                            </div>
                                            <div v-else-if="item.type === 'rect'">

                                                <RectEdit :portrait="'portrait' === theme.orientation" :rect="item.value" @update:modelValue="onUpdateRect(widget.id, item.value)"></RectEdit>

                                            </div>
                                            <div v-else-if="item.type === 'clock'">

                                                <InputNumber class="w-full sm:w-16rem" v-model="item.value" :useGrouping="false" suffix=" ms" :min="0" @update:modelValue="onPropertyChange(widget.id, item)"/>

                                            </div>
                                            <div v-else-if="item.type === 'font'">

                                                <FontEdit :value="widget.font_string" @update:modelValue="onFontChange(widget.id, widget.font_string)"></FontEdit>

                                            </div>
                                            <div v-else-if="item.type === 'list'">

                                                <Dropdown class="w-full sm:w-16rem" v-model="item.value" :options="item.list" :placeholder="t('placeholders.chooseAnOption')" @update:modelValue="onPropertyChange(widget.id, item)"/>

                                            </div>
                                            <div v-else-if="item.type === 'boolean'">
                                                <InputSwitch v-model="item.value" @update:modelValue="onPropertyChange(widget.id, item)"/>
                                            </div>
                                            <div v-else-if="item.type === 'image'">
                                                <Image v-if="widget.value" :src="'/api/image?screen=' + screen.id + '&widget=' + widget.id" alt="Image"/>
                                                <Button v-if="widget.value" class="ml-2" size="small" text plain @click="onDeleteImage($event, widget)">
                                                    <i class="pi pi-trash mr-2" style="color: #6e6e6e"></i>{{ t('buttons.remove') }}
                                                </Button>
                                                <FileUpload v-if="!widget.value" mode="basic" name="uploading" :url="'/api/upload_image?screen=' + screen.id + '&widget=' + widget.id" accept="image/png" :maxFileSize="1000000" @upload="onUploadImage" :auto="true" :chooseLabel="t('buttons.upload')" />
                                            </div>
                                            <div v-else>

                                                {{ item.value }}

                                            </div>
                                        </div>

                                    </li>
                                </ul>

                                <!-- Value Mapping Section -->
                                <div v-if="widget.sensor">
                                    <ValueMapper 
                                        v-model="widget.value_mapping" 
                                        @update:modelValue="onWidgetValueMappingChange(widget)" 
                                    />
                                </div>

                            </AccordionTab>

                        </Accordion>

                    </template>
                </Card>
            </div>
        </div>
    </div>

</template>

<script>

/*!
 * s1panel-gui - App.vue
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */

import { FilterMatchMode } from 'primevue/api';
import { useI18n } from 'vue-i18n';
import api from '@/common/api';
import ValueMapper from '@/components/ValueMapper.vue';

function make_widget_table(widget, infos) {

    const _table = [];

    widget.setup = infos.find(each => { return widget.name === each.name; });

    // Initialize value_mapping if it doesn't exist
    if (!widget.value_mapping) {
        widget.value_mapping = {
            enabled: false,
            rules: [],
            else: ''
        };
    }

    Object.getOwnPropertyNames(widget).forEach(key => {

        const _obj = { name: key, value: widget[key] };

        if (widget.setup && widget.setup.fields) {

            const _field_info = widget.setup.fields.find(nnn => { return nnn.name === key; });

            if (_field_info) {

                const _syntax = _field_info.value.split(':');

                if (_syntax.length > 1) {

                    _obj.type = _syntax[0];

                    if (_obj.type === 'list') {
                        _obj.list = _syntax[1].split(',');
                    }
                }
                else {
                    _obj.type = _field_info.value;
                }
            }
        }

        if (!key.startsWith('debug_') && key !== 'name' && key !== 'sensor' && key !== 'setup' && key !== 'id' && key !== 'group' && key !== 'table' && key !== 'font_string' && key !== 'value_mapping') {

            _table.push(_obj);
        }
    });

    widget.font_string = { font: widget.font };

    widget.table = _table.sort((a, b) => a.name.localeCompare(b.name));
}

export default {

    components: {
        ValueMapper
    },
    setup() {
        const { t, locale, availableLocales } = useI18n();
        return { t, locale, availableLocales };
    },
    data() {
        return {
            connected: true,
            show_manage_theme: false,
            config_manager: {
                show: false,
                listen: null,
                poll: null,
                refresh: null,
                heartbeat: null,
                saving: false,
                language: 'auto'
            },
            theme_manage: {
                show: false,
                selected: null,
                filters: {},
                name: null,
            },
            screen_manage: {
                name: null,
                show: false,
                lists: [],
                active: 0
            },
            widget_manage: {
                add: false,
                name: null
            },
            led_manage: {
                show: false,
                intensity: 1,
                speed: 1,
                theme: 1,
                list: [
                    { id: 1, nameKey: 'dialog.ledStrip.themes.rainbow',    icon: 'pi pi-palette'},
                    { id: 2, nameKey: 'dialog.ledStrip.themes.breathing',  icon: 'pi pi-heart-fill'},
                    { id: 3, nameKey: 'dialog.ledStrip.themes.colorCycle', icon: 'pi pi-sync'},
                    { id: 5, nameKey: 'dialog.ledStrip.themes.automatic',  icon: 'pi pi-bolt'},
                    { id: 4, nameKey: 'dialog.ledStrip.themes.off',        icon: 'pi pi-power-off'},
                ]
            },
            sensor_manage: {
                show: false,
                show_add: false,
                list: [],
                sensors: [],
                picked: null,
                show_edit: false,
                edit: null
            },
            config: null,
            interval: null,
            timeout: null,
            canvas: null,
            context: null,
            theme: null,
            screen: null,
            widgets: null,
            sensors: null,
            active_widgets: [],
            edit_theme: null,
            edit_screen: null,
            edit_refresh: null,
            edit_orientation: null,
            edit_duration: null,
            edit_background: null,
            edit_screen_name: null,
            unsaved_changes: false,
            uploading: [],
        };
    },
    computed: {
        orientationOptions() {
            return [
                { id: 'portrait',  name: this.t('card.config.orientation.portrait') },
                { id: 'landscape', name: this.t('card.config.orientation.landscape') }
            ];
        },
        refreshMethodOptions() {
            return [
                { id: 'redraw', name: this.t('card.config.refreshMethods.redraw') },
                { id: 'update', name: this.t('card.config.refreshMethods.update') },
            ];
        },
        supportedLanguageOptions() {
            return [
                { name: this.t('dialog.settings.languages.auto'), code: 'auto' },
                { name: this.t('dialog.settings.languages.en'), code: 'en' },
                { name: this.t('dialog.settings.languages.es'), code: 'es' }
            ];
        },
        widgetPropertyNames() {
            return {
                'name': this.t('widget.propertyCapitalize.name'),
                'value': this.t('widget.propertyCapitalize.value'),
                'font': this.t('widget.propertyCapitalize.font'),
                'color': this.t('widget.propertyCapitalize.color'),
                'align': this.t('widget.propertyCapitalize.align'),
                'rect': this.t('widget.propertyCapitalize.rect'),
                'format': this.t('widget.propertyCapitalize.format'),
                'refresh': this.t('widget.propertyCapitalize.refresh'),
                'used': this.t('widget.propertyCapitalize.used'),
                'free': this.t('widget.propertyCapitalize.free'),
                'outline': this.t('widget.propertyCapitalize.outline'),
                'fill': this.t('widget.propertyCapitalize.fill'),
                'points': this.t('widget.propertyCapitalize.points'),
                'area': this.t('widget.propertyCapitalize.area'),
                'thickness': this.t('widget.propertyCapitalize.thickness'),
                'zoom': this.t('widget.propertyCapitalize.zoom'),
                'horizontal': this.t('widget.propertyCapitalize.horizontal'),
                'rotation': this.t('widget.propertyCapitalize.rotation'),
                'cutout': this.t('widget.propertyCapitalize.cutout'),
                'circumference': this.t('widget.propertyCapitalize.circumference'),
                'iconSet': this.t('widget.propertyCapitalize.iconSet'),
                'type': this.t('widget.propertyCapitalize.type'),
                'debug_frame': this.t('widget.propertyCapitalize.debug_frame'),
                'sensor': this.t('widget.propertyCapitalize.sensor')
            };
        }
    },
    mounted() {

        this.canvas = this.$refs.canvas;
        this.context = this.canvas.getContext('2d', { pixelFormat: "RGB16_565" });

        return Promise.all([
            api.fetch_config(),
            api.fetch_theme(),
            api.fetch_widgets(),
            api.fetch_sensors(),
            api.fetch_screen(),
        ]).then(results => {

            this.config = results[0];
            this.theme = results[1];
            this.widgets = results[2];
            this.sensors = results[3];

            const _screen_info = results[4];

            this.screen = this.theme.screens.find(screen => { return screen.id === _screen_info.id });

            this.edit_theme = this.config.theme;
            this.edit_orientation = this.theme.orientation;
            this.edit_refresh = this.theme.refresh;
            this.edit_screen = this.screen.id;
            this.edit_duration = this.screen.duration || 0;
            this.edit_background = this.screen.background || '#000000';
            this.edit_screen_name = this.screen.name || 'n/a';

            this.unsaved_changes = this.config.unsaved_changes || false;

            const targetLocale = this.determineLocaleToUse(this.config.language);
            this.setLocale(targetLocale);
            this.config_manager.language = this.config.language || 'auto';

            this.canvas.width = ('portrait' === this.theme.orientation) ? 170 : 320;
            this.canvas.height = ('portrait' === this.theme.orientation) ? 320 : 170;

            api.set_poll_time(this.config.poll);

            this.screen.widgets.forEach(each => {

                make_widget_table(each, this.widgets);
            });

            this.start();
        });
    },
    beforeUnmount() {
        clearTimeout(this.timeout);
    },
    methods: {

        start() {

            this.refresh().then(() => {
                this.timeout = setTimeout(this.start, 1000);
            });
        },
        async setLocale(newLocale) {
            if (this.locale === newLocale) return;

            if (!this.availableLocales.includes(newLocale)) {
                try {
                    const response = await fetch(`/locales/${newLocale}.json`);
                    if (!response.ok) throw new Error('Locale not found');
                    const messages = await response.json();
                    this.$i18n.setLocaleMessage(newLocale, messages);
                } catch (e) {
                    console.warn(`Failed to load locale '${newLocale}'. Falling back to 'en'.`);
                    this.locale = 'en';
                    return;
                }
            }
            this.locale = newLocale;
        },
        determineLocaleToUse(languageSetting) {
            if (languageSetting && languageSetting !== 'auto') {
                return languageSetting;
            }

            const fullBrowserLang = navigator.language;
            const shortBrowserLang = navigator.language.split('-')[0];

            if (this.supportedLanguageOptions.some(l => l.code === fullBrowserLang)) {
                return fullBrowserLang;
            }
            if (this.supportedLanguageOptions.some(l => l.code === shortBrowserLang)) {
                return shortBrowserLang;
            }

            return 'en';
        },
        refresh() {

            return new Promise((fulfill, reject) => {

                api.load_image().then(img => {

                    if (!this.connected) {
                        return window.location.reload();
                    }

                    this.context.reset();

                    if ('portrait' === this.theme.orientation) {

                        this.context.translate(170, 0);
                        this.context.rotate(Math.PI / 2);
                    }

                    this.context.drawImage(img, 0, 0);
                    this.connected = true;

                }, () => {

                    console.log('failed to load lcd image');

                    this.connected = false;


                }).finally(fulfill);
            });
        },
        getThemeName(conf) {

            if (conf && this.config) {

                const _found = this.config.theme_list.find(each => {
                    return each.config === conf;
                });

                return _found ? _found.name : 'unknown';
            }
        },
        onSetColorPicker(id, item) {

            if (!item.value.startsWith('#')) {
                item.value = '#' + item.value;
            }

            return api.update_property(this.screen.id, id, item.name, item.value).then(() => {
                this.unsaved_changes = true;
            });
        },
        onSetDebugFrame(id) {
            return api.toggle_debug_frame(this.screen.id, id).then(() => {
                this.unsaved_changes = true;
            });
        },
        onUpdateRect(id, value) {

            return api.adjust_rect(this.screen.id, id, value).then(() => {
                this.unsaved_changes = true;
            });
        },
        onPropertyChange(id, item) {

            return api.update_property(this.screen.id, id, item.name, item.value).then(() => {
                this.unsaved_changes = true;
            });
        },
        onWidgetValueMappingChange(widget) {
            // Ensure the value_mapping object exists with defaults
            if (!widget.value_mapping) {
                widget.value_mapping = {
                    enabled: false,
                    rules: [],
                    else: ''
                };
            }
            
            // Save the value_mapping object to the backend
            return api.update_property(this.screen.id, widget.id, 'value_mapping', widget.value_mapping).then(() => {
                this.unsaved_changes = true;
            });
        },
        onSetBackground() {

            if (!this.edit_background.startsWith('#')) {
                this.edit_background = '#' + this.edit_background;
            }

            return api.set_background(this.screen.id, this.edit_background).then(response => {
                this.screen.background = response.value;
                this.unsaved_changes = true;
            });
        },
        onSetScreenName() {

            return api.set_screen_name(this.screen.id, this.edit_screen_name).then(() => {
                this.screen.name = this.edit_screen_name;
                this.unsaved_changes = true;
            });
        },
        onSetScreenDuration() {

            return api.set_screen_duration(this.screen.id, this.edit_duration).then(() => {
                this.screen.duration = this.edit_duration;
                this.unsaved_changes = true;
            });
        },
        isAmbiguousValue(value) {
            if (!value || typeof value !== 'string') return false;
            return this.sensors.some(sensor => sensor.name === value);
        },
        onSensorToggle(widget) {
            return api.update_property(this.screen.id, widget.id, 'sensor', widget.sensor).then(() => {
                this.unsaved_changes = true;
            });
        },
        onSensorChange(widget, item) {
            const isValueInSensorList = this.sensors.some(s => s.name === item.value);

            const likelySelectedFromList = !widget.sensor && isValueInSensorList;

            if (likelySelectedFromList) {
                widget.sensor = true;
                return api.set_sensor(this.screen.id, widget.id, item.value).then(response => {
                    widget.value = response.value;
                    this.unsaved_changes = true;
                });
            } else {
                widget.sensor = false;
                return api.update_property(this.screen.id, widget.id, 'value', item.value).then(() => {
                    api.update_property(this.screen.id, widget.id, 'sensor', false).then(() => {
                        this.unsaved_changes = true;
                    });
                });
            }
        },
        onFontChange(id, value) {

            return api.update_property(this.screen.id, id, 'font', value.font).then(() => {

                this.unsaved_changes = true;
            });
        },
        onOpenThemeManage() {

            this.theme_manage.filters = {
                'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
            }

            this.theme_manage.show = true;
        },
        onOpenSensorManage() {
            api.config_sensor_list().then(response => {
                this.sensor_manage.list = response;
                this.sensor_manage.show = true;
            });
        },
        onOpenAddSensor() {
            api.config_sensor_scan().then(response => {

                var _list = [];

                response.forEach(sensor => {
                    if (sensor.multiple) {
                        _list.push({ id: sensor.name, name: sensor.name + ' - ' + sensor.description, data: sensor });
                    }
                });

                this.sensor_manage.sensors = _list;
                this.sensor_manage.picked = null;
                this.sensor_manage.show_add = true;
            });
        },
        onSensorAddChange() {

            const _sensor = this.sensor_manage.sensors.find(each => { return each.id === this.sensor_manage.picked });

            if (_sensor) {

                this.sensor_manage.config_data = _sensor.data;
            }

        },
        onAddSensor() {

            const _sensor = this.sensor_manage.sensors.find(each => { return each.id === this.sensor_manage.picked });

            if (_sensor) {

                var _config = Object.fromEntries(_sensor.data.fields.map(item => [item.name, item.value]));

                api.config_sensor_add(_sensor.data.module, _config).then(response => {

                    if ('success' !== response.status) {

                        this.$confirm.require({
                            group: 'headless3',
                            header: this.t('messages.addSensorError'),
                            message: response.error,
                            accept: () => {
                            },
                            reject: () => {
                            }
                        });
                    }
                    else {

                        Promise.all([ api.config_sensor_list(), api.fetch_sensors()]).then(refresh_response => {

                            this.sensor_manage.list = refresh_response[0];
                            this.sensors = refresh_response[1];
                            this.sensor_manage.show_add = false;
                        });
                    }
                });
            }
            else {
                this.sensor_manage.show_add = false;
            }
        },
        onSensorRemove(data) {

            if (data) {

                this.$confirm.require({
                    group: 'headless1',
                    header: this.t('confirmations.areYouSure'),
                    message: this.t('messages.confirmSensorRemove', { name: data.name }),
                    accept: () => {

                        api.config_sensor_remove(data.name, data.info.module).then(response => {

                            if ('success' !== response.status) {

                                this.$confirm.require({
                                    group: 'headless3',
                                    header: this.t('messages.removeSensorError'),
                                    message: response.error,
                                    accept: () => {
                                    },
                                    reject: () => {
                                    }
                                });
                            }
                            else {

                                Promise.all([ api.config_sensor_list(), api.fetch_sensors()]).then(refresh_response => {

                                    this.sensor_manage.list = refresh_response[0];
                                    this.sensors = refresh_response[1];
                                });
                            }
                        });
                    },
                    reject: () => {
                    }
                });
            }
        },
        onSensorEdit(data) {

            if (data) {
                const _sensor = JSON.parse(JSON.stringify(data));

                _sensor.info.fields.forEach(field => {
                    if (_sensor.config.hasOwnProperty(field.name)) {
                        field.value = _sensor.config[field.name];
                    }
                });

                this.sensor_manage.show_edit = true;
                this.sensor_manage.edit = _sensor;
            }
        },
        onThemeRenameSensor(new_name, old_name) {

            return new Promise((fulfill, reject) => {

                if (new_name !== old_name) {

                    var _count = 0;

                    this.theme.screens.forEach(screen => {

                        screen.widgets.forEach(widget => {

                            if (widget.value === old_name) {
                                _count++;
                            }
                        });
                    });

                    if (_count) {

                        this.$confirm.require({
                            group: 'headless4',
                            header: this.t('messages.sensorIdentityChanged'),
                            message: this.t('messages.sensorIdentityChangedMessage', { count: _count, oldName: old_name, newName: new_name }),
                            accept: () => {

                                var _promises = [];

                                this.theme.screens.forEach(screen => {

                                    screen.widgets.forEach(widget => {

                                        if (widget.value === old_name) {

                                            _promises.push(api.set_sensor(screen.id, widget.id, new_name));
                                            widget.value = new_name;
                                        }
                                    });
                                });

                                Promise.all(_promises).then(() => {

                                    this.screen.widgets.forEach(each => {
                                        make_widget_table(each, this.widgets);
                                    });

                                    this.unsaved_changes = true;

                                    return fulfill();
                                });
                            },
                            reject: () => {
                                return fulfill();
                            }
                        });
                    }
                    else {
                        return fulfill();
                    }
                }
                else {
                    return fulfill();
                }
            });
        },
        onSensorSave() {

            const _sensor = this.sensor_manage.edit;

            if (_sensor) {

                _sensor.info.fields.forEach(field => {
                    if (_sensor.config.hasOwnProperty(field.name)) {
                        _sensor.config[field.name] = field.value;
                    }
                });

                api.config_sensor_edit(_sensor.name, _sensor.info.module, _sensor.config).then(response => {

                    if ('success' !== response.status) {
                        this.$confirm.require({
                            group: 'headless3',
                            header: this.t('messages.editSensorError'),
                            message: response.error,
                            accept: () => {
                            },
                            reject: () => {
                            }
                        });
                    }
                    else {

                        this.onThemeRenameSensor(response.name, _sensor.name).then(() => {

                            Promise.all([ api.config_sensor_list(), api.fetch_sensors()]).then(refresh_response => {

                                this.sensor_manage.list = refresh_response[0];
                                this.sensors = refresh_response[1];

                                this.sensor_manage.show_edit = false;
                            });
                        });
                    }
                });
            }
        },
        onConfirmDeleteTheme(item) {

            this.$confirm.require({
                group: 'headless1',
                header: this.t('confirmations.areYouSure'),
                message: this.t('confirmations.deleteThemeWarning'),
                accept: () => {
                },
                reject: () => {
                }
            });
        },
        onOpenScreenManage() {

            return api.fetch_screen().then(response => {

                this.screen_manage.lists = [
                    this.widgets,
                    this.theme.screens
                ];
                this.screen_manage.name = '';
                this.screen_manage.active = response.id;
                this.screen_manage.show = true;
            });
        },
        onOrientationChange() {

            return api.set_orientation(this.edit_orientation).then(() => {

                this.orientation_changed = true;

                this.canvas.width = ('portrait' === this.edit_orientation) ? 170 : 320;
                this.canvas.height = ('portrait' === this.edit_orientation) ? 320 : 170;
                this.theme.orientation = this.edit_orientation;
                this.unsaved_changes = true;
            });
        },
        onRefreshChange() {

            return api.set_refresh(this.edit_refresh).then(() => {

                this.theme.refresh = this.edit_refresh;
                this.unsaved_changes = true;
            });
        },
        onThemeChange() {
            if (this.edit_theme === this.config.theme) {
                return;
            }

            api.switch_theme(this.edit_theme).then(newTheme => {
                this.theme = newTheme;
                this.config.theme = this.edit_theme;

                this.edit_screen = this.theme.screens[0].id;

                this.onScreenChange().then(() => {
                    this.active_widgets = [];
                    this.unsaved_changes = true;
                });
            });
        },
        onScreenChange() {

            return api.next_screen(this.edit_screen).then(response => {

                this.screen = this.theme.screens.find(screen => { return screen.id === response.id });

                if (this.screen) {

                    this.edit_screen = this.screen.id;
                    this.edit_duration = this.screen.duration || 0;
                    this.edit_background = this.screen.background || '#000000';
                    this.edit_screen_name = this.screen.name || 'n/a';

                    this.screen.widgets.forEach(each => {

                        make_widget_table(each, this.widgets);
                    });
                }
            });
        },
        onAddScreen() {

            return api.add_screen(this.screen_manage.name).then(response => {

                if (response) {

                    this.theme.screens.push(response);
                    this.unsaved_changes = true;
                }
            });
        },
        onDeleteScreen(event, id) {

            this.$confirm.require({
                target: event.currentTarget,
                message: this.t('messages.confirmDeleteScreen'),
                icon: 'pi pi-info-circle',
                rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
                acceptClass: 'p-button-danger p-button-sm',
                rejectLabel: this.t('buttons.cancel'),
                acceptLabel: this.t('buttons.delete'),
                accept: () => {

                    api.remove_screen(id).then(() => {

                        this.theme.screens = this.theme.screens.filter(screen => { return screen.id !== id; });
                        this.unsaved_changes = true;
                    });
                },
                reject: () => {
                }
            });

        },
        onShowAddWidget() {

            this.widget_manage.name = null;
            this.widget_manage.show = true;
        },
        onAddWidget() {

            return api.add_widget(this.screen.id, this.widget_manage.name).then(response => {

                if (response) {

                    make_widget_table(response, this.widgets);

                    this.screen.widgets.push(response);
                    this.widget_manage.show = false;
                }
            });
        },
        onDeleteWidget(event, id) {

            this.$confirm.require({
                target: event.currentTarget,
                message: this.t('messages.confirmDeleteWidget'),
                icon: 'pi pi-info-circle',
                rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
                acceptClass: 'p-button-danger p-button-sm',
                rejectLabel: this.t('buttons.cancel'),
                acceptLabel: this.t('buttons.delete'),
                accept: () => {

                    api.delete_widget(this.screen.id, id).then(() => {
                        this.screen.widgets = this.screen.widgets.filter(widget => { return widget.id !== id; });
                        this.unsaved_changes = true;
                    });
                },
                reject: () => {
                }
            });
        },
        onUploadImage(data) {

            var _response = JSON.parse(data.xhr.response);
            this.screen.widgets.find(widget => {
                if (widget.id === _response.widget) {
                    widget.value = _response.value;
                    return true;
                }
            });
        },
        onUploadWallpaper(data) {

            var _response = JSON.parse(data.xhr.response);
            this.screen.wallpaper = _response.value;
        },
        onDeleteWallpaper(event) {
            this.$confirm.require({
                target: event.currentTarget,
                message: this.t('messages.confirmClearWallpaper'),
                icon: 'pi pi-info-circle',
                rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
                acceptClass: 'p-button-danger p-button-sm',
                rejectLabel: this.t('buttons.cancel'),
                acceptLabel: this.t('buttons.clear'),
                accept: () => {

                    api.clear_wallpaper(this.screen.id).then(() => {
                        this.screen.wallpaper = null;
                        this.unsaved_changes = true;
                    });
                },
                reject: () => {
                }
            });
        },
        onDeleteImage(event, widget) {

            this.$confirm.require({
                target: event.currentTarget,
                message: this.t('messages.confirmClearImage'),
                icon: 'pi pi-info-circle',
                rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
                acceptClass: 'p-button-danger p-button-sm',
                rejectLabel: this.t('buttons.cancel'),
                acceptLabel: this.t('buttons.clear'),
                accept: () => {

                    api.clear_image(this.screen.id, widget.id).then(() => {
                        widget.value = null;
                        this.unsaved_changes = true;
                    });
                },
                reject: () => {
                }
            });
        },
        onEditConfig() {

            this.config_manager.listen = this.config.listen;
            this.config_manager.poll = this.config.poll;
            this.config_manager.refresh = this.config.refresh;
            this.config_manager.heartbeat = this.config.heartbeat;
            this.config_manager.language = this.config.language;

            this.config_manager.show = true;
        },
        onSaveConfig() {

            this.config_manager.saving = true;

            api.set_language(this.config_manager.language).then(() => {
                this.config.language = this.config_manager.language;

                const localeToUse = this.determineLocaleToUse(this.config.language);
                this.setLocale(localeToUse);
            });

            return api.save_config({

                listen: this.config_manager.listen,
                poll: this.config_manager.poll,
                refresh: this.config_manager.refresh,
                heartbeat: this.config_manager.heartbeat

            }).then(() => {

                this.config.listen = this.config_manager.listen;
                this.config.poll = this.config_manager.poll;
                this.config.refresh = this.config_manager.refresh;
                this.config.heartbeat = this.config_manager.heartbeat;

                api.set_poll_time(this.config.poll);

                this.config_manager.saving = false;
                this.config_manager.show = false;

            }, () => {

                // error
            });
        },
        onAddTheme() {
            if (!this.theme_manage.name) return;
            api.theme_create(this.theme_manage.name).then(newTheme => {
                this.config.theme_list.push(newTheme);
                this.theme_manage.name = null;
                this.unsaved_changes = true;
            });
        },
        onDeleteTheme(event, themeToDelete) {
            this.$confirm.require({
                target: event.currentTarget,
                message: this.t('messages.confirmDeleteTheme'),
                icon: 'pi pi-info-circle',
                rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
                acceptClass: 'p-button-danger p-button-sm',
                rejectLabel: this.t('buttons.cancel'),
                acceptLabel: this.t('buttons.delete'),
                accept: () => {
                    api.theme_delete(themeToDelete.config).then(() => {
                        this.config.theme_list = this.config.theme_list.filter(
                            t => t.config !== themeToDelete.config
                        );
                        this.unsaved_changes = true;
                    });
                },
                reject: () => {}
            });
        },
        onSaveTheme() {
            return api.theme_save().then(theme => {
                this.unsaved_changes = false;
                return api.fetch_config().then(config => this.config = config);
            });
        },
        onRevertTheme() {
            return api.theme_revert().then(response => {
                this.unsaved_changes = false;

                this.config = response.config;
                this.theme = response.theme;

                this.edit_theme = this.config.theme;
                this.screen = this.theme.screens[0];

                this.images_to_delete_on_save = [];
                this.wallpapers_to_delete_on_save = [];

                this.edit_orientation = this.theme.orientation;
                this.edit_refresh = this.theme.refresh;
                this.edit_screen = this.screen.id;
                this.edit_duration = this.screen.duration || 0;
                this.edit_background = this.screen.background || '#000000';
                this.edit_screen_name = this.screen.name || 'n/a';

                this.screen.widgets.forEach(each => {
                    make_widget_table(each, this.widgets);
                });

                this.canvas.width = ('portrait' === this.theme.orientation) ? 170 : 320;
                this.canvas.height = ('portrait' === this.theme.orientation) ? 320 : 170;
            });
        },
        onOpenLED() {

            return api.get_led_strip().then(response => {

                this.led_manage.theme = response.theme;
                this.led_manage.intensity = response.intensity;
                this.led_manage.speed = response.speed;
                this.led_manage.show = true;
            });
        },
        getLED() {
            const _found = this.led_manage.list.find(t => t.id === Number(this.led_manage.theme));
            return _found ? this.t(_found.nameKey) : this.t('dialog.ledStrip.themes.unknown');
        },
        onChangeLED() {

            return api.set_led_strip(this.led_manage.theme, this.led_manage.intensity, this.led_manage.speed, this.screen.id).then(() => {
                this.unsaved_changes = true;
            });
        },
        isFirst(id) {

            return this.screen.widgets[0].id === id;
        },
        onSwapUp(id, index) {

            return api.up_widget(this.screen.id, id).then(response => {

                var _previous = null;

                this.screen.widgets.find(widget => {

                    if (_previous && widget.id === id) {

                        widget.id = [_previous.id, _previous.id = widget.id][0];
                        return true;
                    }

                    _previous = widget;
                });

                if (!this.active_widgets.includes(index - 1)) {
                    this.active_widgets = this.active_widgets.filter(i => i !== index);
                    this.active_widgets.push(index - 1);
                }

                this.screen.widgets.sort((a, b) => a.id - b.id);
                this.unsaved_changes = true;
            });
        },
        isLast(id) {

            return this.screen.widgets[this.screen.widgets.length - 1].id === id;
        },
        onSwapDown(id, index) {

            return api.down_widget(this.screen.id, id).then(response => {

                var _previous = null;

                this.screen.widgets.find(widget => {

                    if (_previous && _previous.id === id) {

                        widget.id = [_previous.id, _previous.id = widget.id][0];
                        return true;
                    }

                    _previous = widget;
                });

                if (!this.active_widgets.includes(1 + index)) {
                    this.active_widgets = this.active_widgets.filter(i => i !== index);
                    this.active_widgets.push(1 + index);
                }

                this.screen.widgets.sort((a, b) => a.id - b.id);
                this.unsaved_changes = true;
            });
        },
        onSwapTop(id, index) {

            return api.top_widget(this.screen.id, id).then(response => {

                var _count = 2;

                this.screen.widgets.forEach(widget => {

                    widget.id = (widget.id === id) ? 1 : _count++;
                });

                if (!this.active_widgets.includes(1)) {
                    this.active_widgets = this.active_widgets.filter(i => i !== index);
                    this.active_widgets.push(1);
                }

                this.screen.widgets.sort((a, b) => a.id - b.id);
                this.unsaved_changes = true;
            });

        },
        onSwapBottom(id, index) {

            return api.bottom_widget(this.screen.id, id).then(response => {

                var _count = 1;

                this.screen.widgets.forEach(widget => {

                    widget.id = (widget.id === id) ? this.screen.widgets.length : _count++;
                });

                if (!this.active_widgets.includes(this.screen.widgets.length)) {
                    this.active_widgets = this.active_widgets.filter(i => i !== index);
                    this.active_widgets.push(this.screen.widgets.length);
                }

                this.screen.widgets.sort((a, b) => a.id - b.id);
                this.unsaved_changes = true;
            });
        }
    }
}

</script>

<style scoped>

.led-button {
    background-image: linear-gradient(to right, #66ff00, #251bda);
}

</style>