import { Component, OnInit, EventEmitter, Input, Output, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { http, inputUtils, cf } from '../../utils/cf';
import * as _ from 'lodash'

@Component({
    selector: 'app-form-type1',
    templateUrl: './form-type1.component.html',
    styleUrls: ['./form-type1.component.css'],
})
export class FormType1Component implements OnInit {
    @Input('formConfig') formConfig;
    @Input('data') data = {};
    @Input('markChangedFields') markChangedFields = false;
    @Output('dataChange') dataChange = new EventEmitter();
    @Output('dataOnChange') dataOnChange = new EventEmitter();
    @Output('inputError') inputError = new EventEmitter();

    groupNames = []
    constructor() {

    }
    handlePhoneInput = inputUtils.handlePhoneInput;
    handleSsnInput = inputUtils.handleSsnInput;
    emitDataChange() {
        this.dataOnChange.emit({ config: this.formConfig, data: this.data })
        this.dataChange.emit(this.data)
    }
    startDate;
    markedGreenFields = {}

    subscriptions = []

    ngOnInit() {
        this.startDate = Date.now()
        this.groupNames = this.formConfig.groupsOrder

        let configKeyList = Object.values(this.formConfig.groups).flat().map(el => el['fieldName']).filter(el => el);
        for (let key in this.data) {
            if (!configKeyList.includes(key)) {
                delete this.data[key]
            }
        }

        for (let groupName in this.formConfig.groups) {
            for (let field of this.formConfig.groups[groupName]) {

                if (field.visibilityCondition) {
                    let func = () => {
                        let cond = field.visibilityCondition
                        if (cond.fieldName && cond.equal) {
                            let value = this.data[cond.fieldName]
                            let isHidden = value !== cond.equal
                            field.hidden = isHidden
                        }
                        if (cond.fieldName && cond.includes) {
                            let value = this.data[cond.fieldName]
                            let isHidden = !(value && value.includes && value.includes(cond.includes))
                            field.hidden = isHidden
                        }
                    }
                    func()
                    let subscription = this.dataOnChange.subscribe(func)
                    this.subscriptions.push(subscription)
                }

                if (field.fieldName && !(field.fieldName in this.data)) {
                    if (field.type == 'bool') {
                        this.data[field.fieldName] = false;
                    } else {
                        this.data[field.fieldName] = undefined;
                    }
                }

                // converting options ['a'] to [{name: 'a', value: 'a'}]
                if (field.options) {
                    field.options = field.options.map(el => typeof(el) == 'string' ? { name: el, value: el } : el)
                }
                if (field.type == 'multiSelect' && !this.data[field.fieldName]) {
                    this.data[field.fieldName] = []
                }

                if (field.type == 'ssn') {
                    let value = this.data[field.fieldName] || ''
                    if (value.length > 4 && !value.includes('X')) {
                        field.inputType = 'password'
                    }
                }

                if (field.type == 'textAutocomplete') {
                    let option = field.options.find(el => el.value == this.data[field.fieldName])
                    if (option) {
                        field.formControl.setValue({ name: option.name, value: option.value })
                    }
                }

                // Large list of options in select and multiSelect have negative affect to loading time, so we need to render this options after view initialization
                if (field.options && field.options.length > 5) {
                    let type = field.type;
                    setTimeout(() => {
                        field.type = type
                    }, 0)
                    field.type = 'hidden'
                }

            }
        }
    }
    handleBlurOnAutocomplete(field) {
        // trick: wait for execution of optionSelected callback
        setTimeout(() => {
            // when user select option from suggestions
            let formValue = field.formControl.value
            if (formValue && formValue.value && formValue.name) {
                return
            }

            // trying to find option by option.name in case when user was not select option from suggestions
            let option;
            if (typeof(formValue) == 'string') {
                let str = formValue.toLowerCase().trim()
                option = field.options.find(el => el.name.toLowerCase() == str)
                if (option) {
                    field.formControl.setValue({ name: option.name, value: option.value })
                    this.data[field.fieldName] = option.value
                    this.emitDataChange()
                    return
                }
            }

            // if option was not found by option.name we reset input
            option = field.options.find(el => el.value == this.data[field.fieldName])
            if (option) {
                field.formControl.setValue({ name: option.name, value: option.value })
                this.inputError.emit('Please, select a suggestion')
            }

        }, 0)

    }

    ngAfterViewInit() {
        // console.log(Date.now() - this.startDate); //render time
    }

    onBlurSsnFeild(field) {
        if (!this.data[field.fieldName].includes('X')) {
            field.inputType = 'password';
        }
    }

    ngOnChanges(changes) {
        if (changes.markChangedFields && changes.markChangedFields.currentValue == false) {
            this.markedGreenFields = {}
        }
        if (changes.data) {
            let configKeyList = Object.values(this.formConfig.groups).flat().map(el => el['fieldName']).filter(el => el);
            for (let key in this.data) {
                if (!configKeyList.includes(key)) {
                    delete this.data[key]
                }
            }

            if (changes.markChangedFields && changes.markChangedFields.currentValue == true) {
                let diff = cf.diff(changes.data.previousValue, changes.data.currentValue)
                this.markedGreenFields = {}
                for (let key in diff) {
                    if (diff[key] == undefined) {
                        delete diff[key]
                        continue
                    }
                    this.markedGreenFields[key] = true;
                }
            } else {
                this.markedGreenFields = {}
            }

        }
    }
    onFocusSsnField(field) {
        field.inputType = 'text'
    }
    ngOnDestroy() {
        this.subscriptions.forEach(el => el.unsubscribe && el.unsubscribe())
    }

}
