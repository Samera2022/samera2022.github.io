---
title: MouseMacros-1.0.1 Release
published: 2025-12-27 23:16
description: MouseMacros Updates
tags: ["Java","Updates"]
category: Projects/MouseMacros
draft: false
---

::githubfile{repo="Samera2022/MouseMacros" file="README.md" description="Release 1.0.1"}

<div style="text-align: center;">

[2025-12-27 23:16] 1.0.1
[Click here to Release](www.github.com/Samera2022/MouseMacros/releases/tag/1.0.1)
</div>

## [Added]
 - 将窗体大小添加进cache.json，现在MouseMacros将能记忆你的每个窗体的大小。
 - 为Settings添加enable_default_storage的按钮，具体逻辑详见Description。
 - 配置了一键打包的脚本，现在的Release将会提供exe版本的程序下载。
 - 为settings.custom_hotkey界面的TextField添加了鼠标焦点提示。
 - 引入DeepWiki的docs来辅助代码理解。

## [Changed]
 - 修改为更加细致的README.md。
 - 文件结构略有修改，主要是lang文件移动到src下。

## [Description]
 - 当enable_default_storage为true时，在loadMacros和saveMacros时均只会采用config中的default_mmc_storage_path。且在FileChooser窗体中找到其他目录保存并不会修改cache.json中的lastSaveDirectory和lastLoadDirectory。
 - 当enable_default_storage为false时，在loadMacros和saveMacros时均只会采用cache.json中的lastSaveDirectory和lastLoadDirectory。当二者均为空时为默认目录，当二者其中一者为空时，在选择好文件夹（关闭FileChooser）后会默认将有值的数据复制到空的那一者。

## [Fixed]
 - 修复了1.0.0中settings.custom_hotkey的异常。

## [To-do]
 - 可能考虑切换UIManager的样式，当前的Metal样式较为简陋且缺乏较多的属性，可能会考虑切换至Nimbus、System或者第三方的FlatLightLaf。

## [Note]
 - 源代码大概其实只有1MB左右的大小，但是带上精简的运行环境就需要34.2MB了……
 - 有人可能会说，为什么1.0.0的软件包要2.84MB，而这一次的只要1.05MB了呢？是不是压缩水平提升了？啊其实不是啊，是因为我之前不小心把项目的根目录放进源代码目录里面了……在我编写EVB和Jpackage打包的时候才发现这一点，然后才改过来。
