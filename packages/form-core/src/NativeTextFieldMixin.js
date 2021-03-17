import { dedupeMixin } from '@lion/core';

/**
 * @typedef {import('../types/NativeTextFieldMixinTypes').NativeTextFieldMixin} NativeTextFieldMixin
 * @type {NativeTextFieldMixin}
 * @param {import('@open-wc/dedupe-mixin').Constructor<import('../types/NativeTextFieldMixinTypes').NativeTextField>} superclass} superclass
 */
const NativeTextFieldMixinImplementation = superclass =>
  class NativeTextFieldMixin extends superclass {
    /** @type {number} */
    get selectionStart() {
      const native = this._inputNode;
      if (native && native.selectionStart) {
        return native.selectionStart;
      }
      return 0;
    }

    set selectionStart(value) {
      const native = this._inputNode;
      if (native && native.selectionStart) {
        native.selectionStart = value;
      }
    }

    /** @type {number} */
    get selectionEnd() {
      const native = this._inputNode;
      if (native && native.selectionEnd) {
        return native.selectionEnd;
      }
      return 0;
    }

    set selectionEnd(value) {
      const native = this._inputNode;
      if (native && native.selectionEnd) {
        native.selectionEnd = value;
      }
    }

    get value() {
      return (this._inputNode && this._inputNode.value) || this.__value || '';
    }

    // We don't delegate, because we want to preserve caret position via _setValueAndPreserveCaret
    /** @param {string} value */
    set value(value) {
      // if not yet connected to dom can't change the value
      if (this._inputNode) {
        this._setValueAndPreserveCaret(value);
        /** @type {string | undefined} */
        this.__value = undefined;
      } else {
        this.__value = value;
      }
    }

    /**
     * Restores the cursor to its original position after updating the value.
     * @param {string} newValue The value that should be saved.
     * @protected
     */
    _setValueAndPreserveCaret(newValue) {
      // Only preserve caret if focused (changing selectionStart will move focus in Safari)
      if (this.focused) {
        // Not all elements might have selection, and even if they have the
        // right properties, accessing them might throw an exception (like for
        // <input type=number>)
        try {
          // SelectElement doesn't have selectionStart/selectionEnd
          if (!(this._inputNode instanceof HTMLSelectElement)) {
            const start = this._inputNode.selectionStart;
            this._inputNode.value = newValue;
            // The cursor automatically jumps to the end after re-setting the value,
            // so restore it to its original position.
            this._inputNode.selectionStart = start;
            this._inputNode.selectionEnd = start;
          }
        } catch (error) {
          // Just set the value and give up on the caret.
          this._inputNode.value = newValue;
        }
      } else {
        this._inputNode.value = newValue;
      }
    }
  };

export const NativeTextFieldMixin = dedupeMixin(NativeTextFieldMixinImplementation);
