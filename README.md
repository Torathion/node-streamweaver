# streamweaver

<p align="center">
<h1 align="center">Collection of revived old Node.JS stream utilities</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/streamweaver"><img src="https://img.shields.io/npm/v/streamweaver?style=for-the-badge&logo=npm"/></a>
  <a href="https://npmtrends.com/streamweaver"><img src="https://img.shields.io/npm/dm/streamweaver?style=for-the-badge"/></a>
  <a href="https://bundlephobia.com/package/streamweaver"><img src="https://img.shields.io/bundlephobia/minzip/streamweaver?style=for-the-badge"/></a>
  <a href="https://github.com/Torathion/streamweaver/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Torathion/streamweaver?style=for-the-badge"/></a>
  <a href="https://codecov.io/gh/torathion/streamweaver"><img src="https://codecov.io/gh/torathion/streamweaver/branch/main/graph/badge.svg?style=for-the-badge" /></a>
  <a href="https://github.com/torathion/streamweaver/actions"><img src="https://img.shields.io/github/actions/workflow/status/torathion/streamweaver/build.yml?style=for-the-badge&logo=esbuild"/></a>
<a href="https://github.com/prettier/prettier#readme"><img alt="code style" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge&logo=prettier"></a>
</p>
</p>

`streamweaver` is a collection of optimized, fixed and revived collection of old stream utilities. Currently, it includes:

- [`concat-stream`](https://www.npmjs.com/package/concat-stream) as `ConcatWriteStream` without the old polyfill dependencies
- [`progress-stream`](https://www.npmjs.com/package/progress-stream?activeTab=dependencies) as `ProgressStream` without obsolete [`through2`](https://www.npmjs.com/package/through2)
- [`throughput`](https://www.npmjs.com/package/throughput) as `throughput` with tests and micro-optimized algorithm
- [`single-line-log`](https://www.npmjs.com/package/single-line-log) as `singleLineLog` with extra optimizations

```powershell
    pnpm i streamweaver
```

This package is a "take what you need" package with tree-shakeable utilities. In the future, more old and abandoned stream packages will be added.

---

© Torathion 2025
