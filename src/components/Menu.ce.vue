<template>

  <div ref="root">

    <div class="nav" :style="{backgroundColor: props.background}">
      <div v-if="navItems" class="wrapper">
      <div class="dropdown-selection-alt">
        <sl-dropdown>
          <sl-icon-button name="list" slot="trigger" style="font-size: 2.5rem;"></sl-icon-button>
          <sl-menu>
            <div v-for="item, idx in navItems" :data-item="JSON.stringify(item)" :key="`nav-${idx}`">
              <sl-menu-item :name="navIcon(item)" :label="item.label"  @click="menuItemSelected(item)">{{item.label}}</sl-menu-item>
            </div>
          </sl-menu>
        </sl-dropdown>
      </div>
      </div>
      </div>

      <ve-contact :contact="props.contact" :title="props.contactFormTitle" :subject="props.contactSubject"></ve-contact>
      <!--
      <ve-content-viewer id="help" path="/juncture-digital/essays/help" format="html"></ve-content-viewer>
      <ve-content-viewer id="markdown" :path="props.contentPath" format="markdown"></ve-content-viewer>
      -->

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onUpdated, onMounted, ref, toRaw, watch, nextTick } from 'vue'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'

  const props = defineProps({
    background: { type: String },
    position: { type: String, default: 'left' },
    contact: { type: String },
    contactFormTitle: { type: String },
    contactSubject: { type: String }
  })

  const clientIds:any = {
    'www.juncture-digital.org': 'f7247e1e4769ba7c61e4',
    'beta.juncture-digital.org': 'f30ce4168a0bb95ecaa3',
    'dev.juncture-digital.org': 'bb290b5a738cb6fe31c7',
    'tools.juncture-digital.org': '0b40086fe912d97c03e6'
  }

  const nav:any = {
    about: {icon: 'info-circle-fill'},
    contact: {icon: 'envelope-fill'},
    documentation: {icon: 'book'},
    docs: {icon: 'book'},
    editor: {icon: 'pencil', loginRequired: true},
    essays: {icon: 'pencil'},
    help: {icon: 'question-circle'},
    home: {icon: 'house-fill'},
    'how to': {icon: 'book-fill'},
    link: {icon: 'link-45deg'},
    login: {icon: 'person-circle'},
    logout: {icon: 'person-circle'},
    markdown: {icon: 'markdown'},
    media: {icon: 'images', loginRequired: true},
    showcase: {icon: 'easel2'},
    tools: {icon: 'tools', loginRequired: true}
  }

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const isLoggedIn = ref(false)
  const originalNavItems = ref<any[]>([])

  const navItems = ref<any[]>()
  // watch(navItems, () => console.log('menu.navItems', toRaw(navItems.value)) )

  let helpWindow:any
  let externalWindow:any

  onMounted(() => {
    init()
    nextTick(() => {
      let listItems = Array.from(host.value.children[0]?.children || [])
      if (listItems.length > 0)
      originalNavItems.value = listItems
        .map((navItem:any) => {
          if (navItem.firstChild.nodeName === 'A') {
            let linkEl = navItem.firstChild as HTMLLinkElement
            return {label: linkEl.textContent, href:linkEl.href, newWindow: linkEl.getAttribute('target') === '_blank' }
          } else {
            let text = navItem.firstChild.textContent
            if (text.toLowerCase() === 'auth') {
              return {label:  isLoggedIn.value ? 'Logout' : 'Login', href:  isLoggedIn.value ? 'logout' : 'login'}
            } else {
              return {label: navItem.textContent}
            }
          }
        })
        .filter(item => item.label.toLowerCase().indexOf('contact') !== 0 || props.contact)
    })
  })

  function init() {    
    isLoggedIn.value = ghAuthToken() !== null
    let code = (new URL(window.location.href)).searchParams.get('code')
    console.log('code', code);
    if (code) {
      window.history.replaceState({}, '', window.location.pathname)
      let url = window.location.hostname === 'localhost'
        ? `https://dev.juncture-digital.org/gh-token?code=${code}&hostname=${window.location.hostname}`
        : `/gh-token?code=${code}&hostname=${window.location.hostname}`
      console.log(url)
      fetch(url)
        .then(resp => resp.text())
        .then(authToken => {
          if (authToken) {
            isLoggedIn.value = true
            localStorage.setItem('gh-auth-token', authToken)
            window.dispatchEvent(new Event('storage'))
          }
        })
        .catch(err => console.log('err', err))
    }
    host.value.classList.add(props.position)
  }

  watch(originalNavItems, () => {
    navItems.value = originalNavItems.value
      .filter(item => {
        let action = item.href ? item.href.split('/').filter((pe:string) => pe).pop().toLowerCase() : 'link'
        return !nav[action] || !nav[action]?.loginRequired || isLoggedIn.value
      })
      .map((item:any) => {
        return item.label === 'Login' || item.label === 'Logout'
          ? {label:  isLoggedIn.value ? 'Logout' : 'Login', href:  isLoggedIn.value ? 'logout' : 'login'}
          : item
        }
      )
  })

  watch(isLoggedIn, () => {
    navItems.value = originalNavItems.value
      .filter(item => {
        let action = item.href ? item.href.split('/').filter((pe:string) => pe).pop().toLowerCase() : 'link'
        return !nav[action] || !nav[action]?.loginRequired || isLoggedIn.value
      })
      .map(item =>
        item.label === 'Login' || item.label === 'Logout'
          ?{ label:  isLoggedIn.value ? 'Logout' : 'Login', href:  isLoggedIn.value ? 'logout' : 'login'}
          : item
      )
  })

  function  ghAuthToken() {
    return localStorage.getItem('gh-auth-token')
  }

  function showContactForm() {
    let contactDialog = shadowRoot.value?.querySelector('ve-contact') as any
    contactDialog._instance.exposed.show.value = true
  }

  function showHelpDialog() {
    let helpDialog = shadowRoot.value?.querySelector('#help') as any
    helpDialog.show = !helpDialog.show
  }

  function showHelpWindow() {
    if (helpWindow) { helpWindow.close() }
    let options = 'toolbar=yes,location=yes,left=0,top=0,width=1040,height=1200,scrollbars=yes,status=yes'
    helpWindow = window.open('/help', '_blank', options)
  }

  function showMarkdownDialog() {
    let markdownDialog = shadowRoot.value?.querySelector('#markdown') as any
    markdownDialog.show = !markdownDialog.show
  }

  function login() {
    let hostname = (new URL(window.location.href)).hostname
    let isDev = hostname === 'localhost' || hostname.indexOf('192.168.') === 0
    let href = isDev
      ? `${window.location.pathname}?code=testing`
      : clientIds[location.hostname] !== undefined
        ? `https://github.com/login/oauth/authorize?client_id=${clientIds[location.hostname]}&scope=repo&state=juncture&redirect_uri=${location.href}`
        : null
    console.log(`login: hostname=${hostname} isDev=${isDev} href=${href}`)
    if (href) window.location.href = href
  }

  function logout() {
    console.log('logout')
    Object.keys(localStorage).forEach(key => localStorage.removeItem(key))
    window.dispatchEvent(new Event("storage"))
    isLoggedIn.value = false
  }

  function navIcon(item: any) {
    let iconName = ''
    let menuLabel = item.label.toLowerCase()
    Object.keys(nav).forEach(key => {
      if (menuLabel.indexOf(key) >= 0) iconName = nav[key].icon
    })
    return iconName ? iconName : 'link'
  }

  function menuItemSelected(item: any) {
    console.log('menuItemSelected', item)
    let action = item.href ? item.href.split('/').pop().toLowerCase() : ''
    console.log(`action=${action}`)
    if ((action.indexOf('contact') > -1 || item.label.toLowerCase().indexOf('contact') === 0) && props.contact) {
      showContactForm()
    } else if (action === 'login') {
      login()
    } else if (action === 'logout') {
      logout()
    } else if (action === 'help') {
      // this.showHelpDialog()
      showHelpWindow()
    } else if (action === 'markdown') {
      showMarkdownDialog()
    } else if (item.href) {
      if (item.newWindow) {
        if (externalWindow) { externalWindow.close() }
        externalWindow = window.open(item.href, '_blank', 'toolbar=yes,location=yes,left=0,top=0,width=1024,height=1200,scrollbars=yes,status=yes')
      } else if (item.href.indexOf('/window.') > 0) {
        let funcName = item.href.split('/window.').pop();
        (window as any)[funcName]()
      } else {
        location.href = item.href
      }
    } else {
    }
  }
</script>

<style>
  :host, ve-menu {
    height: 100%;
  }
  :host(.right), ve-menu.right {
    /* margin-left: auto; */
  }
  :host(.right) .menu, ve-menu.right .menu {
    right: 0;
  }

  .hydrated ul {
    display: none;
  }

  .nav {
    display: inline-block;
    position: relative;
    z-index: 10;
    height: 100%;
    background-color: inherit;
  }

  .menu {
    display: none;
    clear: both;
    max-height: 0;
    transition: max-height .2s ease-out;
    position: absolute;
    top: 58px;
    width: 200px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
  }
  ul.menu {
    padding: 0;
    list-style: none;
  }
  .menu li {
    display: flex;
    padding: 10px 20px;
    text-decoration: none;
    cursor: pointer;
    font-size: 1rem;
  }
  .menu li:hover {
    text-decoration: underline;
    background-color: inherit;
    filter: brightness(150%);
  }

  /* menu icon */
  .menu-icon {
    cursor: pointer;
    display: inline-block;
    padding: 34px 20px;
    position: relative;
    user-select: none;
  }
  .menu-icon .navicon,
  .menu-icon .navicon:before,
  .menu-icon .navicon:after {
    background: #fff;
  }

  .menu-icon .navicon {
    /* background: #fff; */
    display: block;
    height: 4px;
    border-radius: 2px;
    position: relative;
    transition: background .2s ease-out;
    width: 32px;
  }
  .menu-icon .navicon:before,
  .menu-icon .navicon:after {
    /* background: #fff; */
    content: '';
    display: block;
    height: 100%;
    position: absolute;
    transition: all .2s ease-out;
    width: 100%;
    border-radius: 2px;
  }
  .menu-icon .navicon:before {
    top: 10px;
  }
  .menu-icon .navicon:after {
    top: -10px;
  }
  .menu sl-icon {
    padding-right: 12px;
  }

  /* menu btn */
  .menu-btn {
    display: none;
  }
  .menu-btn:checked ~ .wrapper {
    filter: brightness(150%);
    background-color: inherit;
  }
  .menu-btn:checked ~ .wrapper .menu {
    max-height: unset;
    display: block;
  }
  .menu-btn:checked ~ .wrapper .menu-icon .navicon {
    background: transparent;
  }
  .menu-btn:checked ~ .wrapper .menu-icon .navicon:before {
    transform: rotate(-45deg);
  }
  .menu-btn:checked ~ .wrapper .menu-icon .navicon:after {
    transform: rotate(45deg);
  }
  .menu-btn:checked ~ .wrapper .menu-icon:not(.steps) .navicon:before,
  .menu-btn:checked ~ .wrapper .menu-icon:not(.steps) .navicon:after {
    top: 0;
  }

</style>