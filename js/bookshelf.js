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
    this._spineW = 52;
    this._coverW = 320;
    this._viewportW = 580;
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
        <h2>${heading}</h2>
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
          <div class="hint" id="hint">Click a spine to know more</div>
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
    const hint = root.getElementById('hint');
    const desc = root.getElementById('desc');

    root.querySelectorAll('.book-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const wasActive = slot.classList.contains('active');

        // Close all
        root.querySelectorAll('.book-slot.active').forEach(s => s.classList.remove('active'));

        if (!wasActive) {
          slot.classList.add('active');
          const idx = parseInt(slot.dataset.index);
          const book = this._books[idx];

          // Show description
          hint.classList.add('hidden');
          desc.textContent = book.description || book.blurb || '';
          requestAnimationFrame(() => desc.classList.add('visible'));

          // Auto-scroll to fit cover
          const slots = Array.from(root.querySelectorAll('.book-slot'));
          let slotLeft = 0;
          for (const s of slots) {
            if (s === slot) break;
            slotLeft += this._spineW;
          }
          const slotRight = slotLeft + this._coverW;
          if (slotRight > this._offset + this._viewportW) {
            this._offset = slotRight - this._viewportW;
          }
          if (slotLeft < this._offset) {
            this._offset = slotLeft;
          }
        } else {
          desc.classList.remove('visible');
          hint.classList.remove('hidden');
        }
        shelf.style.transform = `translateX(-${this._offset}px)`;
      });
    });

    root.getElementById('arrowLeft').addEventListener('click', () => this._scroll(-1));
    root.getElementById('arrowRight').addEventListener('click', () => this._scroll(1));
  }

  _scroll(dir) {
    const root = this.shadowRoot;
    const shelf = root.getElementById('shelf');
    const slots = root.querySelectorAll('.book-slot');
    let totalW = 0;
    slots.forEach(s => {
      totalW += s.classList.contains('active') ? this._coverW : this._spineW;
    });
    const maxOffset = Math.max(0, totalW - this._viewportW);
    this._offset = Math.min(maxOffset, Math.max(0, this._offset + dir * this._spineW * 3));
    shelf.style.transform = `translateX(-${this._offset}px)`;
  }

  /* ── All CSS (encapsulated in Shadow DOM) ── */

  _css() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@400;500;600&display=swap');

      :host {
        display: block;
        --shelf-bg: #1b1b2f;
        font-family: 'DM Sans', sans-serif;
        color: #fff;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: var(--shelf-bg);
        background-image:
          radial-gradient(ellipse at 30% 40%, rgba(80,50,120,0.18) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 60%, rgba(25,55,85,0.22) 0%, transparent 55%);
        border-radius: 12px;
      }

      h2 {
        font-family: 'Playfair Display', serif;
        font-weight: 700;
        font-size: 28px;
        margin-bottom: 40px;
        letter-spacing: 1px;
        color: rgba(255,255,255,0.85);
      }

      /* ─── Shelf ─── */
      .shelf-wrapper { display: flex; align-items: center; gap: 24px; }

      .arrow {
        width: 44px; height: 44px; border-radius: 50%;
        border: 1.5px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.04);
        color: rgba(255,255,255,0.5);
        font-size: 20px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease; flex-shrink: 0; user-select: none;
      }
      .arrow:hover {
        border-color: rgba(255,255,255,0.35);
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.85);
      }

      .shelf-viewport { width: 580px; overflow: hidden; position: relative; }

      .shelf {
        display: flex; align-items: flex-end; gap: 0;
        transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        padding-bottom: 4px;
      }

      .shelf-viewport::after {
        content: ''; position: absolute; bottom: 0; left: -20px; right: -20px;
        height: 6px;
        background: linear-gradient(180deg, #5a3e28, #3d2915);
        border-radius: 2px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.4);
      }

      /* ─── Book slot ─── */
      .book-slot {
        flex-shrink: 0; width: 52px; height: 480px;
        perspective: 1400px; cursor: pointer;
        transition: width 0.7s cubic-bezier(0.25,0.46,0.45,0.94);
      }
      .book-slot.active { width: 320px; }

      .book {
        width: 52px; height: 100%; position: relative;
        transform-style: preserve-3d;
      }

      /* ─── Spine ─── */
      .spine {
        position: absolute; width: 52px; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border-radius: 3px 0 0 3px; z-index: 2;
        background: linear-gradient(180deg, var(--spine-grad));
        transition: opacity 0.35s ease;
      }
      .book-slot.active .spine { opacity: 0; pointer-events: none; }

      .spine::before, .spine::after {
        content: ''; position: absolute; left: 9px; right: 9px;
        height: 1.5px; background: var(--accent-dim);
      }
      .spine::before { top: 22px; }
      .spine::after  { bottom: 22px; }

      .spine-title {
        writing-mode: vertical-rl; text-orientation: mixed;
        font-family: 'Playfair Display', serif; font-weight: 700;
        font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;
        color: var(--accent); max-height: 380px; overflow: hidden;
      }
      .spine-author {
        writing-mode: vertical-rl; text-orientation: mixed;
        font-size: 8.5px; color: rgba(255,255,255,0.35);
        margin-top: 12px; letter-spacing: 1px;
      }

      /* ─── Cover ─── */
      .cover {
        position: absolute; width: 320px; height: 100%; left: 0;
        transform-origin: left center;
        opacity: 0; transform: rotateY(90deg);
        backface-visibility: hidden; border-radius: 5px; overflow: hidden;
        transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease;
      }
      .book-slot.active .cover { transform: rotateY(0deg); opacity: 1; }

      .cover-art {
        width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: flex-end;
        padding: 36px 28px; position: relative; overflow: hidden;
        background: linear-gradient(145deg, var(--cover-grad));
      }

      .cover-orb {
        position: absolute; top: -70px; right: -70px; width: 300px; height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%);
      }

      .cover-title {
        font-family: 'Playfair Display', serif; font-weight: 900;
        font-size: 32px; line-height: 1.15; color: var(--accent);
        position: relative; z-index: 1;
      }
      .cover-subtitle {
        font-size: 11px; color: rgba(255,255,255,0.4);
        margin-top: 8px; letter-spacing: 3px; text-transform: uppercase;
        position: relative; z-index: 1;
      }
      .cover-author {
        font-family: 'Playfair Display', serif; font-size: 14px;
        color: rgba(255,255,255,0.6); margin-top: 20px; padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.15);
        position: relative; z-index: 1;
      }
      .cover-blurb {
        font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.4);
        margin-top: 14px; position: relative; z-index: 1;
      }

      /* ─── Info area ─── */
      .book-info {
        margin-top: 44px; text-align: center;
        max-width: 520px; min-height: 80px; position: relative;
      }

      .hint {
        color: rgba(255,255,255,0.25); font-size: 12px;
        letter-spacing: 3.5px; text-transform: uppercase;
        animation: pulse 2.5s ease-in-out infinite;
        transition: opacity 0.4s ease;
      }
      .hint.hidden { opacity: 0; pointer-events: none; position: absolute; }

      .book-description {
        color: rgba(255,255,255,0.55); font-size: 14px;
        line-height: 1.7; letter-spacing: 0.2px;
        opacity: 0; transform: translateY(8px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .book-description.visible { opacity: 1; transform: translateY(0); }

      @keyframes pulse {
        0%, 100% { opacity: 0.25; }
        50%      { opacity: 0.45; }
      }
    `;
  }
}

customElements.define('book-shelf', BookShelf);
