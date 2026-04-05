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

          /* ★ aside と統一したガラス背景 */
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(16px);

          /* ★ 境界線を強めて視認性UP */
          border: 1px solid rgba(255, 255, 255, 0.35);
        }

        /* -----------------------------------
           ヘッダー
        ----------------------------------- */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 10px 12px;
          font-weight: 700;
          font-size: 14px;
          user-select: none;

          /* ★ 背景を少し濃くして見やすく */
          background: rgba(255, 255, 255, 0.18);
          color: var(--text-primary);
        }

        .header:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        /* -----------------------------------
           アイコン
        ----------------------------------- */
        .icon {
          transition: transform var(--duration) ease;
          opacity: 0.7;
        }

        :host([open]) .icon {
          transform: rotate(90deg);
          opacity: 1;
        }

        /* -----------------------------------
           コンテンツ
        ----------------------------------- */
        .content {
          overflow: hidden;
          max-height: 0;
          transition: max-height var(--duration) ease;
        }

        :host([open]) .content {
          max-height: 500px;
        }

        /* -----------------------------------
           スロット内の item
        ----------------------------------- */
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

        /* ★ hover を aside と統一 */
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

customElements.define('com-accordion', accor);
