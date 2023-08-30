<script setup lang="ts">

import { computed, ref, toRaw, watch, onMounted, nextTick } from 'vue'

// @ts-ignore
import { HSDropdown } from '../lib/preline/components/hs-dropdown'

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)
const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
watch(shadowRoot, () => { new HSDropdown(shadowRoot.value).init() })

const isLoggedIn = ref(false)
watch(host, () => { getMenuItems() })

const menuItems = ref<any[]>([])
const navItems = ref<any[]>()

const props = defineProps({
  logo: { type: String },
  title: { type: String },
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

onMounted(() => {
    init()
    nextTick(() => {
      let listItems = Array.from(host.value.children[0]?.children || [])
      if (listItems.length > 0)
      menuItems.value = listItems
        .map((navItem:any) => {
           let text = navItem.firstChild.textContent
            if (text.toLowerCase() === 'auth') {
              return {label:  isLoggedIn.value ? 'Logout' : 'Login', href:  isLoggedIn.value ? 'logout' : 'login'}
            } else {
              return {label: navItem.textContent}
            }
          
        })
        .filter(item => item.label.toLowerCase().indexOf('contact') !== 0 || props.contact)
    })
  })
  
function init() {    
    isLoggedIn.value = ghAuthToken() !== null
    let code = (new URL(window.location.href)).searchParams.get('code')
    if (code) {
      window.history.replaceState({}, '', window.location.pathname)
      fetch(`/gh-token?code=${code}&hostname=${window.location.hostname}`)
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

function getMenuItems() {
  
  let slot = host.value.parentElement.querySelector('ve-new-menu')

  function parseSlot() {
    menuItems.value = Array.from(slot.querySelectorAll('li'))
      .map((li: any) => {
        const a = li.querySelector('a')
        return { label: a.innerText, href: a.href }
      })
    }
    
    parseSlot()
    new MutationObserver(
      (mutationsList:any) => {
        for (let mutation of mutationsList) { if (mutation.type === 'childList') parseSlot() }      
      }
    ).observe(slot, { childList: true, subtree: true })
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
   
function  ghAuthToken() {
    return localStorage.getItem('gh-auth-token')
  }


  watch(menuItems, () => {
    navItems.value = menuItems.value
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
    navItems.value = menuItems.value
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

</script>

<template>

  <nav class="hs-dropdown relative inline-flex" ref="root" >
    
    <button 
      id="hs-dropdown-custom-icon-trigger" 
      type="button"
      aria-label="Site navigation menu"
      class="hs-dropdown-toggle p-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
      <svg class="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
      </svg>
    </button>

    <div
      class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" 
      aria-labelledby="hs-dropdown-custom-icon-trigger">
      <a v-for="item in menuItems" :key="item.href" 
        class="flex items-center gap-x-3.5 py-2 px-3 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300" 
        :href="item.href"
      >
        {{ item.label }}
      </a>
    </div>

  </nav>

</template>

<style>
  @import '../tailwind.css';
</style>
