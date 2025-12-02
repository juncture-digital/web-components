<template>
  <div ref="root" class="search">
    <input class="search-btn" type="checkbox" id="search-btn"/>
    <div class="wrapper">
      <div class="search-form">
        <div class="input-wrapper">
          <sl-icon-button class="cancel" @click="cancel" name="x-circle" label="Clear"></sl-icon-button>
          <input
            type="text"
            id="search-input"
            class="search-input"
            @keyup="inputHandler"
            autocomplete="off"
            role="textbox"
            placeholder="Search site"
          />
        </div>      
      </div>
      <ul v-if="searchResults.length > 0" class="search-results">
        <li v-for="item, idx in searchResults" :key="`sr=${idx}`">
          <a :href="item.link">
            <h3 v-html="item.htmlTitle"></h3>
            <p v-html="item.htmlSnippet"></p>
          </a>
        </li>
        <li v-if="totalResults > searchResults.length">
          <div class="more" @click="doSearch">More</div>
        </li>
      </ul>
    </div>
    <label class="search-icon" htmlFor="search-btn">
      <sl-icon-button @click="searchClicked" name="search" label="Search"></sl-icon-button>
    </label>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, onUpdated, ref, toRaw, watch } from 'vue'

  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  const props = defineProps({
    searchDomain: { type: String },
    searchKey: { type: String },
    searchCx: { type: String }
  })

  const key = ref(decrypt(props.searchDomain || '', props.searchKey || ''))

  const searchEndpoint = 'https://www.googleapis.com/customsearch/v1'

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const searchInput = ref<HTMLInputElement>()
  const checkbox = ref<HTMLInputElement>()
  const currentQuery = ref('')
  const searchResults = ref<any[]>([])
  const totalResults = ref(0)
  const isVisible = ref(false)


  onMounted(() => init())

  function init() {
    searchInput.value = shadowRoot.value?.querySelector('#search-input') as HTMLInputElement
    searchInput.value.value = ''
    checkbox.value = shadowRoot.value?.querySelector('#search-btn') as HTMLInputElement
    searchResults.value = []
  }

  watch(isVisible, () => {
    if (checkbox.value) checkbox.value.checked = isVisible.value
    if (isVisible) searchInput.value?.focus()
  })

  function doSearch() {
    let query = searchInput.value?.value.replace(/ /,'%20')
    let searchArgs: any = {
      q: query,
      start: query === currentQuery.value ? searchResults.value.length + 1 : 1,
      key: key.value,
      cx: props.searchCx
    }
    let qargs = Object.keys(searchArgs).map(k => `${k}=${searchArgs[k]}`).join('&')
    let url = `${searchEndpoint}?${qargs}`
    fetch(url)
      .then(res => res.json())
      .then(results => {
        totalResults.value = parseInt(results.searchInformation.totalResults)
        let items = results.items.map((item:any) => {
          let link = new URL(item.link)
          item.link = `${location.origin}${link.pathname}`
          return item
        })
        searchResults.value = query !== currentQuery.value ? items : [...searchResults.value, ...items]
        currentQuery.value = query || ''
      })
  }

  function inputHandler(evt:KeyboardEvent) {
    if (evt.key === 'Enter') doSearch()
  }
  
  function cancel() {
    isVisible.value = false
    if (searchInput.value) searchInput.value.value = ''
    currentQuery.value = ''
    totalResults.value = 0
    searchResults.value = []
  }

  function searchClicked() {
    isVisible.value = !isVisible.value
  }

    function crypt (salt:string, text:string) {
      const textToChars = (text:string) => text.split('').map((c) => c.charCodeAt(0));
      const byteHex = (n:number) => ('0' + Number(n).toString(16)).substr(-2);
      const applySaltToChar = (code:any) => textToChars(salt).reduce((a, b) => a ^ b, code);

      return text
        .split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
  };

  function decrypt(salt:string, encoded:string) {
    const textToChars = (text:string) => text.split('').map((c) => c.charCodeAt(0));
    const applySaltToChar = (code:any) => textToChars(salt).reduce((a, b) => a ^ b, code);
    let match = encoded.match(/.{1,2}/g);
    let decoded = match
      ? match .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join('')
      : ''
    // console.log('decrypt', encoded, decoded)
    return decoded
  };

</script>

<style>

  * { box-sizing: border-box; } 

  .search-icon {
    color: white;
    font-size: 28px;
  }

  .search-icon:hover {
    cursor: pointer;
  }

  .search {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-btn,
  .search-form,
  .wrapper {
    display: none;
  }

  .wrapper {
    flex-direction: column;
    position: absolute;
    right: -4px;
  }

  .search-form {
    display: flex;
    align-items: center;
  }
  .search-input {
    height: 42px;
    width: 250px;
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 1rem;
  }

  .search-submit {
    background-color: white;
    border-radius: 6px;
    padding: 8px 8px 4px 8px;
    height: 24px;
    z-index: 4;
  }
  .search-submit:hover {
    background-color: #ddd;
    cursor: pointer;
  }
  .search-submit sl-icon {
    color: blue;
    font-size: 20px;
  }

  .search-results {
    position: absolute;
    top: 42px;
    left: 0;
    width: 326px;
    max-height: 50vh;
    overflow-y: scroll;
    z-index: 2;
    background-color: white;
    margin: 0 0 0 2px;
    list-style: none;
    padding: 6px;
    border-radius: 6px;
    font-size: 0.9rem;
    box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  }

  .search-results li:nth-of-type(even) {
    background-color: #E6E6DF;
  }

  .search-results li {
    padding: 6px;
    margin: 3px;
    border: 1px solid #E6E6DF
  }

  .search-results li h3,
  .search-results li p {
    margin: 8px 0;
  }

  .search-results li a {
    text-decoration: none;
    color: #444;
  }

  .search-results li a h3 {
    font-weight: bold;
  }

  .search-results li a p {
    font-weight: 300;
  }

  .search-results li:hover {
    cursor: pointer;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  }

  .search-icon sl-icon-button::part(base) {
    color: white;
  }
  .search-btn:checked ~ .search-icon sl-icon-button::part(base) {
    visibility: hidden;
  }

  .search-btn:checked ~ .wrapper .search-form {
    display: flex;
    width: 100%;
  }
  .search-btn:checked ~ .wrapper {
    display: flex;
  }

  .input-wrapper {
    display: inline-block;
    position: relative
  }

  .cancel {
    position: absolute;
    right: 0;
    top: 4px;
    font-size: 16px;
    cursor: pointer;
  }

</style>