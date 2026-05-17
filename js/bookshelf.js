/**
 * <book-shelf> Web Component
 * 
 * A self-contained, embeddable 3D bookshelf.
 * Drop this script on any page and use <book-shelf> with a JSON config.
 *
 * ─── USAGE ───────────────────────────────────────────────
 *
 *   <script src="bookshelf.js"></script>
 *
 *   <book-shelf books='[
 *     {
 *       "spine":  "The Art of Stillness",
 *       "author": "E. Vance",
 *       "title":  "The Art of<br>Stillness",
 *       "subtitle": "A Novel",
 *       "fullAuthor": "Eleanor Vance",
 *       "blurb": "A meditation on silence and solitude.",
 *       "description": "A longer paragraph shown below the shelf when clicked.",
 *       "theme": { "spine": "#3a1f78, #1a1050", "cover": "#2c1654, #0f3460, #16213e", "accent": "#e4a850" }
 *     }
 *   ]'></book-shelf>
 *
 *   Or set via JS:
 *     document.querySelector('book-shelf').books = [ ... ];
 *
 * ─── ATTRIBUTES ──────────────────────────────────────────
 *
 *   books    — JSON array of book objects (see above)
 *   heading  — Optional shelf heading (default: "Books I Love")
 *
 * ─────────────────────────────────────────────────────────
 */

class BookShelf extends HTMLElement {
  static get observedAttributes() { return ['books', 'heading']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._books = null;
    this._offset = 0;
    this._spineW = 44;
    this._coverW = 200;
    this._viewportW = 360;
  }

  /* ── Attribute / property bridge ── */

  get books() { return this._books; }
  set books(val) {
    this._books = Array.isArray(val) ? val : JSON.parse(val);
    this.render();
  }

  get heading() { return this.getAttribute('heading') || 'Books I Love'; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'books' && newVal) {
      try { this._books = JSON.parse(newVal); } catch(e) { return; }
      this.render();
    }
    if (name === 'heading') this.render();
  }

  connectedCallback() {
    if (!this._books) {
      const raw = this.getAttribute('books');
      if (raw) {
        try { this._books = JSON.parse(raw); } catch(e) { this._books = []; }
      } else {
        this._books = this._defaultBooks();
      }
    }
    this.render();
  }

  /* ── Default demo books ── */

  _defaultBooks() {
    return [
      { spine:"The Art of Stillness", author:"E. Vance", title:"The Art of<br>Stillness", subtitle:"A Novel", fullAuthor:"Eleanor Vance", blurb:"A meditation on silence, solitude, and the spaces between words.", description:"A profound meditation on silence, solitude, and the spaces between words. Eleanor Vance's debut novel follows a musician who retreats to a remote cabin, only to discover that true stillness is the hardest note to hold. Beautifully written and deeply moving.", theme:{ spine:"#3a1f78, #1a1050", cover:"#2c1654, #0f3460, #16213e", accent:"#e4a850" }},
      { spine:"Mossy Ground", author:"R. Oakheart", title:"Mossy<br>Ground", subtitle:"Essays", fullAuthor:"Robin Oakheart", blurb:"Where the forest floor meets memory, and every root tells a story.", description:"Robin Oakheart's essays explore the intersections of nature, memory, and belonging. From forest floors to family histories, each piece is a quiet revelation — grounded, luminous, and impossible to forget.", theme:{ spine:"#1a3c2a, #0d2418", cover:"#1a3c2a, #2a5040, #0d2418", accent:"#c8dcb4" }},
      { spine:"Ember & Ash", author:"L. Soria", title:"Ember<br>& Ash", subtitle:"Poetry", fullAuthor:"Lucia Soria", blurb:"Poems forged in fire about love, loss, and what remains after both.", description:"Lucia Soria writes poems that burn. Ember & Ash is a collection about love, loss, and what remains after both — each piece forged in fire and tempered with an unflinching tenderness. Raw, urgent, and utterly alive.", theme:{ spine:"#7a3214, #3d1a08", cover:"#7a3214, #5a2410, #3d1a08", accent:"#ffc88c" }},
      { spine:"Deep Currents", author:"M. Thalberg", title:"Deep<br>Currents", subtitle:"A Novel", fullAuthor:"Magnus Thalberg", blurb:"Beneath the surface of a quiet coastal town, nothing is as it seems.", description:"Magnus Thalberg crafts a slow-burn thriller set in a quiet coastal town where nothing is as it seems. Deep Currents pulls you under with its layered characters and atmosphere so thick you can taste the salt air.", theme:{ spine:"#1a2a4a, #0a1428", cover:"#1a2a4a, #243a5a, #0a1428", accent:"#b4c8e6" }},
      { spine:"Red Dusk", author:"C. Moreau", title:"Red<br>Dusk", subtitle:"A Memoir", fullAuthor:"Camille Moreau", blurb:"One woman's journey through revolution, exile, and the long road home.", description:"Camille Moreau's memoir traces her journey through revolution, exile, and the long road home. Red Dusk is unflinching in its honesty — a story of survival told with grace, fury, and an unshakable belief in the possibility of return.", theme:{ spine:"#5a1a2a, #2d0d15", cover:"#5a1a2a, #7a2a3a, #2d0d15", accent:"#e6aab4" }},
      { spine:"Smoke Signals", author:"J. Wick", title:"Smoke<br>Signals", subtitle:"Short Stories", fullAuthor:"James Wick", blurb:"Twelve stories about the things we say without ever speaking a word.", description:"Twelve stories about the things we say without ever speaking a word. James Wick writes about ordinary people in extraordinary silences — each story a small, perfect signal fire. Spare, precise, and deeply human.", theme:{ spine:"#2a2a30, #14141a", cover:"#2a2a30, #3a3a42, #14141a", accent:"#dcb464" }},
      { spine:"Salt & Tide", author:"A. Neruda", title:"Salt<br>& Tide", subtitle:"A Novel", fullAuthor:"Ana Neruda", blurb:"A sweeping saga of fishing villages, family secrets, and the pull of the sea.", description:"Ana Neruda's sweeping saga of fishing villages, family secrets, and the pull of the sea. Salt & Tide spans three generations of women bound together by the Atlantic — epic in scope yet intimate in detail.", theme:{ spine:"#14404a, #0a2028", cover:"#14404a, #1a5a5a, #0a2028", accent:"#b4e6dc" }},
      { spine:"Violet Hours", author:"D. Clement", title:"Violet<br>Hours", subtitle:"Poetry", fullAuthor:"David Clement", blurb:"The fragile hours between dusk and dark, captured in verse.", description:"David Clement captures the fragile hours between dusk and dark in verse that glows. Violet Hours is quiet poetry at its finest — unhurried, luminous, and full of the kind of beauty you only notice when you slow down enough to look.", theme:{ spine:"#3a3550, #1a1828", cover:"#3a3550, #4a4560, #1a1828", accent:"#e4c88c" }},
    ];
  }

  /* ── Render ── */

  render() {
    if (!this._books) return;

    const books = this._books;
    const heading = this.heading;

    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <div class="container">
<div class="shelf-wrapper">
          <div class="arrow arrow-left" id="arrowLeft">&#8249;</div>
          <div class="shelf-viewport">
            <div class="shelf" id="shelf">
              ${books.map((b, i) => this._bookHTML(b, i)).join('')}
            </div>
          </div>
          <div class="arrow arrow-right" id="arrowRight">&#8250;</div>
        </div>
        <div class="book-info">
          <div class="book-description" id="desc"></div>
        </div>
      </div>
    `;

    this._bind();
  }

  /* ── Single book HTML ── */

  _bookHTML(b, i) {
    const t = b.theme || {};
    const spineGrad = t.spine || '#333, #111';
    const coverGrad = t.cover || '#222, #333, #111';
    const accent = t.accent || '#e4a850';
    const accentDim = accent + '59'; // ~35% opacity hex

    return `
      <div class="book-slot" data-index="${i}"
           style="--spine-grad:${spineGrad}; --cover-grad:${coverGrad}; --accent:${accent}; --accent-dim:${accentDim};">
        <div class="book">
          <div class="spine">
            <span class="spine-title">${b.spine || ''}</span>
            <span class="spine-author">${b.author || ''}</span>
          </div>
          <div class="cover">
            <div class="cover-art">
              <div class="cover-orb"></div>
              <div class="cover-title">${b.title || ''}</div>
              <div class="cover-subtitle">${b.subtitle || ''}</div>
              <div class="cover-author">${b.fullAuthor || b.author || ''}</div>
              <div class="cover-blurb">${b.blurb || ''}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── Bind events ── */

  _bind() {
    const root = this.shadowRoot;
    const shelf = root.getElementById('shelf');
    const desc = root.getElementById('desc');

    const openSlot = (slot) => {
      if (slot.classList.contains('active')) return;

      root.querySelectorAll('.book-slot.active').forEach(s => s.classList.remove('active'));
      slot.classList.add('active');

      const idx = parseInt(slot.dataset.index);
      const book = this._books[idx];

      desc.textContent = book.description || book.blurb || '';

      const slots = Array.from(root.querySelectorAll('.book-slot'));
      let slotLeft = 0;
      for (const s of slots) {
        if (s === slot) break;
        slotLeft += this._spineW;
      }
      const slotRight = slotLeft + this._coverW;
      const vpW = this._liveViewportW();
      if (slotRight > this._offset + vpW) {
        this._offset = slotRight - vpW;
      }
      if (slotLeft < this._offset) {
        this._offset = slotLeft;
      }
      shelf.style.transform = `translateX(-${this._offset}px)`;
      this._updateArrows();
    };

    root.querySelectorAll('.book-slot').forEach(slot => {
      slot.addEventListener('click', () => openSlot(slot));
    });

    root.getElementById('arrowLeft').addEventListener('click', () => this._scroll(-1));
    root.getElementById('arrowRight').addEventListener('click', () => this._scroll(1));

    // Open GEB by default
    const defaultSlot = root.querySelector('.book-slot[data-index="2"]');
    if (defaultSlot) openSlot(defaultSlot);

    this._updateArrows();

    // Re-evaluate arrows on resize (orientation change, window resize)
    new ResizeObserver(() => this._updateArrows()).observe(this);
  }

  _liveViewportW() {
    const vp = this.shadowRoot.querySelector('.shelf-viewport');
    return vp ? vp.offsetWidth : this._viewportW;
  }

  _updateArrows() {
    const root = this.shadowRoot;
    const slots = root.querySelectorAll('.book-slot');
    const vpW = this._liveViewportW();
    let totalW = 0;
    slots.forEach(s => {
      totalW += s.classList.contains('active') ? this._coverW : this._spineW;
    });
    const visible = totalW <= vpW;
    root.getElementById('arrowLeft').style.display  = visible ? 'none' : 'flex';
    root.getElementById('arrowRight').style.display = visible ? 'none' : 'flex';
  }

  _scroll(dir) {
    const root = this.shadowRoot;
    const shelf = root.getElementById('shelf');
    const slots = root.querySelectorAll('.book-slot');
    const vpW = this._liveViewportW();
    let totalW = 0;
    slots.forEach(s => {
      totalW += s.classList.contains('active') ? this._coverW : this._spineW;
    });
    const maxOffset = Math.max(0, totalW - vpW);
    this._offset = Math.min(maxOffset, Math.max(0, this._offset + dir * this._spineW * 3));
    shelf.style.transform = `translateX(-${this._offset}px)`;
    this._updateArrows();
  }

  /* ── All CSS (encapsulated in Shadow DOM) ── */

  _css() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&display=swap');

      :host {
        display: block;
        --shelf-bg: #ffffff;
        font-family: 'Inter', serif;
        color: #10183a;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      .container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 32px 20px;
        background: var(--shelf-bg);
      }

/* ─── Shelf ─── */
      .shelf-wrapper { display: flex; align-items: center; gap: 24px; }

      .arrow {
        width: 44px; height: 44px; border-radius: 50%;
        border: 1.5px solid rgba(16,24,58,0.2);
        background: rgba(16,24,58,0.04);
        color: rgba(16,24,58,0.45);
        font-size: 20px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease; flex-shrink: 0; user-select: none;
      }
      .arrow:hover {
        border-color: rgba(16,24,58,0.4);
        background: rgba(16,24,58,0.08);
        color: #10183a;
      }

      .shelf-viewport { width: 100%; overflow: hidden; position: relative; }

      .shelf {
        display: flex; align-items: flex-end; gap: 0;
        padding-bottom: 4px;
      }

      .shelf-viewport::after {
        content: ''; position: absolute; bottom: 0; left: 0; right: 0;
        height: 6px;
        background: linear-gradient(180deg, #1a1aff, #0000cc);
        border-radius: 2px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.4);
      }

      /* ─── Book slot ─── */
      .book-slot {
        flex-shrink: 0; width: 44px; height: 300px;
        cursor: pointer;
      }
      .book-slot.active { width: 200px; }

      .book {
        width: 100%; height: 100%; position: relative;
      }

      /* ─── Spine ─── */
      .spine {
        position: absolute; width: 44px; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 2; overflow: hidden;
        background: linear-gradient(180deg, var(--spine-grad));
      }
      .book-slot.active .spine { opacity: 0; pointer-events: none; }


      .spine-title {
        writing-mode: vertical-rl; text-orientation: mixed;
        font-family: 'Playfair Display', serif; font-weight: 700;
        font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;
        color: var(--accent); max-height: 200px; overflow: hidden;
      }
      .spine-author {
        writing-mode: vertical-rl; text-orientation: mixed;
        font-size: 8.5px; color: rgba(255,255,255,0.35);
        margin-top: 12px; letter-spacing: 1px;
      }

      /* ─── Cover ─── */
      .cover {
        position: absolute; width: 100%; height: 100%; left: 0;
        opacity: 0; overflow: hidden;
      }
      .book-slot.active .cover { opacity: 1; }

      .cover-art {
        width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: flex-end;
        padding: 22px 18px; position: relative; overflow: hidden;
        background: linear-gradient(145deg, var(--cover-grad));
      }

      .cover-orb {
        position: absolute; top: -50px; right: -50px; width: 200px; height: 200px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%);
      }

      .cover-title {
        font-family: 'Playfair Display', serif; font-weight: 900;
        font-size: 20px; line-height: 1.15; color: var(--accent);
        position: relative; z-index: 1;
      }
      .cover-subtitle {
        font-size: 9px; color: rgba(255,255,255,0.4);
        margin-top: 6px; letter-spacing: 2px; text-transform: uppercase;
        position: relative; z-index: 1;
      }
      .cover-author {
        font-family: 'Playfair Display', serif; font-size: 11px;
        color: rgba(255,255,255,0.6); margin-top: 12px; padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.15);
        position: relative; z-index: 1;
      }
      .cover-blurb {
        font-size: 10px; line-height: 1.5; color: rgba(255,255,255,0.4);
        margin-top: 10px; position: relative; z-index: 1;
      }

      /* ─── Info area ─── */
      .book-info {
        margin-top: 28px; text-align: left;
        max-width: 360px; min-height: 60px; position: relative;
      }

      .book-description {
        color: #10183a; font-size: 16px;
        line-height: 1.5; letter-spacing: 0;
      }

    `;
  }
}

customElements.define('book-shelf', BookShelf);
