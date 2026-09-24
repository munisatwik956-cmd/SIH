export default function Template({ children }: { children: React.ReactNode }) {
  const bridge = `(() => {
    const city = { DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bengaluru', MAA: 'Chennai', HYD: 'Hyderabad', CCU: 'Kolkata', GOI: 'Goa', AMD: 'Ahmedabad', COK: 'Kochi' };
    const style = document.createElement('style');
    style.textContent = '#workbench label{position:relative;border:1px solid transparent!important;border-radius:15px;background:linear-gradient(145deg,#fffefb,#f3eee6);box-shadow:inset 0 1px #fff,0 5px 13px rgba(23,35,52,.045);transition:transform 180ms cubic-bezier(.22,1,.36,1),box-shadow 180ms cubic-bezier(.22,1,.36,1),border-color 180ms cubic-bezier(.22,1,.36,1)}#workbench label:focus-within{z-index:1;border-color:rgba(209,90,53,.55)!important;transform:translateY(-2px);box-shadow:inset 0 1px #fff,0 10px 22px rgba(209,90,53,.13)}#workbench label small{color:#8b786c!important;letter-spacing:.14em!important}#workbench select,#workbench input[data-aero-control]{width:100%;min-height:42px;padding:9px 37px 9px 12px;border:1px solid rgba(23,35,52,.1);border-radius:11px;background:#fffaf4 url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2218%22 height=%2218%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23d15a35%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E") no-repeat right 12px center;color:#172334;font:700 14px Manrope,sans-serif;outline:none;appearance:none;box-shadow:inset 0 1px rgba(255,255,255,.9)}#workbench select:hover,#workbench input[data-aero-control]:hover{border-color:rgba(209,90,53,.36)}#workbench select:focus,#workbench input[data-aero-control]:focus{border-color:#d15a35;box-shadow:0 0 0 3px rgba(209,90,53,.12),inset 0 1px rgba(255,255,255,.9)}#workbench select option{background:#fffaf4;color:#172334;font-weight:600}#workbench input[type=date]{background-image:none;padding-right:10px;color-scheme:light}#workbench input[type=date]::-webkit-calendar-picker-indicator{opacity:1;cursor:pointer;filter:sepia(1) saturate(2) hue-rotate(325deg)}#workbench input[type=number]{background-image:none;padding-right:11px}';
    document.head.appendChild(style);
    const apply = () => {
      const form = document.querySelector('#workbench'); if (!form) return;
      const selects = form.querySelectorAll('select');
      selects.forEach((select, index) => {
        if (index < 2) Array.from(select.options).forEach(option => { const code = option.value; const label = city[code] ? code + ' (' + city[code] + ')' : code; if (option.textContent !== label) option.textContent = label; });
      });
      const labels = form.querySelectorAll('label');
      const travel = labels[2]; const advance = labels[3];
      if (travel && !travel.querySelector('[data-aero-date]')) { const old = travel.querySelector('select'); if (old) { const input = document.createElement('input'); input.type = 'date'; input.value = '2026-09-27'; input.min = '2026-09-22'; input.dataset.aeroControl = 'true'; input.dataset.aeroDate = 'true'; window.__aeroDate = input.value; input.addEventListener('change', () => window.__aeroDate = input.value); old.replaceWith(input); } }
      if (advance && !advance.querySelector('[data-aero-advance]')) { const old = advance.querySelector('select'); if (old) { const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = '90'; input.step = '1'; input.value = old.value || '7'; input.placeholder = 'Days'; input.dataset.aeroControl = 'true'; input.dataset.aeroAdvance = 'true'; window.__aeroAdvance = input.value; input.addEventListener('input', () => { const value = Math.max(1, Math.min(90, Number(input.value) || 1)); window.__aeroAdvance = String(value); }); old.replaceWith(input); } }
    };
    const run = () => {
      /* Delay DOM mutations until well after React hydration completes. */
      setTimeout(() => {
        apply();
        new MutationObserver(() => apply()).observe(document.body, { childList: true, subtree: true });
      }, 800);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else setTimeout(run, 0);
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      let nextInit = init;
      if (url.includes('/v1/quotes') && init && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          body.departure_date = window.__aeroDate || body.departure_date;
          body.advance_days = Number(window.__aeroAdvance || body.advance_days);
          nextInit = { ...init, body: JSON.stringify(body) };
        } catch {}
      }
      return originalFetch(url, nextInit);
    };
  })();`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bridge }} />
      {children}
    </>
  );
}
