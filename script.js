(() => {
  const STORAGE_KEY = 'mysocial_links_v1'

  function qs(selector, root = document) { return root.querySelector(selector) }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)) }

  // Gather inputs
  const inputs = qsa('input[data-input]')
  const previews = qsa('a[data-preview]')
  const tgInput = qs('#telegram-input')
  const tgPreview = qs('#tg-preview')
  const thumbInput = qs('#thumb-input')
  const thumbLink = qs('#thumb-link')
  const tgOverlayBtn = qs('#tg-overlay-btn')
  const saveBtn = qs('#save-btn')
  const clearBtn = qs('#clear-btn')

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if(!raw) return
      const data = JSON.parse(raw)
      inputs.forEach(i => {
        const key = i.getAttribute('data-input')
        if(data[key]) i.value = data[key]
      })
    if(data.tg) tgInput.value = data.tg
    if(data.thumb) thumbInput.value = data.thumb
      updatePreviews()
    } catch (e) {
      console.error('Load error', e)
    }
  }

  function save() {
    const obj = {}
    inputs.forEach(i => {
      const key = i.getAttribute('data-input')
      if(i.value && i.value.trim()) obj[key] = i.value.trim()
    })
    if(tgInput.value && tgInput.value.trim()) obj.tg = tgInput.value.trim()
  if(thumbInput && thumbInput.value && thumbInput.value.trim()) obj.thumb = thumbInput.value.trim()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    updatePreviews()
    showNotice('Сохранено')
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY)
    inputs.forEach(i => i.value = '')
    tgInput.value = ''
    if(thumbInput) thumbInput.value = ''
    updatePreviews()
    showNotice('Очистлено')
  }

  function updateOverlayButtonLink(linkValue = '') {
    if(!tgOverlayBtn) return
    const value = (linkValue || '').trim()
    if(value) {
      tgOverlayBtn.href = value
      tgOverlayBtn.classList.remove('disabled')
      tgOverlayBtn.setAttribute('aria-disabled','false')
    } else {
      tgOverlayBtn.href = '#'
      tgOverlayBtn.classList.add('disabled')
      tgOverlayBtn.setAttribute('aria-disabled','true')
    }
  }

  function updatePreviews() {
    previews.forEach(a => {
      const key = a.getAttribute('data-preview')
      const input = qs(`input[data-input='${key}']`)
      if(input && input.value.trim()) {
        a.href = input.value.trim()
        a.classList.remove('disabled')
        a.setAttribute('aria-disabled','false')
      } else {
        a.href = '#'
        a.classList.add('disabled')
        a.setAttribute('aria-disabled','true')
      }
    })

    if(tgInput && tgInput.value.trim()) {
      const val = tgInput.value.trim()
      tgPreview.href = val
      tgPreview.classList.remove('disabled')
      tgPreview.setAttribute('aria-disabled','false')
    } else {
      tgPreview.href = '#'
      tgPreview.classList.add('disabled')
      tgPreview.setAttribute('aria-disabled','true')
    }

    const buttonLink = tgOverlayBtn ? tgOverlayBtn.getAttribute('data-link') : ''
    updateOverlayButtonLink(buttonLink || (tgInput && tgInput.value.trim() ? tgInput.value.trim() : ''))

    // thumbnail link handling
    if(thumbInput && thumbInput.value && thumbInput.value.trim()){
      const v = thumbInput.value.trim()
      if(thumbLink){ thumbLink.href = v; thumbLink.classList.remove('disabled'); thumbLink.setAttribute('aria-disabled','false') }
    } else {
      if(thumbLink){ thumbLink.href = '#'; thumbLink.classList.add('disabled'); thumbLink.setAttribute('aria-disabled','true') }
    }
  }

  function showNotice(text) {
    const el = document.createElement('div')
    el.className = 'notice glass'
    el.textContent = text
    document.body.appendChild(el)
    setTimeout(()=> el.remove(),1200)
  }

  // wire events
  inputs.forEach(i => i.addEventListener('input', updatePreviews))
  if(tgInput) tgInput.addEventListener('input', updatePreviews)
  if(thumbInput) thumbInput.addEventListener('input', updatePreviews)
  if(tgOverlayBtn) {
    tgOverlayBtn.addEventListener('click', (ev) => {
      const isDisabled = tgOverlayBtn.getAttribute('aria-disabled') === 'true'
      if(!isDisabled) return
      ev.preventDefault()
      const entered = window.prompt('Введите ссылку для кнопки Telegram', 'https://t.me/+ugd8-uBYBZE5ODhi')
      if(entered && entered.trim()) {
        tgOverlayBtn.setAttribute('data-link', entered.trim())
        updateOverlayButtonLink(entered.trim())
        showNotice('Ссылка сохранена')
      }
    })
  }
  if(saveBtn) saveBtn.addEventListener('click', save)
  if(clearBtn) clearBtn.addEventListener('click', () => {
    if(confirm('Очистить все сохранённые ссылки?')) clearAll()
  })

  // prevent opening when empty
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a.preview')
    if(!a) return
    if(a.getAttribute('aria-disabled') === 'true') {
      ev.preventDefault()
      showNotice('Ссылка не задана')
    }
  })

  // init
  load()
  // Splash / Start button behavior
  const splash = document.getElementById('splash')
  const startBtn = document.getElementById('start-btn')
  const mainContent = document.getElementById('main-content')
  const bgVideo = document.querySelector('.bg-video')
  const innerVideo = document.querySelector('.inner-video')
  const centerWindow = document.querySelector('.center-window')
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let rafId = null
  let pointerState = {x:0,y:0,active:false}

  function updatePointerStyles(){
    if(!centerWindow) return
    // centerWindow CSS vars: --tilt-x, --tilt-y, --glass-blur, --glass-saturate
    const rect = centerWindow.getBoundingClientRect()
    const cx = rect.left + rect.width/2
    const cy = rect.top + rect.height/2
    const dx = pointerState.x - cx
    const dy = pointerState.y - cy
    const nx = dx / (rect.width/2) // normalized -1..1
    const ny = dy / (rect.height/2)
    // clamp
    const clamp = (v,min,max) => Math.max(min, Math.min(max, v))
    const tiltY = clamp(nx * 8, -12, 12) // rotateY degrees
    const tiltX = clamp(-ny * 6, -10, 10) // rotateX degrees (inverse)
    const absDist = Math.min(1, Math.sqrt(nx*nx + ny*ny))
    const blur = 8 + absDist * 8 // 8..16px
    const sat = 120 + absDist * 40 // 120%..160%
    centerWindow.style.setProperty('--tilt-x', tiltX + 'deg')
    centerWindow.style.setProperty('--tilt-y', tiltY + 'deg')
    centerWindow.style.setProperty('--glass-blur', blur + 'px')
    centerWindow.style.setProperty('--glass-saturate', sat + '%')
    rafId = null
  }

  if(centerWindow && !prefersReduced){
    centerWindow.addEventListener('pointermove', (e) => {
      pointerState.x = e.clientX
      pointerState.y = e.clientY
      pointerState.active = true
      if(!rafId) rafId = requestAnimationFrame(updatePointerStyles)
    })
    centerWindow.addEventListener('pointerleave', () => {
      // reset
      pointerState.active = false
      if(rafId) cancelAnimationFrame(rafId)
      centerWindow.style.setProperty('--tilt-x','0deg')
      centerWindow.style.setProperty('--tilt-y','0deg')
      centerWindow.style.setProperty('--glass-blur','8px')
      centerWindow.style.setProperty('--glass-saturate','120%')
    })
  }

  if(startBtn && splash && mainContent && bgVideo) {
    startBtn.addEventListener('click', async () => {
      // try to play with sound after user gesture — this should be allowed
      try {
        bgVideo.muted = false
        await bgVideo.play()
        // try play inner video too
        if(innerVideo){ try{ innerVideo.muted = false; await innerVideo.play() }catch(e){ try{ innerVideo.muted = true; await innerVideo.play() }catch(_){} }}
      } catch (e) {
        console.warn('Play with sound failed after start click', e)
        // as fallback, play muted so video is visible
        try { bgVideo.muted = true; await bgVideo.play() } catch(_){}
        if(innerVideo){ try{ innerVideo.muted = true; await innerVideo.play() }catch(_){} }
      }
      splash.classList.add('hidden')
      mainContent.classList.remove('hidden')
      if(tgOverlayBtn){
        tgOverlayBtn.classList.add('is-visible')
        tgOverlayBtn.style.opacity = '1'
      }
    })
  }
})();
