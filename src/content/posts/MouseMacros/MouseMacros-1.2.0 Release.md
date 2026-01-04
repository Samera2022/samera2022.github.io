---
title: MouseMacros-1.2.0 Release
published: 2026-01-02
description: MouseMacros Updates
tags: [Java]
category: Updates/MouseMacros
draft: false
---

[2026-01-02 19:03] 1.2.0

# [Added]
 - 为AboutDialog添加了Github跳转按钮。
 - 为SettingsDialog添加了readjustFrameMode选项。
 - 添加“建议窗体大小”功能。MouseMacros会在无cache的情况下尝试采用3:2的比例展示窗体。如果存在cache，那么在修改语言后MouseMacros处理“历史窗体大小”和“建议窗体大小”的过程中可以选择上一条中的三种模式。

# [Changed]
 - 修正了打包逻辑，在该版本之前打包的exe应当全部改名为MouseMacros.exe才能正常运行。
 - 修改exe的文件名会导致无法找到启动文件……因此不建议修改发布时的程序名。
 - 修改了SettingsDialog的主界面，使其更加有条理。


