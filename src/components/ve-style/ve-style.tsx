import { Component, Prop } from '@stencil/core';

@Component({
  tag: 've-style'
})
export class Style {
  @Prop() href: string

  removeLinkTag(href: string) {
    let link: HTMLLinkElement = document.querySelector(`link[href$="${href}"]`)
    if (link) link.parentElement.removeChild(link)
  }

  connectedCallback() {
    // let server = location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://juncture-digital.org'
    let server = 'https://juncture-digital.org'
    // console.log(`layout=${this.layout} theme=${this.theme}`)
    if (this.href) {
      let link = document.createElement('link')
      link.href = this.href.indexOf('http') === 0 ? this.href : `${server}${this.href}`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }

  render() { return null }

}
