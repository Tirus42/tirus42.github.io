"use strict";
var UIElementType;
(function (UIElementType) {
    UIElementType[UIElementType["Group"] = 0] = "Group";
    UIElementType[UIElementType["ColorSelector"] = 1] = "ColorSelector";
    UIElementType[UIElementType["RadioSelector"] = 2] = "RadioSelector";
    UIElementType[UIElementType["DropDownSelector"] = 3] = "DropDownSelector";
    UIElementType[UIElementType["CheckBoxSelector"] = 4] = "CheckBoxSelector";
    UIElementType[UIElementType["RangeSelector"] = 5] = "RangeSelector";
    UIElementType[UIElementType["Button"] = 6] = "Button";
    UIElementType[UIElementType["NumberFieldInt32"] = 7] = "NumberFieldInt32";
    UIElementType[UIElementType["TextField"] = 8] = "TextField";
    UIElementType[UIElementType["PasswordField"] = 9] = "PasswordField";
})(UIElementType || (UIElementType = {}));
var ValueType;
(function (ValueType) {
    ValueType[ValueType["Number"] = 0] = "Number";
    ValueType[ValueType["String"] = 1] = "String";
    ValueType[ValueType["Boolean"] = 2] = "Boolean";
    ValueType[ValueType["RGBWColor"] = 3] = "RGBWColor";
})(ValueType || (ValueType = {}));
class ValueWrapper {
    constructor(value) {
        this.type = this._determineType(value);
        this.value = value;
    }
    getNumberValue() {
        if (this.type === ValueType.Number) {
            return this.value;
        }
        throw 'Wrong data type: ' + this.type;
    }
    getStringValue() {
        if (this.type === ValueType.String) {
            return this.value;
        }
        throw 'Wrong data type: ' + this.type;
    }
    getBooleanValue() {
        if (this.type === ValueType.Boolean) {
            return this.value;
        }
        throw 'Wrong data type: ' + this.type;
    }
    getRGBWValue() {
        if (this.type === ValueType.RGBWColor) {
            return this.value;
        }
        throw 'Wrong data type: ' + this.type;
    }
    _determineType(value) {
        if (typeof value === 'number') {
            return ValueType.Number;
        }
        if (typeof value === 'string') {
            return ValueType.String;
        }
        if (typeof value === 'boolean') {
            return ValueType.Boolean;
        }
        if (value instanceof RGBWColor) {
            return ValueType.RGBWColor;
        }
        throw "Unsupported type of value '" + value + "'";
    }
}
class AUIElement {
    constructor(type, name, parent) {
        this.type = type;
        this.name = name;
        this.parent = parent;
    }
    destroy() {
        if (this.parent) {
            if (!this.parent.eraseChildByRef(this)) {
                throw "Failed to remove child from parent, child name: " + this.getAbsoluteName();
            }
        }
    }
    checkValidPath(path) {
        if (path.length != 1 || path[0] !== this.getName()) {
            throw "Invalid path, got '" + path.toString() + " but is '" + this.getName() + "'";
        }
    }
    getParent() {
        return this.parent;
    }
    getName() {
        return this.name;
    }
    getAbsoluteName() {
        const ret = this.parent ? this.parent.getAbsoluteName() : [];
        ret.push(this.name);
        return ret;
    }
    onInputValueChange(sourceElement, newValue) {
        if (this.parent) {
            this.parent.onInputValueChange(sourceElement, newValue);
        }
        else {
            Log("Unhanded change event on " + sourceElement.getAbsoluteName());
        }
    }
}
const BTN_TEXT_HIDE = 'Λ';
const BTN_TEXT_SHOW = 'V';
class UIGroupElement extends AUIElement {
    constructor(name, parent) {
        super(UIElementType.Group, name, parent);
        this.container = HTML.CreateDivElement('bevel');
        this.headerDiv = HTML.CreateDivElement('span');
        this.contentDiv = HTML.CreateDivElement();
        this.elements = [];
        {
            this.addToGroupHeader(HTML.CreateSpanElement(this.name));
            this.btnCollapse = this.addToGroupHeader(HTML.CreateButtonElement(BTN_TEXT_HIDE));
            this.container.appendChild(this.headerDiv);
            this.btnCollapse.onclick = () => {
                this.toggleContentVisibility();
            };
            this.setCollapsable(false);
        }
        let parentHTMLElement = parent ? parent.container : document.body;
        parentHTMLElement.appendChild(this.container);
        this.container.appendChild(this.contentDiv);
    }
    destroy() {
        const parentHTMLContainer = this.parent ? this.parent.container : document.body;
        parentHTMLContainer.removeChild(this.container);
        super.destroy();
    }
    getDomRootElement() {
        return this.container;
    }
    setPathValue(path, newValue) {
        if (path.length < 2 || path[0] !== this.getName())
            throw 'Invalid path';
        const child = this.getChildByName(path[1]);
        if (!child)
            throw 'Child not present!';
        child.setPathValue(path.slice(1), newValue);
    }
    addRGBWColorPicker(name, colorChannels) {
        const colorSelector = new UIColorSelector(name, this, colorChannels);
        this._addChildElement(colorSelector);
        return colorSelector;
    }
    addRadioGroup(name, entries, selectedIndex = 0) {
        const element = new UIRadioElement(name, this, entries, selectedIndex);
        this._addChildElement(element);
        return element;
    }
    addDropDown(name, entries, selectedIndex = 0) {
        const element = new UIDropDownElement(name, this, entries, selectedIndex);
        this._addChildElement(element);
        return element;
    }
    addCheckBox(name, value) {
        const element = new UICheckBoxElement(name, this, value);
        this._addChildElement(element);
        return element;
    }
    addRange(name, min, max, value) {
        const element = new UIRangeElement(name, this, min, max, value);
        this._addChildElement(element);
        return element;
    }
    addButton(name) {
        const element = new UIButtonElement(name, this);
        this._addChildElement(element);
        return element;
    }
    addNumberFieldInt32(name, value) {
        const element = new UIInt32NumberFieldElement(name, this, value);
        this._addChildElement(element);
        return element;
    }
    addTextField(name, value, maxLength) {
        const element = new UITextFieldElement(name, this, value, maxLength);
        this._addChildElement(element);
        return element;
    }
    addPasswordField(name, value, maxLength) {
        const element = new UIPasswordFieldElement(name, this, value, maxLength);
        this._addChildElement(element);
        return element;
    }
    addGroup(name) {
        const group = new UIGroupElement(name, this);
        this._addChildElement(group);
        return group;
    }
    _addChildElement(newElement) {
        this.elements.push(newElement);
        this.contentDiv.appendChild(newElement.getDomRootElement());
    }
    setCollapsable(collapsable) {
        if (collapsable) {
            this.btnCollapse.style.visibility = '';
            this.btnCollapse.style.width = '';
        }
        else {
            this.btnCollapse.style.visibility = 'hidden';
            this.btnCollapse.style.width = '0px';
            this.setCollapsed(false);
        }
    }
    setCollapsed(collapsed) {
        const contentDiv = this.contentDiv;
        if (collapsed) {
            contentDiv.style.visibility = 'hidden';
            contentDiv.style.height = '0px';
            this.btnCollapse.innerText = BTN_TEXT_SHOW;
        }
        else {
            contentDiv.style.visibility = '';
            contentDiv.style.height = '';
            this.btnCollapse.innerText = BTN_TEXT_HIDE;
        }
    }
    isCollapsed() {
        return this.contentDiv.style.visibility !== '';
    }
    toggleContentVisibility() {
        this.setCollapsed(!this.isCollapsed());
    }
    addToGroupHeader(htmlElement) {
        this.headerDiv.appendChild(htmlElement);
        return htmlElement;
    }
    getDivContainer() {
        return this.container;
    }
    getChildByName(name) {
        for (let i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].getName() == name) {
                return this.elements[i];
            }
        }
        return null;
    }
    eraseChildByRef(ref) {
        for (let i = 0; i < this.elements.length; ++i) {
            if (this.elements[i] === ref) {
                this.elements.splice(i, 1);
                this.container.removeChild(ref.getDomRootElement());
                return true;
            }
        }
        return false;
    }
    removeChildByName(name) {
        for (let i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].getName() == name) {
                this.elements[i].destroy();
                return true;
            }
        }
        return false;
    }
}
class UIColorSelector extends AUIElement {
    constructor(name, parent, colorChannels) {
        super(UIElementType.ColorSelector, name, parent);
        this.container = HTML.CreateDivElement('control-panel');
        this.colorPicker = HTML.CreateColorPickerElement();
        this.colorPicker.oninput = (_) => {
            const htmlColor = this.colorPicker.value;
            const rgb = ExtractRGB(htmlColor);
            this.onColorChange(new RGBWColor(rgb.r, rgb.g, rgb.b, 0));
        };
        this.colorPicker.dataset.name = name;
        const colorPickerText = HTML.CreateSpanElement(' ' + name);
        this.container.appendChild(this.colorPicker);
        this.container.appendChild(colorPickerText);
        this.container.appendChild(HTML.CreateBrElement());
        const pElement = document.createElement('p');
        const obj = this;
        const onColorChangeFunction = function () {
            const newColor = obj._getSliderColorValue();
            obj.onColorChange(newColor);
        };
        this.sliderR = CreateRangeSlider(name + 'R', 'Red', onColorChangeFunction, 'red');
        this.sliderG = CreateRangeSlider(name + 'G', 'Green', onColorChangeFunction, 'green');
        this.sliderB = CreateRangeSlider(name + 'B', 'Blue', onColorChangeFunction, 'blue');
        this.sliderW = CreateRangeSlider(name + 'W', 'White', onColorChangeFunction, 'white');
        pElement.appendChild(this.sliderR.container);
        pElement.appendChild(this.sliderG.container);
        pElement.appendChild(this.sliderB.container);
        pElement.appendChild(this.sliderW.container);
        if (!colorChannels.r) {
            this.sliderR.container.classList.add('hidden');
        }
        if (!colorChannels.g) {
            this.sliderG.container.classList.add('hidden');
        }
        if (!colorChannels.b) {
            this.sliderB.container.classList.add('hidden');
        }
        if (!colorChannels.w) {
            this.sliderW.container.classList.add('hidden');
        }
        this.container.appendChild(pElement);
    }
    getDomRootElement() {
        return this.container;
    }
    _getSliderColorValue() {
        const sliderR = this.sliderR.slider;
        const sliderG = this.sliderG.slider;
        const sliderB = this.sliderB.slider;
        const sliderW = this.sliderW.slider;
        return new RGBWColor(parseInt(sliderR.value), parseInt(sliderG.value), parseInt(sliderB.value), parseInt(sliderW.value));
    }
    setValue(newColor) {
        // Set color picker
        this.colorPicker.value = newColor.toHexColor();
        this.sliderR.slider.value = '' + newColor.r;
        this.sliderG.slider.value = '' + newColor.g;
        this.sliderB.slider.value = '' + newColor.b;
        this.sliderW.slider.value = '' + newColor.w;
    }
    getValue() {
        return this._getSliderColorValue();
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.RGBWColor) {
            throw 'Try to set a incompatible value type';
        }
        this.setValue(newValue.getRGBWValue());
    }
    onColorChange(newColor) {
        // Update all elements
        this.setValue(newColor);
        // Forward event
        this.onInputValueChange(this, new ValueWrapper(newColor));
    }
}
class AUISelectorElement extends AUIElement {
    constructor(type, name, parent, optionNames) {
        super(type, name, parent);
        this.optionNames = optionNames;
        this.selectedIndex = 0;
    }
    setSelectedIndex(newSelectedIndex) {
        if (newSelectedIndex >= this.optionNames.length || newSelectedIndex < 0) {
            throw "Invalid index, out of bounds";
        }
        this.selectedIndex = newSelectedIndex;
    }
    getSelectedIndex() {
        return this.selectedIndex;
    }
    getSelectedOption() {
        return this.optionNames[this.selectedIndex];
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.Number) {
            throw 'Try to set a incompatible value type';
        }
        this.setSelectedIndex(newValue.getNumberValue());
    }
}
class UIDropDownElement extends AUISelectorElement {
    constructor(name, parent, optionNames, selectedIndex = 0) {
        super(UIElementType.DropDownSelector, name, parent, optionNames);
        this.container = HTML.CreateDivElement('select');
        this.nameDiv = HTML.CreateDivElement();
        this.dropDown = HTML.CreateSelectElement();
        this.options = [];
        this.nameDiv.innerText = name;
        this.dropDown.oninput = () => {
            this.onInputValueChange();
        };
        for (let i = 0; i < optionNames.length; ++i) {
            const option = HTML.CreateOptionElement(optionNames[i]);
            option.innerText = optionNames[i];
            if (i == selectedIndex) {
                option.selected = true;
            }
            this.dropDown.appendChild(option);
            this.options.push(option);
        }
        ;
        this.container.appendChild(this.nameDiv);
        this.container.appendChild(this.dropDown);
    }
    getDomRootElement() {
        return this.container;
    }
    setSelectedIndex(newSelectedIndex) {
        super.setSelectedIndex(newSelectedIndex);
        this.options[newSelectedIndex].selected = true;
    }
    onInputValueChange() {
        for (let i = 0; i < this.options.length; ++i) {
            if (this.options[i].selected) {
                this.setSelectedIndex(i);
                break;
            }
        }
        super.onInputValueChange(this, new ValueWrapper(this.getSelectedIndex()));
    }
}
class UIRadioElement extends AUISelectorElement {
    constructor(name, parent, optionNames, selectedIndex = 0) {
        super(UIElementType.RadioSelector, name, parent, optionNames);
        this.container = HTML.CreateDivElement(['bevel', 'radio']);
        this.spanDiv = HTML.CreateDivElement('span');
        this.span = HTML.CreateSpanElement(name);
        this.innerDiv = HTML.CreateDivElement();
        this.options = [];
        const select = HTML.CreateSelectElement();
        for (let i = 0; i < optionNames.length; ++i) {
            const entry = optionNames[i];
            const label = HTML.CreateLabelElement('&nbsp;' + entry);
            const option = HTML.CreateRadioElement(name, entry);
            // Set unique name for own radio group
            option.name = this.getAbsoluteName().toString();
            option.oninput = () => {
                this.onInputValueChange();
            };
            if (i == selectedIndex) {
                option.checked = true;
            }
            label.appendChild(option);
            this.innerDiv.appendChild(label);
            this.options.push(option);
        }
        ;
        this.spanDiv.appendChild(this.span);
        this.container.appendChild(this.spanDiv);
        this.container.appendChild(this.innerDiv);
    }
    getDomRootElement() {
        return this.container;
    }
    setSelectedIndex(newSelectedIndex) {
        super.setSelectedIndex(newSelectedIndex);
        this.options[newSelectedIndex].checked = true;
    }
    onInputValueChange() {
        for (let i = 0; i < this.options.length; ++i) {
            if (this.options[i].checked) {
                this.setSelectedIndex(i);
                break;
            }
        }
        super.onInputValueChange(this, new ValueWrapper(this.getSelectedIndex()));
    }
}
class UICheckBoxElement extends AUIElement {
    constructor(name, parent, value) {
        super(UIElementType.CheckBoxSelector, name, parent);
        this.container = HTML.CreateDivElement('check');
        this.label = HTML.CreateLabelElement(name);
        this.checkbox = HTML.CreateCheckboxElement(value);
        this.checkbox.oninput = () => {
            this.onInputValueChange();
        };
        this.container.appendChild(this.label);
        this.container.appendChild(this.checkbox);
    }
    getDomRootElement() {
        return this.container;
    }
    setState(newState) {
        this.checkbox.checked = newState;
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.Boolean) {
            throw 'Try to set a incompatible value type';
        }
        this.setState(newValue.getBooleanValue());
    }
    onInputValueChange() {
        const newState = this.checkbox.checked;
        super.onInputValueChange(this, new ValueWrapper(newState));
    }
}
class UIRangeElement extends AUIElement {
    constructor(name, parent, min, max, value) {
        super(UIElementType.RangeSelector, name, parent);
        this.container = HTML.CreateDivElement('bevel');
        this.range = HTML.CreateRangeElement(min, max, value);
        this.minValue = min;
        this.maxValue = max;
        this.range.oninput = () => {
            this.onInputValueChange();
        };
        const spanDiv = HTML.CreateDivElement('span');
        const span = HTML.CreateSpanElement(name);
        spanDiv.appendChild(span);
        this.container.appendChild(spanDiv);
        this.container.appendChild(this.range);
    }
    getDomRootElement() {
        return this.container;
    }
    setValue(newValue) {
        if (newValue > this.maxValue || newValue < this.minValue) {
            throw "Invalid new value, out of bounds of range [" + this.minValue + ", " + this.maxValue + "].";
        }
        this.range.value = '' + newValue;
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.Number) {
            throw 'Try to set a incompatible value type';
        }
        this.setValue(newValue.getNumberValue());
    }
    getValue() {
        return parseInt(this.range.value);
    }
    onInputValueChange() {
        super.onInputValueChange(this, new ValueWrapper(this.getValue()));
    }
}
class UIButtonElement extends AUIElement {
    constructor(name, parent) {
        super(UIElementType.Button, name, parent);
        this.container = HTML.CreateDivElement('bevel');
        this.button = HTML.CreateButtonElement(name);
        this.container.appendChild(this.button);
        this.button.onclick = () => {
            this.onInputValueChange(this, new ValueWrapper(true));
        };
    }
    getDomRootElement() {
        return this.container;
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        // This is ignored here, as the button does not store its state
        // TODO: Trigger a click animation here?
    }
}
class UIInt32NumberFieldElement extends AUIElement {
    constructor(name, parent, value) {
        super(UIElementType.NumberFieldInt32, name, parent);
        this.min = -(0x7FFFFFFF + 1);
        this.max = (0x7FFFFFFF);
        this.container = HTML.CreateDivElement();
        this.numberField = HTML.CreateNumberFieldElement(value);
        this.numberField.min = "" + this.min;
        this.numberField.max = "" + this.max;
        this.numberField.oninput = () => {
            this._clampNumberFieldValue();
        };
        this.numberField.onblur = () => {
            this.onInputValueChange();
        };
        this.numberField.onkeydown = (event) => {
            if (event.key === "Enter") {
                this.onInputValueChange();
            }
        };
        const label = HTML.CreateLabelElement(name + ': ');
        this.container.appendChild(label);
        this.container.appendChild(this.numberField);
    }
    getDomRootElement() {
        return this.container;
    }
    setValue(newValue) {
        this.numberField.value = '' + newValue;
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.Number) {
            throw 'Try to set a incompatible value type';
        }
        this.setValue(newValue.getNumberValue());
    }
    setReadOnly(readOnly) {
        this.numberField.readOnly = readOnly;
        this.numberField.disabled = readOnly;
    }
    getValue() {
        return parseInt(this.numberField.value);
    }
    onInputValueChange() {
        if (this.numberField.readOnly) {
            return;
        }
        super.onInputValueChange(this, new ValueWrapper(this.getValue()));
    }
    _clampNumberFieldValue() {
        let value = parseInt(this.numberField.value);
        if (value > this.max) {
            this.numberField.value = "" + this.max;
        }
        else if (value < this.min) {
            this.numberField.value = "" + this.min;
        }
    }
}
class AUITextFieldElement extends AUIElement {
    constructor(type, name, parent, value, maxLength) {
        super(type, name, parent);
        this.container = HTML.CreateDivElement();
        this.textField = this.createTextField(value);
        this.maxLength = maxLength;
        this.textField.oninput = () => {
            if (this.maxLength != -1 && this.getValue().length > this.maxLength) {
                const limitedText = this.getValue().substring(0, this.maxLength);
                this.setValue(limitedText);
            }
            this.onInputValueChange();
        };
        const label = HTML.CreateLabelElement(name + ': ');
        this.container.appendChild(label);
        this.container.appendChild(this.textField);
    }
    getDomRootElement() {
        return this.container;
    }
    setPathValue(path, newValue) {
        this.checkValidPath(path);
        if (newValue.type !== ValueType.String) {
            throw 'Try to set a incompatible value type';
        }
        this.setValue(newValue.getStringValue());
    }
    setValue(newValue) {
        this.textField.value = newValue;
    }
    getValue() {
        return this.textField.value;
    }
    onInputValueChange() {
        super.onInputValueChange(this, new ValueWrapper(this.getValue()));
    }
}
class UITextFieldElement extends AUITextFieldElement {
    constructor(name, parent, value, maxLength) {
        super(UIElementType.TextField, name, parent, value, maxLength);
    }
    createTextField(value) {
        return HTML.CreateTextFieldElement(value);
    }
}
class UIPasswordFieldElement extends AUITextFieldElement {
    constructor(name, parent, value, maxLength) {
        super(UIElementType.PasswordField, name, parent, value, maxLength);
    }
    createTextField(value) {
        return HTML.CreatePasswordFieldElement(value);
    }
}
var GUIClientHeader;
(function (GUIClientHeader) {
    GUIClientHeader[GUIClientHeader["RequestGUI"] = 0] = "RequestGUI";
    GUIClientHeader[GUIClientHeader["SetValue"] = 1] = "SetValue";
})(GUIClientHeader || (GUIClientHeader = {}));
var GUIServerHeader;
(function (GUIServerHeader) {
    GUIServerHeader[GUIServerHeader["GUIData"] = 0] = "GUIData";
    GUIServerHeader[GUIServerHeader["UpdateValue"] = 1] = "UpdateValue";
})(GUIServerHeader || (GUIServerHeader = {}));
class GUIProtocolHandler {
    constructor(characteristic, onGuiJsonCallback, onValueUpdateCallback) {
        this.characteristic = characteristic;
        this.onGuiJsonCallback = onGuiJsonCallback;
        this.onValueUpdateCallback = onValueUpdateCallback;
        this.dataWriter = new BLEDataWriter(characteristic);
        this.onCharacteristicChanged = (event) => { this._onCharacteristicChanged(event); };
        this.pendingRequestIds = new Set();
        characteristic.addEventListener('characteristicvaluechanged', this.onCharacteristicChanged);
        const startNotificationFunction = () => {
            this.characteristic.startNotifications().then(() => {
                this._requestGUI();
            })
                .catch((err) => {
                Log("Error in startNotifications(): " + err + "; Repeating ...");
                startNotificationFunction();
            });
        };
        // Explicit stop notifications here, otherwise start notifications does not work when reconnecting.
        this.characteristic.stopNotifications().then(startNotificationFunction)
            .catch(() => { Log("Error in stopNotifications()"); });
    }
    setValue(absoluteName, newValue) {
        const requestId = this._generateRequestId();
        const head = PacketBuilder.CreatePacketHeader(GUIClientHeader.SetValue, requestId);
        const name = PacketBuilder.CreateLengthPrefixedString(absoluteName.toString());
        const value = PacketBuilder.CreateDynamicValue(newValue);
        const packet = MergeUint8Arrays3(head, name, value);
        this.dataWriter.sendData(absoluteName.toString(), packet);
    }
    _generateRequestId() {
        // TODO: Better unique request id (random number)
        const requestId = Date.now() % 0xFFFFFFFF;
        this.pendingRequestIds.add(requestId);
        return requestId;
    }
    _requestGUI() {
        const requestId = this._generateRequestId();
        const head = PacketBuilder.CreatePacketHeader(GUIClientHeader.RequestGUI, requestId);
        this.dataWriter.sendData('RequestHeader', head);
    }
    _onCharacteristicChanged(event) {
        const value = this.characteristic.value;
        const view = new Uint8Array(value.buffer);
        if (this.recvPendingData) {
            const completed = this.recvPendingData.appendData(view);
            if (completed) {
                this.recvPendingData = undefined;
            }
            return;
        }
        this._handlePacketBegin(view);
    }
    _handlePacketBegin(data) {
        const content = new DataView(data.buffer.slice(1));
        switch (data[0]) {
            case GUIServerHeader.GUIData: {
                this._handlePacket_GUIData(content);
                break;
            }
            case GUIServerHeader.UpdateValue: {
                this._handlePacket_UpdateValue(content);
                break;
            }
            default:
                Log("Reveived unknown data for the GUI!, packet id: " + data[0]);
        }
    }
    _handlePacket_GUIData(content) {
        const reader = new NetworkBufferReader(content);
        const requestId = reader.extractUint32();
        const length = reader.extractUint32();
        const isOwnRequest = this.pendingRequestIds.has(requestId);
        Log("JSON data length: " + length + " bytes, is own request: " + isOwnRequest);
        const ref = this;
        const remainingContent = new Uint8Array(reader.extractRemainingData().buffer);
        this.recvPendingData = new BLEDataReader(length, remainingContent, function (wholeBlock) {
            const jsonString = DecodeUTF8String(wholeBlock);
            const object = JSON.parse(jsonString);
            if (isOwnRequest) {
                ref.pendingRequestIds.delete(requestId);
                ref.onGuiJsonCallback(object);
            }
        });
    }
    _handlePacket_UpdateValue(content) {
        const reader = new NetworkBufferReader(content);
        const requestId = reader.extractUint32();
        const length = reader.extractUint32();
        const isOwnRequest = this.pendingRequestIds.has(requestId);
        if (isOwnRequest) {
            // We don't need to handle our own value updates, ignore them
            return;
        }
        // Value update by another instance (or remote itself)
        const key = reader.extractString();
        const value = this._readDataValue(reader);
        try {
            this.onValueUpdateCallback(key.split(','), value);
        }
        catch (err) {
            Log("Error during UpdateValue packet: " + err);
        }
    }
    _readDataValue(reader) {
        const valueType = reader.extractUint8();
        switch (valueType) {
            case ValueType.Number: {
                const numberValue = reader.extractInt32();
                return new ValueWrapper(numberValue);
            }
            case ValueType.Boolean: {
                const boolValue = reader.extractUint8() > 0;
                return new ValueWrapper(boolValue);
            }
            case ValueType.RGBWColor: {
                const packedValue = reader.extractUint32();
                const rgbwValue = ExtractPackedRGBW(packedValue);
                return new ValueWrapper(rgbwValue);
            }
            default: {
                throw "Received unhandled data type " + valueType + " via UpdateValue packet.";
            }
        }
    }
}
class PacketBuilder {
    static CreatePacketHeader(headByte, requestId) {
        return MergeUint8Arrays(PacketBuilder.CreateUInt8(headByte), PacketBuilder.CreateUInt32(requestId));
    }
    static CreateUInt8(number) {
        const data = new Uint8Array(1);
        data[0] = number;
        return data;
    }
    static CreateUInt32(number) {
        const data = new Uint8Array(4);
        new DataView(data.buffer).setUint32(0, number, false);
        return data;
    }
    static CreateLengthPrefixedString(str) {
        const data = EncodeUTF8String(str);
        return MergeUint8Arrays(PacketBuilder.CreateUInt32(data.length), data);
    }
    static CreateDynamicValue(value) {
        const prefix = PacketBuilder.CreateUInt8(value.type);
        switch (value.type) {
            case ValueType.Number:
                return MergeUint8Arrays(prefix, PacketBuilder.CreateUInt32(value.getNumberValue()));
            case ValueType.Boolean:
                return MergeUint8Arrays(prefix, PacketBuilder.CreateUInt8(value.getBooleanValue() ? 1 : 0));
            case ValueType.String:
                return MergeUint8Arrays(prefix, PacketBuilder.CreateLengthPrefixedString(value.getStringValue()));
            case ValueType.RGBWColor:
                const r = PacketBuilder.CreateUInt8(value.getRGBWValue().r);
                const g = PacketBuilder.CreateUInt8(value.getRGBWValue().g);
                const b = PacketBuilder.CreateUInt8(value.getRGBWValue().b);
                const w = PacketBuilder.CreateUInt8(value.getRGBWValue().w);
                return MergeUint8Arrays5(prefix, w, r, g, b);
        }
    }
}
class PendingDataEntry {
    constructor(groupName, data) {
        this.groupName = groupName;
        this.data = data;
    }
}
/**
 * Reliable data writer.
 * Writes data to the BLE characteristic.
 * Allows to override pending values by using the groupName.
 *
 * If the identical groupName is used multiple times then the last value is ensured
 * to be written. On changing groupName's every one will be written.'
 */
class BLEDataWriter {
    constructor(characteristic) {
        this.characteristic = characteristic;
        this.pendingData = [];
        this.failedRepeatCount = 0;
    }
    sendData(groupName, data) {
        const noOperationPending = this.pendingData.length === 0;
        const entry = new PendingDataEntry(groupName, data);
        if (this.pendingData.length > 0 && this.pendingData[0].groupName === groupName) {
            // Try to send data with the same content, replace the entry for next send operation
            this.pendingData[0].data = data;
            return;
        }
        this.pendingData.push(entry);
        if (noOperationPending) {
            this._sendData();
        }
    }
    _sendData() {
        const obj = this;
        const sendData = this.pendingData[0].data;
        const reqSendFunction = function (characteristic, data) {
            characteristic.writeValue(data).then(_ => {
                if (obj.pendingData[0].data === sendData) {
                    // Only remove the entry when the content was not replaced in the meantime
                    obj.pendingData.shift();
                }
                else {
                    obj._sendData();
                }
            }).catch(_ => {
                // This is a workaround for android, because most times the first request failes with a "unknown reason"
                // Also see https://github.com/LedgerHQ/ledgerjs/issues/352
                Log('BLE send operation failed, repeating ...');
                obj.failedRepeatCount++;
                if (obj.failedRepeatCount > 10) {
                    Log('Aborting repeat operation due to 10 failed retries ...');
                    return;
                }
                reqSendFunction(characteristic, data);
            });
        };
        reqSendFunction(this.characteristic, this.pendingData[0].data);
    }
}
class BLEDataReader {
    constructor(expectedSize, firstBlock, onCompleteFunction) {
        this.buffer = new Uint8Array(expectedSize);
        this.offset = firstBlock.length;
        this.onCompleteFunction = onCompleteFunction;
        MemCpy(this.buffer, 0, firstBlock, 0, firstBlock.length);
    }
    appendData(data) {
        MemCpy(this.buffer, this.offset, data, 0, data.length);
        this.offset += data.length;
        if (this.offset === this.buffer.length) {
            this.onCompleteFunction(this.buffer);
            return true;
        }
        return false;
    }
}
class NetworkBufferReader {
    constructor(buffer) {
        this.dataView = buffer;
        this.offset = 0;
    }
    getRemainingSize() {
        return this.dataView.byteLength - this.offset;
    }
    extractUint8() {
        this._checkRange(1);
        const value = this.dataView.getUint8(this.offset);
        this.offset += 1;
        return value;
    }
    extractUint32() {
        this._checkRange(4);
        const value = this.dataView.getUint32(this.offset, false);
        this.offset += 4;
        return value;
    }
    extractInt32() {
        this._checkRange(4);
        const value = this.dataView.getInt32(this.offset, false);
        this.offset += 4;
        return value;
    }
    extractData(length) {
        this._checkRange(length);
        const value = this.dataView.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return new DataView(value);
    }
    extractRemainingData() {
        return this.extractData(this.getRemainingSize());
    }
    extractString() {
        const strLength = this.extractUint32();
        const strData = this.extractData(strLength);
        return DecodeUTF8String(strData);
    }
    _checkRange(readSize) {
        if (readSize > this.getRemainingSize()) {
            throw 'Buffer range exception';
        }
    }
}
function ProcessJSON(currentRoot, jsonNode) {
    const jType = jsonNode.type.toLowerCase();
    const jName = jsonNode.name;
    switch (jType) {
        case 'root': {
            const rootNode = (jsonNode);
            // Note: Name is ignored here
            rootNode.elements.forEach(entry => {
                ProcessJSON(currentRoot, entry);
            });
            break;
        }
        case 'group': {
            const groupNode = (jsonNode);
            const elem = currentRoot.addGroup(jName);
            if (groupNode.collapsed !== undefined) {
                elem.setCollapsable(true);
                elem.setCollapsed(groupNode.collapsed);
            }
            for (let i = 0; i < groupNode.elements.length; ++i) {
                const entry = groupNode.elements[i];
                ProcessJSON(elem, entry);
            }
            break;
        }
        case 'range': {
            const rangeNode = (jsonNode);
            const jMin = rangeNode.min;
            const jMax = rangeNode.max;
            const jValue = rangeNode.value;
            currentRoot.addRange(jName, jMin, jMax, jValue);
            break;
        }
        case 'checkbox': {
            const checkboxNode = (jsonNode);
            const jValue = checkboxNode.value == 1 ? true : false;
            currentRoot.addCheckBox(jName, jValue);
            break;
        }
        case 'radio': {
            const radioNode = (jsonNode);
            const entries = radioNode.items;
            const jValue = radioNode.value;
            currentRoot.addRadioGroup(jName, entries, jValue);
            break;
        }
        case 'dropdown': {
            const dropDownNode = (jsonNode);
            const entries = dropDownNode.items;
            const jValue = dropDownNode.value;
            currentRoot.addDropDown(jName, entries, jValue);
            break;
        }
        case 'button': {
            currentRoot.addButton(jName);
            break;
        }
        case 'numberfield_int32': {
            const numberFieldNode = (jsonNode);
            const jValue = numberFieldNode.value;
            const jReadOnly = numberFieldNode.readOnly;
            currentRoot.addNumberFieldInt32(jName, jValue).setReadOnly(jReadOnly);
            break;
        }
        case 'textfield': {
            const textFieldNode = (jsonNode);
            const jValue = textFieldNode.value;
            const jMaxLength = textFieldNode.maxLength;
            currentRoot.addTextField(jName, jValue, jMaxLength);
            break;
        }
        case 'password': {
            const textFieldNode = (jsonNode);
            const jValue = textFieldNode.value;
            const jMaxLength = textFieldNode.maxLength;
            currentRoot.addPasswordField(jName, jValue, jMaxLength);
            break;
        }
        case 'rgbwrange': {
            const rgbwFieldNode = (jsonNode);
            const jValue = rgbwFieldNode.value;
            const channel = rgbwFieldNode.channel;
            const colorChannels = ExtractColorChannels(channel);
            const initialColor = ExtractPackedRGBW(jValue);
            const elem = currentRoot.addRGBWColorPicker(jName, colorChannels);
            elem.setValue(initialColor);
            break;
        }
        default:
            Log("Unhandled JSON element type: '" + jType + "'");
            break;
    }
}
class SliderElement {
    constructor(slider, container) {
        this.slider = slider;
        this.container = container;
    }
}
function CreateRangeSlider(id, title, onColorChangeFunction, containerClass = null) {
    const element = document.createElement('input');
    element.type = 'range';
    element.min = '0';
    element.max = '255';
    element.value = '0';
    element.classList.add('slider');
    element.id = id;
    element.oninput = () => {
        onColorChangeFunction();
    };
    const text = HTML.CreateSpanElement(title);
    const container = HTML.CreateDivElement();
    if (containerClass) {
        container.classList.add('slider-background');
        container.classList.add(containerClass);
    }
    container.appendChild(element);
    container.appendChild(text);
    return new SliderElement(element, container);
}
const PendingCharacteristicPromises = new Map();
const ConnectedDevices = new Set();
const SERVICE_UUID = "a6a2fc07-815c-4262-97a9-1cef5181a1e4";
const LED_CHARACTERISTICS = new Map([
    ["cd7ce55d-019d-4204-ad2e-a4d1464e3840", "Warp"],
    ["45864431-5197-4c89-9c52-30e8ec7ac523", "Impulse"],
    ["e38f4a08-6b53-4826-937d-d62183f02d1b", "Deflector"],
    ["529d6059-5633-4868-84a5-bfdef04296dd", "Bussard"],
    ["1dd3cff4-ee45-452c-a8c6-d3bd3a7986b3", "Mind Stone"],
    ["13e55e6a-1663-4272-ac08-e12617b2c822", "Soul Stone"],
    ["46c628e6-4a1d-48c3-ba76-412eff75ad6f", "Reality Stone"],
    ["269e55e4-0daf-47a9-86cc-ea8a5c680dd5", "Space Stone"],
    ["492a89d2-bcb8-4a3e-9b96-31000df7a3aa", "Power Stone"],
    ["03c7757e-be1c-42ef-9b58-c4be71fd3a7d", "Time Stone"],
]);
const CHARACTERISTIC_MODEL_NAME_UUID = "928ec7e1-b867-4b7d-904b-d3b8769a7299";
const CHARACTERISTIC_LEDINFO_UUID = "013201e4-0873-4377-8bff-9a2389af3883";
const CHARACTERISTIC_GUI_UUID = "013201e4-0873-4377-8bff-9a2389af3884";
function Log(str, addNewLine = true) {
    const element = document.getElementById('log');
    if (element == null) {
        console.log("Error: Log target not found for log message: " + str);
        return;
    }
    element.value += str;
    if (addNewLine) {
        element.value += '\n';
    }
    element.scrollTop = element.scrollHeight;
}
function LogClear() {
    const element = document.getElementById('log');
    if (element != null) {
        element.value = '';
    }
}
function EncodeUTF8String(str) {
    const enc = new TextEncoder();
    return enc.encode(str);
}
function DecodeUTF8String(data) {
    const dec = new TextDecoder("utf-8");
    return dec.decode(data);
}
function MergeUint8Arrays(array1, array2) {
    const result = new Uint8Array(array1.length + array2.length);
    result.set(array1);
    result.set(array2, array1.length);
    return result;
}
function MergeUint8Arrays3(array1, array2, array3) {
    return MergeUint8Arrays(MergeUint8Arrays(array1, array2), array3);
}
function MergeUint8Arrays4(array1, array2, array3, array4) {
    return MergeUint8Arrays(MergeUint8Arrays(array1, array2), MergeUint8Arrays(array3, array4));
}
function MergeUint8Arrays5(array1, array2, array3, array4, array5) {
    return MergeUint8Arrays(MergeUint8Arrays4(array1, array2, array3, array4), array5);
}
function MemCpy(target, targetOffset, source, sourceOffset, length) {
    for (let i = 0; i < length; ++i) {
        target[targetOffset + i] = source[sourceOffset + i];
    }
}
class RGBColor {
    constructor(r = 0, g = 0, b = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    toHexColor() {
        return '#' + this.r.toString(16).padStart(2, '0')
            + this.g.toString(16).padStart(2, '0')
            + this.b.toString(16).padStart(2, '0');
    }
}
class RGBWColor extends RGBColor {
    constructor(r = 0, g = 0, b = 0, w = 0) {
        super(r, g, b);
        this.w = w;
    }
    toUint8Array() {
        const array = new Uint8Array(4);
        array[0] = this.r;
        array[1] = this.g;
        array[2] = this.b;
        array[3] = this.w;
        return array;
    }
}
function ExtractRGB(color) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    return new RGBColor(r, g, b);
}
function ExtractPackedRGBW(color) {
    const w = (color & 0xFF000000) >> 24;
    const r = (color & 0x00FF0000) >> 16;
    const g = (color & 0x0000FF00) >> 8;
    const b = (color & 0x000000FF);
    return new RGBWColor(r, g, b, w);
}
class ColorChannels {
    constructor(r = true, g = true, b = true, w = true) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.w = w;
    }
}
function ExtractColorChannels(inputString) {
    const r = inputString.includes('R');
    const g = inputString.includes('G');
    const b = inputString.includes('B');
    const w = inputString.includes('W');
    return new ColorChannels(r, g, b, w);
}
class HTML {
    static CreateDivElement(optDivClasses = null) {
        if (optDivClasses != null && !(optDivClasses instanceof Array)) {
            return HTML.CreateDivElement([optDivClasses]);
        }
        const elem = document.createElement('div');
        if (optDivClasses) {
            optDivClasses.forEach(clazz => {
                elem.classList.add(clazz);
            });
        }
        return elem;
    }
    static CreateSpanElement(optInnerText = null) {
        const elem = document.createElement('span');
        if (optInnerText) {
            elem.innerText = optInnerText;
        }
        return elem;
    }
    static CreateRangeElement(min, max, value) {
        const elem = document.createElement('input');
        elem.type = 'range';
        elem.min = '' + min;
        elem.max = '' + max;
        elem.value = '' + value;
        return elem;
    }
    static CreateColorPickerElement() {
        const elem = document.createElement('input');
        elem.type = 'color';
        return elem;
    }
    static CreateCheckboxElement(value) {
        const elem = document.createElement('input');
        elem.type = 'checkbox';
        elem.checked = value;
        return elem;
    }
    static CreateRadioElement(name, value) {
        const elem = document.createElement('input');
        elem.type = 'radio';
        elem.name = name;
        elem.value = value;
        return elem;
    }
    static CreateButtonElement(name) {
        const elem = document.createElement('button');
        elem.innerText = name;
        return elem;
    }
    static CreateSelectElement() {
        return document.createElement('select');
    }
    static CreateOptionElement(value) {
        const elem = document.createElement('option');
        elem.value = value;
        return elem;
    }
    static CreateNumberFieldElement(value) {
        const elem = document.createElement('input');
        elem.type = 'number';
        elem.value = '' + value;
        return elem;
    }
    static CreateTextFieldElement(value) {
        const elem = document.createElement('input');
        elem.type = 'text';
        elem.value = value;
        return elem;
    }
    static CreatePasswordFieldElement(value) {
        const elem = document.createElement('input');
        elem.type = 'password';
        elem.value = value;
        return elem;
    }
    static CreateLabelElement(optValue) {
        const elem = document.createElement('label');
        if (optValue) {
            elem.innerHTML = optValue;
        }
        return elem;
    }
    static CreateBrElement() {
        return document.createElement('br');
    }
}
// Important: Needs the "bluetooth" permission when used in a iframe
var ControlMappingType;
(function (ControlMappingType) {
    ControlMappingType[ControlMappingType["UUID"] = 0] = "UUID";
})(ControlMappingType || (ControlMappingType = {}));
class DeviceConnection extends UIGroupElement {
    constructor(device, rootDiv) {
        super(device.name ? device.name : device.id, null);
        this.device = device;
        this.modelName = null;
        this.classicCharacteristicMapping = new Map();
        this.buttonDisconnect = HTML.CreateButtonElement('Disconnect');
        this.disconnectHandler = () => { this.disconnect(); };
        this.connectionFailedHandler = (err) => { this._connectionFailed(err); };
        this.ledInfoChangeHandler = (event) => { this._handleLedInfoEvent(event); };
        this.addToGroupHeader(this.buttonDisconnect);
        this._connect();
        ConnectedDevices.add(device);
        this.buttonDisconnect.onclick = () => {
            if (this.device.gatt && this.device.gatt.connected) {
                this.device.gatt.disconnect();
            }
            else {
                Log("Was not connected properly ... cleaning up");
                this.destroy();
            }
        };
    }
    destroy() {
        this.device.removeEventListener('gattserverdisconnected', this.disconnectHandler);
        if (this.ledInfoCharacteristic) {
            this.ledInfoCharacteristic.removeEventListener('characteristicvaluechanged', this.ledInfoChangeHandler);
        }
        if (this.device.gatt && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        //this.device.forget(); // Not supported on Android
        ConnectedDevices.delete(this.device);
        // Remove HTML Elements
        super.destroy();
    }
    disconnect() {
        try {
            this.destroy();
        }
        catch (err) {
            Log(String(err));
        }
        Log("Disconnected from " + this.getName());
    }
    _connect() {
        if (!this.device.gatt) {
            Log("Connected, but not GATT on device available!");
            throw "Connected, but not GATT on device available!";
        }
        this.device.gatt.connect().then(server => {
            Log("Getting Services ...");
            return server.getPrimaryServices();
        }).then(services => {
            Log("Gettings Characteristics ...");
            let queue = Promise.resolve();
            services.forEach(service => {
                queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
                    Log('> Service: ' + service.uuid);
                    characteristics.forEach(characteristic => {
                        this.onNewCharacteristic(characteristic);
                        Log('>> Characteristic: ' + characteristic.uuid + ' ' + GetSupportedProperties(characteristic));
                    });
                }));
            });
        }).catch(this.connectionFailedHandler);
        this.device.addEventListener('gattserverdisconnected', this.disconnectHandler);
    }
    _connectionFailed(err) {
        Log("Connection failed with error: " + err.message);
        this.disconnect();
    }
    _addRGBWCharacteristicElement(name, characteristic, colorChannels) {
        const controlElement = this.addRGBWColorPicker(name, colorChannels);
        const absoluteName = controlElement.getAbsoluteName();
        this.classicCharacteristicMapping.set(absoluteName.toString(), characteristic);
    }
    _removeRGBWCharacteristicElementWhenExists(name, characteristic) {
        return this.removeChildByName(name);
    }
    onInputValueChange(sourceElement, newValue) {
        const sourceAbsoluteName = sourceElement.getAbsoluteName();
        if (this._handleClassicCharacteristicMapping(sourceAbsoluteName, sourceElement, newValue))
            return;
        if (this.guiControl) {
            const remoteName = sourceAbsoluteName.slice(1);
            this.guiControl.setValue(remoteName, newValue);
            return;
        }
        Log("Unhandled input event from element: " + sourceAbsoluteName);
    }
    _handleClassicCharacteristicMapping(absoluteName, sourceElement, newValue) {
        const entry = this.classicCharacteristicMapping.get(absoluteName.toString());
        if (!entry)
            return false;
        if (sourceElement.type !== UIElementType.ColorSelector)
            throw 'Input event from classic characteristic mapping, but source is not a color selector!';
        if (newValue.type !== ValueType.RGBWColor)
            throw 'Input value is not a color value!';
        SetColor(entry, newValue.getRGBWValue());
        return true;
    }
    onNewCharacteristic(characteristic) {
        if (this._handleKnownNameCharacteristic(characteristic))
            return;
        if (characteristic.uuid == CHARACTERISTIC_MODEL_NAME_UUID) {
            characteristic.readValue().then((data) => {
                const name = DecodeUTF8String(data);
                this.modelName = name;
                // TODO: Do something with the model name?
            });
        }
        else if (characteristic.uuid == CHARACTERISTIC_LEDINFO_UUID) {
            this.ledInfoCharacteristic = characteristic;
            this._handleLedInfoCharacteristic(characteristic);
        }
        else if (characteristic.uuid == CHARACTERISTIC_GUI_UUID) {
            const handleJsonFunction = (json) => {
                ProcessJSON(this, json);
            };
            const handleUpdateValueFunction = (path, newValue) => {
                const completePath = [this.getName()].concat(path);
                this.setPathValue(completePath, newValue);
            };
            this.guiControl = new GUIProtocolHandler(characteristic, handleJsonFunction, handleUpdateValueFunction);
        }
    }
    _handleLedInfoCharacteristic(characteristic) {
        characteristic.addEventListener('characteristicvaluechanged', this.ledInfoChangeHandler);
        const reqSendFunction = function (characteristic, cmd) {
            SendBLERequest(characteristic, cmd).catch(_ => {
                // This is a workaround for android, because most times the first request failes with a "unknown reason"
                // Also see https://github.com/LedgerHQ/ledgerjs/issues/352
                Log('Request ' + cmd + ' failed, repeating ...');
                reqSendFunction(characteristic, cmd);
            });
        };
        const startNotificationFunction = () => {
            characteristic.startNotifications().then(() => {
                reqSendFunction(characteristic, 'list');
            })
                .catch((err) => {
                Log("Error in startNotifications(): " + err + "; Repeating ...");
                startNotificationFunction();
            });
        };
        // Explicit stop notifications here, otherwise start notifications does not work when reconnecting.
        characteristic.stopNotifications().then(startNotificationFunction)
            .catch(() => { Log("Error in stopNotifications()"); });
    }
    _handleLedInfoEvent(event) {
        if (!event.target) {
            Log("Notification event without a target");
            return;
        }
        if (event.target.hasOwnProperty('value')) {
            Log("Notification event without a value");
            return;
        }
        if (!this.ledInfoCharacteristic) {
            throw "Something bad happend";
        }
        const value = this.ledInfoCharacteristic.value;
        const view = new Uint8Array(value.buffer);
        if (view[0] == 0x01) {
            const rest = value.buffer.slice(1);
            const dec = new TextDecoder("utf-8");
            const decoded = dec.decode(rest);
            const params = decoded.split(':');
            const uuid = params[0];
            const name = params[1];
            const colorChannels = params[2];
            Log("Custom UUID [" + uuid + "] with color channels: " + colorChannels);
            const colors = ExtractColorChannels(colorChannels);
            this.ledInfoCharacteristic.service.getCharacteristic(uuid).then(c => {
                this._removeRGBWCharacteristicElementWhenExists(name, c);
                this._addRGBWCharacteristicElement(name, c, colors);
            });
        }
    }
    _handleKnownNameCharacteristic(characteristic) {
        const knownName = LED_CHARACTERISTICS.get(characteristic.uuid);
        if (!knownName)
            return false;
        const uuid = characteristic.uuid;
        const name = LED_CHARACTERISTICS.get(characteristic.uuid);
        if (name == null)
            throw 'Lookup failure';
        this._addRGBWCharacteristicElement(name, characteristic, new ColorChannels());
        return true;
    }
}
function IsDeviceAlreadyConnected(device) {
    return ConnectedDevices.has(device);
}
function Scan() {
    Log("Starting scan ...");
    try {
        navigator.bluetooth.requestDevice({
            //acceptAllDevices: true,
            filters: [{
                    services: [SERVICE_UUID]
                }]
        }).then(device => {
            if (IsDeviceAlreadyConnected(device)) {
                Log("Device is already connected, ignoring request.");
                return;
            }
            Log("Selected device '" + device.name + "', connecting ...");
            new DeviceConnection(device, document.body);
        });
    }
    catch (ex) {
        Log('Error: ' + ex);
    }
}
function SetColor(characteristic, rgbw) {
    const array = rgbw.toUint8Array();
    const uuid = characteristic.uuid;
    const updatePending = PendingCharacteristicPromises.has(uuid);
    // Set or replace pending value
    PendingCharacteristicPromises.set(uuid, rgbw);
    if (!updatePending) {
        characteristic.writeValue(array).then(() => {
            const currentSetValue = rgbw;
            const targetValue = PendingCharacteristicPromises.get(uuid);
            PendingCharacteristicPromises.delete(uuid);
            if (targetValue != currentSetValue) {
                // User has set a different value in the mean time, need to send again
                SetColor(characteristic, targetValue);
            }
        });
    }
}
function GetSupportedProperties(characteristic) {
    const supportedProperties = [];
    for (const p in characteristic.properties) {
        if (characteristic.properties[p] === true) {
            supportedProperties.push(p.toUpperCase());
        }
    }
    return '[' + supportedProperties.join(', ') + ']';
}
function SendBLERequest(characteristic, cmd) {
    Log("Sending request '" + cmd + "'");
    const header = new Uint8Array(1);
    header[0] = 0x00;
    const request = MergeUint8Arrays(header, EncodeUTF8String(cmd));
    return characteristic.writeValue(request);
}
// Set global error handler to debug limited devices (...)
window.onerror = (event) => {
    if (event instanceof ErrorEvent) {
        Log(event.message);
        return;
    }
    else if (event instanceof String) {
        Log("" + event);
    }
};
function Init() {
    LogClear();
    if (!navigator.bluetooth) {
        Log("Sorry, your browser does not support web bluetooth.");
    }
    const params = new URLSearchParams(window.location.search);
    const showTestElements = params.get('test');
    if (showTestElements == 'true') {
        Log("==> Adding test GUI elements <==");
        const rootGroup = new UIGroupElement('Test group', null);
        rootGroup.addToGroupHeader(HTML.CreateButtonElement('Test button without a function'));
        rootGroup.addRGBWColorPicker('Test color selection', new ColorChannels());
        const nestedGroup = rootGroup.addGroup('Sub Group');
        nestedGroup.addRGBWColorPicker('Sub color picker with only the white channel', new ColorChannels(false, false, false, true));
        nestedGroup.addRadioGroup('Radio select test', ['Entry 1', 'Entry 2', 'Entry 3'], 1);
        nestedGroup.addDropDown('Drop down test', ['Entry 1', 'Entry 2', 'Entry 3'], 1);
        const group2 = rootGroup.addGroup("Sub Group 2");
        group2.addCheckBox('CheckBox 1', false);
        group2.addCheckBox('CheckBox 2', true);
        group2.addRange('Range [0, 255]', 0, 255, 0).setValue(10);
        group2.addRange('Range [-1, 1]', -1, 1, 0);
        group2.addButton('Test button');
        group2.addNumberFieldInt32('Number field 1', 42);
        group2.addNumberFieldInt32('Number field 2', 42).setReadOnly(true);
    }
}
Init();
