import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';

const modifiers = ['Control', 'Shift', 'Alt', 'Meta'];
const ltrOverride = '\u202d';

interface Key {
  control?: true;
  shift?: true;
  alt?: true;
  meta?: true;
  key?: string;
  repeat?: number;
}

function keyString(key: Key) {
  const parts: string[] = [];
  if (key.control) {
    parts.push('Control');
  }
  if (key.alt) {
    parts.push('Alt');
  }
  if (key.meta) {
    parts.push('Meta');
  }
  if (key.shift && (parts.length || !isTextKey(key))) {
    parts.push('Shift');
  }
  if (key.key) {
    parts.push(key.key);
  }
  return parts.join('+');
}

function isTextKey(key: Key) {
  return key.key?.length === 1 && !key.control && !key.alt && !key.meta;
}

function isEmptyKey(key: Key) {
  return !(key.key ?? key.shift ?? key.control ?? key.alt ?? key.meta);
}

function keyEquals(a: Key, b: Key) {
  return (
    a.key === b.key &&
    a.shift == b.shift &&
    a.control === b.control &&
    a.alt === b.alt &&
    a.meta === b.meta
  );
}

function apply(key: Key, keys: Key[]) {
  const lastKey = keys.at(-1);
  if (key.key === 'Backspace' && lastKey && isTextKey(lastKey)) {
    keys.pop();
    return;
  }
  if (lastKey && !isTextKey(key) && keyEquals(key, lastKey)) {
    lastKey.repeat = (lastKey.repeat ?? 1) + 1;
    return;
  }
  keys.push(key);
}

@customElement('web-key')
export class WebKey extends LitElement {
  static override readonly styles = css`
    .combo {
      border: solid 1px currentcolor;
      border-radius: 3px;
      padding: 2px;
      padding-right: 4px;
      padding-left: 4px;
      margin-left: 3px;
      margin-right: 3px;
    }
    .repeat {
      font-size: smaller;
    }
    .pending {
      font-style: italic;
      opacity: 0.5;
      display: none;
    }
    .space {
      text-decoration: dotted underline;
    }
    :host {
      width: calc(100vw - 20px);
      border: 0;
      margin-left: 0;
      margin-right: 0;
      padding: 10px;
      overflow: hidden;
      white-space: pre;
      direction: rtl;
      text-overflow: ellipsis;
      text-align: center;
      font-family: 'Noto Sans Mono', monospace;
      font-variant-ligatures: none;
      font-weight: normal;
      font-size: 18px;
      line-height: calc(1rlh + 10px);
      touch-action: none;
      background-color: #aaac;
      user-select: none;
    }
    #cursor {
      animation: blink 1000ms step-start infinite;
    }
    .combo,
    .text,
    .space {
      animation: underline 300ms;
    }
    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
    @keyframes underline {
      0% {
        text-decoration: underline;
      }
      100% {
        text-decoration: underline;
      }
    }
  }
  `;
  @property({reflect: true})
  override accessor popover = 'manual';

  #control = false;
  #controlConsumed = false;
  #shift = false;
  #shiftConsumed = false;
  #meta = false;
  #metaConsumed = false;
  #alt = false;
  #altConsumed = false;
  #hideShow = this.animate({opacity: [0, 1]}, {duration: 250, fill: 'both'});

  get modifiers() {
    return {
      control: this.#control || undefined,
      shift: this.#shift || undefined,
      alt: this.#alt || undefined,
      meta: this.#meta || undefined,
    };
  }

  #keys: Key[] = [];

  #timeout?: number;
  #scheduleClear(delay = 2500) {
    clearTimeout(this.#timeout);
    this.#timeout = setTimeout(() => {
      this.#keys.length = 0;
      this.requestUpdate();
    }, delay);
  }

  constructor() {
    super();
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('pointermove', this.#onPointerMove);

    const keys = 'webkey.'.split('');
    const interval = setInterval(() => {
      this.#keys.push({
        key: keys.shift(),
      });
      this.requestUpdate();
      if (!keys.length) {
        clearInterval(interval);
        this.#scheduleClear(300);
      }
    }, 100);
  }
  #startY = 0;
  #onPointerDown(e: PointerEvent) {
    this.setPointerCapture(e.pointerId);
    this.#startY = e.clientY;
    e.preventDefault();
  }
  #onPointerMove(e: PointerEvent) {
    if (!this.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    const top = this.offsetTop + e.clientY - this.#startY;
    this.#startY = e.clientY;
    this.attributeStyleMap.set('margin-top', `${top}px`);
  }
  #keydown = (e: KeyboardEvent) => {
    this.#control = e.ctrlKey;
    this.#shift = e.shiftKey;
    this.#meta = e.metaKey;
    this.#alt = e.altKey;
    if (!modifiers.includes(e.key)) {
      if (this.#control) {
        this.#controlConsumed = true;
      }
      if (this.#shift) {
        this.#shiftConsumed = true;
      }
      if (this.#alt) {
        this.#altConsumed = true;
      }
      if (this.#meta) {
        this.#metaConsumed = true;
      }
      const key = {
        ...this.modifiers,
        key: e.key,
      };
      apply(key, this.#keys);
    }
    this.#scheduleClear();
    this.requestUpdate();
  };
  #keyup = (e: KeyboardEvent) => {
    this.#control = e.ctrlKey;
    this.#shift = e.shiftKey;
    this.#meta = e.metaKey;
    this.#alt = e.altKey;

    switch (e.key) {
      case 'Control':
        if (!this.#controlConsumed) {
          apply({control: true}, this.#keys);
        }
        this.#controlConsumed = false;
        break;
      case 'Shift':
        if (!this.#shiftConsumed) {
          apply({shift: true}, this.#keys);
        }
        this.#shiftConsumed = false;
        break;
      case 'Alt':
        if (!this.#altConsumed) {
          apply({alt: true}, this.#keys);
        }
        this.#altConsumed = false;
        break;
      case 'Meta':
        if (!this.#metaConsumed) {
          apply({meta: true}, this.#keys);
        }
        this.#metaConsumed = false;
        break;
    }
    this.#scheduleClear();
    this.requestUpdate();
  };
  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.#keydown, {capture: true});
    document.addEventListener('keyup', this.#keyup, {capture: true});
  }
  override disconnectedCallback(): void {
    document.removeEventListener('keydown', this.#keydown);
    document.removeEventListener('keyup', this.#keyup);
  }

  protected override render() {
    const maxLines = 4;
    const newlines = this.#keys.filter((key) => key.key === 'Enter');
    if (newlines.length >= maxLines) {
      this.#keys.splice(0, this.#keys.indexOf(newlines[0]) + 1);
    }
    const pending = isEmptyKey(this.modifiers)
      ? undefined
      : html`<span class="combo pending">${keyString(this.modifiers)}</span>`;
    return html`${ltrOverride}${repeat(this.#keys, (key) =>
        this.#renderKey(key),
      )}<span id="cursor">|${pending}</span>`;
  }
  #renderKey(key: Key) {
    if (isTextKey(key)) {
      return html`<span class="text ${key.key === ' ' ? 'space' : ''}"
        >${keyString(key)}</span
      >`;
    } else {
      const newline =
        key.key === 'Enter' ? html`<br />${ltrOverride}` : undefined;
      const repeat =
        (key.repeat ?? 1) > 1
          ? html`<span class="repeat">×${key.repeat}</span>`
          : undefined;
      return html`<span class="combo">${keyString(key)}${repeat}</span
        >${newline}`;
    }
  }
  protected override updated() {
    // this.hidePopover();
    if (this.#keys.length) {
      this.showPopover();
      this.#hideShow.playbackRate = 1;
    } else if (this.#hideShow.playbackRate !== -1) {
      this.#hideShow.playbackRate = -1;
      this.#hideShow.finished.then(() => {
        if (!this.#keys.length) {
          this.hidePopover();
        }
      });
    }
  }
  protected override firstUpdated() {
    // this.showPopover();
  }
}
