# ve-entities



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type     | Default |
| ---------- | ---------- | ----------- | -------- | ------- |
| `language` | `language` |             | `string` | `'en'`  |


## Events

| Event             | Description | Type               |
| ----------------- | ----------- | ------------------ |
| `entity-selected` |             | `CustomEvent<any>` |


## Dependencies

### Used by

 - [ve-add-media-resource-dialog](../ve-add-media-resource-dialog)
 - [ve-depicts-dialog](../ve-depicts-dialog)

### Graph
```mermaid
graph TD;
  ve-add-media-resource-dialog --> ve-wikidata-search
  ve-depicts-dialog --> ve-wikidata-search
  style ve-wikidata-search fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
