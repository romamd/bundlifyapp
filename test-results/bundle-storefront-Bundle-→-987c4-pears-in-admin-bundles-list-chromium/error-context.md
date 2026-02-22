# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - link "Dashboard" [ref=e5] [cursor=pointer]:
      - /url: /
    - link "Products" [ref=e6] [cursor=pointer]:
      - /url: /products
    - link "Bundles" [ref=e7] [cursor=pointer]:
      - /url: /bundles
    - link "Analytics" [ref=e8] [cursor=pointer]:
      - /url: /analytics
    - link "A/B Tests" [ref=e9] [cursor=pointer]:
      - /url: /ab-tests
    - link "Integrations" [ref=e10] [cursor=pointer]:
      - /url: /integrations
    - link "Settings" [ref=e11] [cursor=pointer]:
      - /url: /settings
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Bundles" [level=1] [ref=e14]
      - generic [ref=e15]:
        - button "Generate Bundles" [ref=e16] [cursor=pointer]
        - button "Create Bundle" [ref=e17] [cursor=pointer]
    - generic [ref=e18]: "Error: Failed to execute 'json' on 'Response': Unexpected end of JSON input"
    - generic [ref=e20]: 0 bundles total
    - generic [ref=e21]: No bundles found. Create your first bundle or generate bundles automatically.
```