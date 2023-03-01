<template>

  <div ref="root" class="main">

    <sl-tooltip v-if="isLoggedIn" :content="`Logged in as ${username}`" placement="bottom">
      <sl-button variant="default" @click="logout">
        <sl-icon slot="prefix" name="github" style="font-size:20px;"></sl-icon>
        Logout
      </sl-button>
    </sl-tooltip>

    <sl-tooltip v-else content="Click to Login with Github" placement="top">
      <sl-button variant="default" @click="login">
        <sl-icon slot="prefix" name="github" style="font-size:20px;"></sl-icon>
        Login with Github
      </sl-button>
    </sl-tooltip>

  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { GithubClient } from '../gh-utils'

  import type SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'
  import type SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import type SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  const clientIds:any = {
    'www.juncture-digital.org': 'f7247e1e4769ba7c61e4',
    'beta.juncture-digital.org': 'f30ce4168a0bb95ecaa3',
    'dev.juncture-digital.org': 'bb290b5a738cb6fe31c7'
  }

  const authToken = ref<string | null>('')
  const githubClient = ref<any>()
  const isLoggedIn = computed(() => authToken.value !== null)
  const userInfo = ref<any>(null)
  const username = ref<String | null>(null)

  onMounted(() => {
    authToken.value = window.localStorage.getItem('gh-auth-token')
    username.value = window.localStorage.getItem('gh-username')
    window.addEventListener('storage', () => authToken.value = window.localStorage.getItem('gh-auth-token') )

    let code = (new URL(window.location.href)).searchParams.get('code')
    if (code) {
      let href = `${location.pathname}${location.hash}`
      window.history.replaceState({}, '', href)
      let isDev = window.location.hostname === 'localhost' || window.location.hostname.indexOf('192.168.') === 0
      let url = isDev
        ? `http://${window.location.hostname}:8000/gh-token?code=${code}&hostname=${window.location.hostname}`
        : `https://api.juncture-digital.org/gh-token?code=${code}&hostname=${window.location.hostname}`
      fetch(url)
        .then(resp => resp.text())
        .then(token => {
          if (token) {
            localStorage.setItem('gh-auth-token', token)
            window.dispatchEvent(new Event('storage'))
            authToken.value = window.localStorage.getItem('gh-auth-token')
            getUserInfo()
          }
        })
        .catch(err => console.log('err', err))
    }
  })

  function login() {
    let hostname = (new URL(window.location.href)).hostname
    let isDev = hostname === 'localhost' || hostname.indexOf('192.168.') === 0
    console.log(window.location)
    let redirectTo  = `${window.location.href}`
    console.log(`login: redirectTo=${redirectTo}`)
    let href = isDev
      ? `${window.location.origin}${window.location.pathname}?code=testing&redirect_uri=${location.pathname}${location.hash}`
      : clientIds[location.hostname] !== undefined
        ? `https://github.com/login/oauth/authorize?client_id=${clientIds[location.hostname]}&scope=repo&state=juncture&redirect_uri=${redirectTo}`
        : null
    console.log(`login: hostname=${hostname} isDev=${isDev} href=${href}`)
    if (href) window.location.href = href
  }

  function logout() {
    Object.keys(localStorage).forEach(key => localStorage.removeItem(key))
    window.dispatchEvent(new Event("storage"))
    authToken.value = window.localStorage.getItem('gh-auth-token')
    userInfo.value = null
    location.href = ''
  }

  function getUserInfo() {
    return fetch('https://api.github.com/user' ,{
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${authToken.value}`
      }
    }).then(resp => resp.json())
    .then(info => userInfo.value = info)
  }

  watch(userInfo, () => {
    if (userInfo.value) localStorage.setItem('gh-username', userInfo.value.login)
    username.value = window.localStorage.getItem('gh-username')
  })

  watch(githubClient, async () => {
    if (isLoggedIn.value) {
      let username = await githubClient.value.user().then((userData:any) => userData.login)
      await githubClient.value.repos(username).then((repos:any[]) => {
        if (!repos.find(repo => repo.name === 'essays')) githubClient.value.createRepository({name:'essays', description:'Juncture visual essays'})
        if (!repos.find(repo => repo.name === 'media')) githubClient.value.createRepository({name:'media', description:'Juncture media'})
      })
    }
  })

</script>

<style>
  
  :host {
    display: inline-block;
  }
  
  div {
    color: blue;
  }
  div:hover {
    text-decoration: underline;
    cursor: pointer;
  }

</style>