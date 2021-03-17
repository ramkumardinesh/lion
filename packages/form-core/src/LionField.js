import { LitElement, SlotMixin } from '@lion/core';
import { ValidateMixin } from './validate/ValidateMixin.js';
import { FocusMixin } from './FocusMixin.js';
import { FormatMixin } from './FormatMixin.js';
import { FormControlMixin } from './FormControlMixin.js';
import { InteractionStateMixin } from './InteractionStateMixin.js'; // applies FocusMixin

/**
 * `LionField`: wraps <input>, <textarea>, <select> and other interactable elements.
 * Also it would follow a nice hierarchy: lion-form -> lion-fieldset -> lion-field
 *
 * Note: We don't support placeholders, because we have a helper text and
 * placeholders confuse the user with accessibility needs.
 *
 * Please see the docs for in depth information.
 *
 * @example
 * <lion-field name="myName">
 *   <label slot="label">My Input</label>
 *   <input type="text" slot="input">
 * </lion-field>
 *
 * @customElement lion-field
 */
export class LionField extends FormControlMixin(
  InteractionStateMixin(FocusMixin(FormatMixin(ValidateMixin(SlotMixin(LitElement))))),
) {
  /** @type {any} */
  static get properties() {
    return {
      autocomplete: {
        type: String,
        reflect: true,
      },
      value: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.name = '';
    /** @type {string | undefined} */
    this.autocomplete = undefined;
  }

  /**
   * @param {import('@lion/core').PropertyValues } changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    /** @type {any} */
    this._initialModelValue = this.modelValue;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onChange = this._onChange.bind(this);
    this._inputNode.addEventListener('change', this._onChange);
    this.classList.add('form-field'); // eslint-disable-line
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._inputNode.removeEventListener('change', this._onChange);
  }

  resetInteractionState() {
    super.resetInteractionState();
    this.submitted = false;
  }

  /**
   * Resets modelValue to initial value.
   * Interaction states are cleared
   */
  reset() {
    this.modelValue = this._initialModelValue;
    this.resetInteractionState();
  }

  /**
   * Clears modelValue.
   * Interaction states are not cleared (use resetInteractionState for this)
   */
  clear() {
    this.modelValue = ''; // can't set null here, because IE11 treats it as a string
  }

  /**
   * Dispatches custom bubble event
   * @protected
   */
  _onChange() {
    this.dispatchEvent(
      new CustomEvent('user-input-changed', {
        bubbles: true,
      }),
    );
  }
}
