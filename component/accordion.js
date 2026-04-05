class accor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 8px;
          border-radius: 10px;
          overflow: hidden;
          --duration: 0.25s;

          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.35);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 10px 12px;
          font-weight: 700;
          font-size: 14px;
          user-select: none;
          background: rgba(255, 255, 255, 0.18);
          color: var(--text-primary);
        }

        .header:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .icon {
          transition: transform var(--duration) ease;
          opacity: 0.7;
        }

        :host([open]) .icon {
          transform: rotate(90deg);
          opacity: 1;
        }

        .content {
          overflow: hidden;
          max-height: 0;
          transition: max-height var(--duration) ease;
        }

        ::slotted([slot="item"]) {
          display: block;
          padding: 8px 12px;
        }

        ::slotted([slot="item"]) a {
          display: block;
          padding: 6px 0;
          text-decoration: none;
          color: var(--text-primary);
          border-radius: 6px;
          transition: 0.15s ease;
        }

        ::slotted([slot="item"]) a:hover {
          background: rgba(183, 245, 200, 0.32);
          box-shadow: 0 0 6px rgba(183, 245, 200, 0.45);
        }
      </style>

      <div class="header">
        <slot name="header"></slot>
        <span class="icon">▶</span>
      </div>

      <div class="content">
        <slot name="item"></slot>
      </div>
    `;
  }

  connectedCallback() {
    this.header = this.shadowRoot.querySelector('.header');
    this.content = this.shadowRoot.querySelector('.content');

    this.header.addEventListener('click', () => this.toggle());

    // 初期状態 open の場合は高さをセット
    if (this.hasAttribute('open')) {
      this.openContent();
    }
  }

  toggle() {
    if (this.hasAttribute('open')) {
      this.closeContent();
    } else {
      this.openContent();
    }
  }

  openContent() {
    this.setAttribute('open', '');
    const height = this.content.scrollHeight;
    this.content.style.maxHeight = height + 'px';
  }

  closeContent() {
    this.removeAttribute('open');
    this.content.style.maxHeight = '0px';
  }
}

customElements.define('com-accordion', accor);
