---
title: "#3 node unsupported engine when updating npm"
description: "When error occurs: “unsupported engine” while trying to update npm to 10.1. a solution is to use nvm"
publishDate: "25 October 2024"
updatedDate: "25 October 2024"
# coverImage:
#   src: "./cover.png"
#   alt: "Astro build wallpaper"
tags: ["npm", "Solutions"]
---

When error occurs: “unsupported engine” while trying to update npm to 10.1. a solution is to use nvm.

It does not solve the underlying problem in itself but it is a workaround.

With nvm it is possible to manage node versions on the system and easily install and use more then one node version in parallel.

1. [Installing nvm](https://github.com/nvm-sh/nvm/tree/master#installing-and-updating)

2. [Using nvm](https://github.com/nvm-sh/nvm/tree/master#usage)

3. [Installing oh-my-zsh-nvm plugin (when zsh is in use)](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/nvm)

A list of useful nvm commands:

Link: 
- [Gist d2S](https://gist.github.com/d2s/372b5943bce17b964a79)
- [Gist Chranderson](https://gist.github.com/chranderson/b0a02781c232f170db634b40c97ff455)

```js
nvm ls // list installed node versions
nvm ls-remote // list available node versions
nvm install 10.1 // install node version 10.1
nvm use 10.1 // use node version 10.1
nvm alias default 10.1 // set node version 10.1 as default
```

Done.