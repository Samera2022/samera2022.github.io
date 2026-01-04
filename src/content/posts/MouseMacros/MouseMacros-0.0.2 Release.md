---
title: MouseMacros-0.0.2 Release
published: 2025-07-06
description: MouseMacros Updates
tags: [Java]
category: Updates/MouseMacros
draft: false
---

[2025-07-06 22:51] 0.0.2

# [Added]
 - 添加配置文件功能
 - 添加设置界面
 - 添加"关于作者"功能按钮
 - 添加"更新日志"功能按钮

# [Changed]
 - 将自定义热键功能移入"设置"界面

# [Detailed]

## 关于配置文件功能
目前已添加以下可配置项：
(boolean)跟随系统设置，(boolean)启用深色模式，(String)切换语言，(String)默认鼠标宏存储地址，(未实装，不可用) (Map\<String,String\>)按键映射表，
注意："跟随系统设置"与("启用深色模式", "切换语言")存在上位关系。如果选择了"跟随系统设置"，那么后二者就不再接受用户更改，直接读取系统的相应设置。
