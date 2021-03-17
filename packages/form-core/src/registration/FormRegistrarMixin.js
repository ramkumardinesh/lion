// eslint-disable-next-line max-classes-per-file
import { dedupeMixin } from '@lion/core';
import { FormControlsCollection } from './FormControlsCollection.js';
import { FormRegisteringMixin } from './FormRegisteringMixin.js';

/**
 * @typedef {import('../../types/registration/FormRegistrarMixinTypes').FormRegistrarMixin} FormRegistrarMixin
 * @typedef {import('../../types/registration/FormRegistrarMixinTypes').ElementWithParentFormGroup} ElementWithParentFormGroup
 * @typedef {import('../../types/registration/FormRegisteringMixinTypes').FormRegisteringHost} FormRegisteringHost
 */

/**
 * @typedef {import('../../types/FormControlMixinTypes').FormControlHost} FormControlHost
 * @typedef {FormControlHost & HTMLElement & {_parentFormGroup?:HTMLElement, checked?:boolean}} FormControl
 */

/**
 * @desc This allows an element to become the manager of a register.
 * It basically keeps track of a FormControlsCollection that it stores in .formElements
 * This will always be an array of all elements.
 * In case of a form or fieldset(sub form), it will also act as a key based object with FormControl
 * (fields, choice groups or fieldsets)as keys.
 * For choice groups, the value will only stay an array.
 * See FormControlsCollection for more information
 * @type {FormRegistrarMixin}
 * @param {import('@open-wc/dedupe-mixin').Constructor<import('@lion/core').LitElement>} superclass
 */
const FormRegistrarMixinImplementation = superclass =>
  // eslint-disable-next-line no-shadow, no-unused-vars
  class extends FormRegisteringMixin(superclass) {
    static get properties() {
      return {
        /**
         * @desc Flag that determines how ".formElements" should behave.
         * For a regular fieldset (see LionFieldset) we expect ".formElements"
         * to be accessible as an object.
         * In case of a radio-group, a checkbox-group or a select/listbox,
         * it should act like an array (see ChoiceGroupMixin).
         * Usually, when false, we deal with a choice-group (radio-group, checkbox-group,
         * (multi)select)
         */
        _isFormOrFieldset: { type: Boolean },
      };
    }

    constructor() {
      super();
      this.formElements = new FormControlsCollection();

      this._isFormOrFieldset = false;

      this._onRequestToAddFormElement = this._onRequestToAddFormElement.bind(this);
      this._onRequestToChangeFormElementName = this._onRequestToChangeFormElementName.bind(this);

      this.addEventListener(
        'form-element-register',
        /** @type {EventListenerOrEventListenerObject} */ (this._onRequestToAddFormElement),
      );
      this.addEventListener(
        'form-element-name-changed',
        /** @type {EventListenerOrEventListenerObject} */ (this._onRequestToChangeFormElementName),
      );
    }

    /**
     *
     * @param {ElementWithParentFormGroup} el
     */
    isRegisteredFormElement(el) {
      return this.formElements.some(exitingEl => exitingEl === el);
    }

    /**
     * @param {FormControl} child the child element (field)
     * @param {number} indexToInsertAt index to insert the form element at
     */
    addFormElement(child, indexToInsertAt) {
      // This is a way to let the child element (a lion-fieldset or lion-field) know, about its parent
      // eslint-disable-next-line no-param-reassign
      child._parentFormGroup = this;

      // 1. Add children as array element
      if (indexToInsertAt >= 0) {
        this.formElements.splice(indexToInsertAt, 0, child);
      } else {
        this.formElements.push(child);
      }

      // 2. Add children as object key
      if (this._isFormOrFieldset) {
        const { name } = child;
        if (!name) {
          console.info('Error Node:', child); // eslint-disable-line no-console
          throw new TypeError('You need to define a name');
        }
        // @ts-expect-error this._isFormOrFieldset true means we can assume `this.name` exists
        if (name === this.name) {
          console.info('Error Node:', child); // eslint-disable-line no-console
          throw new TypeError(`You can not have the same name "${name}" as your parent`);
        }

        if (name.substr(-2) === '[]') {
          if (!Array.isArray(this.formElements[name])) {
            this.formElements[name] = new FormControlsCollection();
          }
          if (indexToInsertAt > 0) {
            this.formElements[name].splice(indexToInsertAt, 0, child);
          } else {
            this.formElements[name].push(child);
          }
        } else if (!this.formElements[name]) {
          this.formElements[name] = child;
        } else {
          console.info('Error Node:', child); // eslint-disable-line no-console
          throw new TypeError(
            `Name "${name}" is already registered - if you want an array add [] to the end`,
          );
        }
      }
    }

    /**
     * @param {FormRegisteringHost} child the child element (field)
     */
    removeFormElement(child) {
      // 1. Handle array based children
      const index = this.formElements.indexOf(child);
      if (index > -1) {
        this.formElements.splice(index, 1);
      }

      // 2. Handle name based object keys
      if (this._isFormOrFieldset) {
        // @ts-expect-error
        const { name } = child; // FIXME: <-- ElementWithParentFormGroup should become LionFieldWithParentFormGroup so that "name" exists
        if (name.substr(-2) === '[]' && this.formElements[name]) {
          const idx = this.formElements[name].indexOf(child);
          if (idx > -1) {
            this.formElements[name].splice(idx, 1);
          }
        } else if (this.formElements[name]) {
          delete this.formElements[name];
        }
      }
    }

    /**
     * @param {CustomEvent} ev
     * @protected
     */
    _onRequestToAddFormElement(ev) {
      const child = ev.detail.element;
      if (child === this) {
        // as we fire and listen - don't add ourselves
        return;
      }
      if (this.isRegisteredFormElement(child)) {
        // do not readd already existing elements
        return;
      }
      ev.stopPropagation();

      // Check for siblings to determine the right order to insert into formElements
      // If there is no next sibling, index is -1
      let indexToInsertAt = -1;
      if (this.formElements && Array.isArray(this.formElements)) {
        indexToInsertAt = this.formElements.indexOf(child.nextElementSibling);
      }
      this.addFormElement(child, indexToInsertAt);
    }

    /**
     * @param {CustomEvent} ev
     * @protected
     */
    _onRequestToChangeFormElementName(ev) {
      const element = this.formElements[ev.detail.oldName];
      if (element) {
        this.formElements[ev.detail.newName] = element;
        delete this.formElements[ev.detail.oldName];
      }
    }

    /**
     * @param {CustomEvent} ev
     * @protected
     */
    _onRequestToRemoveFormElement(ev) {
      const child = ev.detail.element;
      if (child === this) {
        // as we fire and listen - don't remove ourselves
        return;
      }
      if (!this.isRegisteredFormElement(child)) {
        // do not remove non existing elements
        return;
      }
      ev.stopPropagation();

      this.removeFormElement(child);
    }
  };

export const FormRegistrarMixin = dedupeMixin(FormRegistrarMixinImplementation);
