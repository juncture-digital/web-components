<template>

  <section ref="root" class="main">
    <a href="#" v-if="label" @click.prevent="show = !show" v-html="label"></a>
    <sl-dialog :label="props.title || 'Contact Us'" class="contact-dialog">
      <sl-input id="from" type="email" label="Email address"></sl-input>
      <sl-alert id="bad-email-alert" variant="danger">
        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
        <strong>Invalid email address</strong><br />Please fix and resubmit
      </sl-alert>
      <sl-textarea id="message" label="Message"></sl-textarea>
      <sl-alert id="no-message-alert" variant="danger">
        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
        <strong>No message entered</strong><br />
      </sl-alert>
      <sl-button id="cancel" slot="footer" @click="hideContactForm">Cancel</sl-button>
      <sl-button slot="footer" variant="primary" @click="sendmail">Submit</sl-button>
    </sl-dialog>
  </section>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  import '@shoelace-style/shoelace/dist/components/alert/alert.js'
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/input/input.js'
  import '@shoelace-style/shoelace/dist/components/textarea/textarea.js'

  const props = defineProps({
    contact: { type: String },
    title: { type: String },
    subject: { type: String },
    show: { type: Boolean }
  })
  
  const emailAddressRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  const emailEndpoint = 'https://api.juncture-digital.org/sendmail/'

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const label = computed(() => host.value?.innerHTML)

  const show = ref(false)
  defineExpose({ show })
  watch(show, () => contactDialog.open = show.value )

  let contactDialog: any
  let from: HTMLInputElement
  let emailAlert: any
  let message: HTMLTextAreaElement
  let noMessageAlert: any

  onMounted(() => {
    show.value = props.show
  })

  watch(props, () => { 
    show.value = props.show
  })

  watch(host, () => {
    contactDialog = shadowRoot.value?.querySelector('.contact-dialog')
    from = shadowRoot.value?.querySelector('#from') as HTMLInputElement
    message = shadowRoot.value?.querySelector('#message') as HTMLTextAreaElement
    emailAlert = shadowRoot.value?.querySelector('#bad-email-alert') as any
    noMessageAlert = shadowRoot.value?.querySelector('#no-message-alert') as any
    contactDialog.addEventListener('sl-hide', () => show.value = false)
  })

  function hideContactForm() {
    contactDialog.hide()
    from.value = ''
    message.value = ''
    emailAlert.hide()
    noMessageAlert.hide()
  }

  function showContactForm() {
    contactDialog.show()
  }

  async function sendmail() {
    let emailIsValid = emailAddressRegex.test(from.value)
    if (emailIsValid) emailAlert.hide()
    else emailAlert.show()
    
    let messageIsValid = message.value.trim().length > 0
    if (messageIsValid) noMessageAlert.hide()
    else noMessageAlert.show()

    if (emailIsValid && messageIsValid) { 
      let body = {
        to: props.contact,
        from: from.value,
        subject: props.subject || 'Contact Us',
        message: message.value
      }
      hideContactForm()
      let resp: any = await fetch(emailEndpoint, {
        method: 'POST', body: JSON.stringify(body)
      })
      // if (resp.ok) console.log(await resp.json())
    }
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display: inline-block;
  }

  sl-input,
  sl-textarea {
    padding: 12px 0;
  }

  sl-dialog::part(title),
  sl-input::part(form-control),
  sl-textarea::part(form-control) {
    text-align: left;
  }

</style>