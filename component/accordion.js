class ComAccordion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 8px;
          border-radius: 8px;
          overflow: hidden;
          --duration: 0.25s;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 10px 12px;
          font-weight: 600;
          user-select: none;
          backdrop-filter: blur(12px);
        }

        .icon {
          transition: transform var(--duration) ease;
        }

        :host([open]) .icon {
          transform: rotate(90deg);
        }

        .content {
          overflow: hidden;
          max-height: 0;
          transition: max-height var(--duration) ease;
        }

        :host([open]) .content {
          max-height: 500px; /* 十分大きければOK */
        }

        ::slotted([slot="item"]) {
          display: block;
          padding: 10px 12px;
        }

        ::slotted([slot="item"]) a {
          display: block;
          padding: 6px 0;
          text-decoration: none;
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
    const header = this.shadowRoot.querySelector('.header');
    header.addEventListener('click', () => this.toggle());
  }

  toggle() {
    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
    } else {
      this.setAttribute('open', '');
    }
  }
}

customElements.define('com-accordion', ComAccordion);
