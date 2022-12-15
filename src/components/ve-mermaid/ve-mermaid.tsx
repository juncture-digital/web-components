import { Component, Element, Prop, State, h } from '@stencil/core';
import './mermaid.min.js'

const mermaid = (window as any).mermaid

@Component({
  tag: 've-mermaid',
  styleUrl: 've-mermaid.css',
  shadow: false,
})
export class VeMermaid {
  @Prop() type: string
  @Prop() caption: string
  @Prop() width: string
  @Prop() height: string
  @Prop() sticky: boolean
  @Prop() full: boolean
  @Prop() left: boolean
  @Prop() right: boolean

  @State() diagramText: string

  @Element() el: HTMLElement;

  // connectedCallback() {}
  componentWillLoad() {
    this.diagramText = this.el.textContent
    this.el.textContent = ''
  }
  // componentWillRender() {}
  // componentDidRender() {}
  componentDidLoad() {
    let diagramId = 'mermaid'
    let el = this.el.querySelector(`#${diagramId}`) || document.querySelector(`#${diagramId}`)
    this.el.style.float = 'right'
    this.el.style.width = '50%'
    mermaid.init(undefined, el)
  }
  // componentWillUpdate() {}
  // componentDidUpdate() {}

  render() {
    return <div>
      <pre id="mermaid" innerHTML={this.diagramText}></pre>
    </div>
  }

}