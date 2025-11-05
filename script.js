/* script.js - handles form, validation, localStorage, rendering cards */
(() => {
  const LS_KEY = 'weatherCards_v1';

  // Elements
  const form = document.getElementById('weather-form');
  const cardsEl = document.getElementById('cards');
  const emptyState = document.getElementById('empty-state');
  const clearAllBtn = document.getElementById('clear-all');

  const inputs = {
    city: document.getElementById('city'),
    country: document.getElementById('country'),
    unit: document.getElementById('unit'),
    temperature: document.getElementById('temperature'),
    feels: document.getElementById('feels'),
    condition: document.getElementById('condition'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind')
  };

  function qsErr(name){
    return document.querySelector(`.error[data-for="${name}"]`);
  }

  // state
  let cards = loadCards();

  function saveCards(){
    localStorage.setItem(LS_KEY, JSON.stringify(cards));
  }

  function loadCards(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
      return [];
    }catch(e){
      console.error('Failed to load cards', e);
      return [];
    }
  }

  function clearErrors(){
    Object.keys(inputs).forEach(k => qsErr(k) && (qsErr(k).textContent = ''));
  }

  function validate(){
    let ok = true;
    clearErrors();

    const city = inputs.city.value.trim();
    if(!city){
      qsErr('city').textContent = 'Please enter a city.';
      ok = false;
    }

    // numeric checks - only if not empty
    ['temperature','feels','humidity','wind'].forEach(name => {
      const val = inputs[name].value.trim();
      if(val !== ''){
        if(Number.isNaN(Number(val))){
          qsErr(name).textContent = 'Must be a number.';
          ok = false;
        }
      }
    });

    return ok;
  }

  function timeAgo(ts){
    if(!ts) return '';
    const now = Date.now();
    const diff = Math.floor((now - ts) / 1000);
    if(diff < 10) return 'just now';
    if(diff < 60) return `${diff} sec ago`;
    const m = Math.floor(diff/60);
    if(m < 60) return `${m} min ago`;
    const h = Math.floor(m/60);
    if(h < 24) return `${h} hr${h>1?'s':''} ago`;
    const d = Math.floor(h/24);
    return `${d} day${d>1?'s':''} ago`;
  }

  function pickIcon(condition){
    if(!condition) return icons.sun;
    const c = condition.toLowerCase();
    if(/sun|clear|hot|bright/.test(c)) return icons.sun;
    if(/rain|shower|drizzle/.test(c)) return icons.rain;
    if(/cloud|overcast|cloudy/.test(c)) return icons.cloud;
    if(/fog|haze|mist|smog/.test(c)) return icons.fog;
    if(/snow|sleet|flurr/.test(c)) return icons.snow;
    if(/storm|thunder|tstorm/.test(c)) return icons.storm;
    return icons.cloud;
  }

  const icons = {
    sun: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="#FFB020"/><g stroke="#F97316" stroke-width="1.2" stroke-linecap="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></g></svg>`,
    rain: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 13a4 4 0 10-7.874-1.094A5 5 0 108 18h9" stroke="#0ea5e9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="#bae6fd"/><g stroke="#0284c7" stroke-linecap="round"><path d="M9 19v2" stroke-width="1.6"/><path d="M13 19v2" stroke-width="1.6"/><path d="M15 21v2" stroke-width="1.6"/></g></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16a4 4 0 010-8 5 5 0 0110 0 4 4 0 010 8H5z" fill="#e6eefb" stroke="#64748b" stroke-width="1.2"/></svg>`,
    fog: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/><path d="M3 16h14" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round"/><path d="M3 8h10" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    snow: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round"/><path d="M4 8l16 8" stroke="#93c5fd" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    storm: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13a4 4 0 014-4h1" stroke="#f43f5e" stroke-width="1.4" stroke-linecap="round"/><path d="M7 9l3 6-4 2 2-6-3-2z" fill="#fecaca" stroke="#ef4444" stroke-width="1"/></svg>`
  };

  function formatWind(unit, val){
    if(val === '' || val === undefined || val === null) return '';
    const n = Number(val);
    if(Number.isNaN(n)) return '';
    return unit === 'C' ? `${n} km/h` : `${n} mph`;
  }

  function render(){
    cardsEl.innerHTML = '';
    if(!cards.length){
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    cards.forEach(card => {
      const el = document.createElement('article');
      el.className = 'card';
      const icon = pickIcon(card.condition || '');
      const unit = card.unit || 'C';
      const windStr = formatWind(unit, card.wind);

      el.innerHTML = `
        <div class="card-left">
          <div class="icon-wrap">${icon}</div>
          <div class="card-main">
            <div class="city">${escapeHtml(card.city)}</div>
            <div class="country">${escapeHtml(card.country || '')}</div>
          </div>
        </div>

        <div class="card-right">
          <div class="temp">${card.temperature !== '' && card.temperature !== undefined && card.temperature !== null ? Number(card.temperature) : '-'}<span class="temp-unit">°${unit}</span></div>
          <div class="metrics" style="justify-content:flex-end;margin-top:8px">
            <div class="metric">Feels: ${card.feels !== '' && card.feels !== undefined && card.feels !== null ? Number(card.feels) + '°' + unit : '-'}</div>
            <div class="metric">${escapeHtml(card.condition || '')}</div>
            <div class="metric">Humidity: ${card.humidity !== '' && card.humidity !== undefined && card.humidity !== null ? card.humidity + '%' : '-'}</div>
            <div class="metric">Wind: ${windStr || '-'}</div>
          </div>
          <div class="card-controls">
            <div class="last-updated">Last updated: ${timeAgo(card.updatedAt)}</div>
            <button class="delete-btn" data-id="${card.id}">Delete</button>
          </div>
        </div>
      `;

      // attach delete handler
      el.querySelector('.delete-btn').addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteCard(id);
      });

      cardsEl.appendChild(el);
    });
  }

  function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  }

  function deleteCard(id){
    cards = cards.filter(c => String(c.id) !== String(id));
    saveCards();
    render();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if(!validate()) return;

    const newCard = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      city: inputs.city.value.trim(),
      country: inputs.country.value.trim(),
      unit: inputs.unit.value,
      temperature: inputs.temperature.value.trim(),
      feels: inputs.feels.value.trim(),
      condition: inputs.condition.value.trim(),
      humidity: inputs.humidity.value.trim(),
      wind: inputs.wind.value.trim(),
      updatedAt: Date.now()
    };

    cards.unshift(newCard);
    saveCards();
    render();

    form.reset();
    // focus city
    inputs.city.focus();
  });

  clearAllBtn.addEventListener('click', () => {
    if(!cards.length) return;
    const ok = confirm('Clear all weather cards? This action cannot be undone.');
    if(!ok) return;
    cards = [];
    saveCards();
    render();
  });

  // small utility: refresh "last updated" text periodically
  setInterval(()=>{
    const lastEls = document.querySelectorAll('.last-updated');
    if(!cards.length) return;
    // re-render to update times (keeps it simple)
    render();
  }, 30 * 1000);

  // initial render
  render();

})();
