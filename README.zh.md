# OpenCode Go Usage

[![npm 版本](https://img.shields.io/npm/v/@lylyly149/dsh-opencode-go-usage.svg)](https://www.npmjs.com/package/@lylyly149/dsh-opencode-go-usage)
[![许可证](https://img.shields.io/npm/l/@lylyly149/dsh-opencode-go-usage.svg)](LICENSE)
[![CI](https://github.com/lylyly149/dsh-opencode-go-usage/actions/workflows/ci.yml/badge.svg)](https://github.com/lylyly149/dsh-opencode-go-usage/actions/workflows/ci.yml)

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 中查看
[OpenCode Go](https://opencode.ai/docs/go/) 套餐用量：输入框旁一个紧凑的
**270° 扇形**，以及 **设置 → OpenCode Go** 详情页，覆盖滚动 5 小时、每周和每月三个窗口。

![270° 扇形指示器预览](https://raw.githubusercontent.com/lylyly149/dsh-opencode-go-usage/main/docs/fan.png)

预览使用 75% / 35% / 10% 的示意数据，只用于展示弧长和颜色；实际数值来自官方接口。

## 功能

- **输入框指示器**：当前会话使用 `opencode-go` provider 时，在模型选择旁显示三个同心扇形弧。由外到内是滚动 5 小时、每周、每月；每个环保留 270°，底部裁掉 90°，按剩余额度顺时针填充。
- **按额度变色**：每个环和右侧数字在剩余 ≥50% 时为绿色，20–49% 为黄色，低于 20% 为红色。
- **最紧张窗口**：右侧数字取剩余最少的窗口并带短标签，例如 `84%（月）`。
- **设置页**：完整进度条、已用/剩余百分比、重置时间和刷新按钮；不依赖当前模型。
- **不可用提示**：Key 缺失、被拒绝或订阅失效时，输入框旁显示带原因的小警告标记，而不是直接消失。
- **日期跟随语言**：重置时间和相对倒计时跟随 DSH 界面语言，不再出现中文界面混英文日期。
- **中英文**：界面文案和插件管理元数据均提供中英文。
- **动态更新**：浏览器每 60 秒轮询，Host 缓存 30 秒；页面隐藏时暂停轮询，恢复时立即刷新；弧长和颜色带过渡动画。
- **Host 容错**：429/5xx 遵循 `Retry-After`；凭据引用变化时清缓存；非 loopback 的明文 HTTP 上游会被拒绝。

## 环境要求

- DeepSeek Harness `0.2.1-rc.1` 或更新版本（`engines.dsh`）。
- Host 上 Node.js 18 或更新版本。
- 有效的 OpenCode Go 订阅和 API Key。

已在 DSH `0.2.1-rc.3` + `desktop` profile 上测试。插件只使用公开的 Cordis 服务
（`webServer`、`credentials`）以及客户端 slot、locale 和模型目录 API。

## 安装

### 1. 安装包

```bash
dsh plugin --profile <profile> add @lylyly149/dsh-opencode-go-usage
```

或在 Desktop 中打开 **插件 → 添加插件**，输入
`@lylyly149/dsh-opencode-go-usage`。

本地目录安装：

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-opencode-go-usage
```

`<profile>` 通常是 Desktop 的 `desktop`，或 `dsh web` 的 `web`。CLI 会自动把包里的
`dsh.bundle.patch` 合并到 profile。

### 2. 保存 API Key

在 `~/.dsh/.credentials.yaml` 的 `refs` 下添加：

```yaml
refs:
  OPENCODE_GO_API_KEY: <你的 OpenCode Go API Key>
```

也可以通过 **设置 → 模型** 为 `opencode-go` provider 保存凭据。若 provider 使用不同的
引用名，在插件行里设置 `apiKeyEnv`：

```yaml
- id: opencode-go-usage
  config:
    apiKeyEnv: MY_OPENCODE_REF
```

插件先尝试 `apiKeyEnv`，再回退到 `OPENCODE_API_KEY`。

### 3. 重载

重启 `dsh web`（或 Desktop），刷新一次页面。输入框指示器只在当前会话的 provider 为
`opencode-go` 时出现；设置页始终可用。

## 配置

Host 导出了 Loader `Config` schema，配置会在激活时校验，并可用于 Loader/Plugin Manager 的配置界面；也可以直接改 profile 的 `cordis.patch.yml`：

| 字段 | 默认值 | 含义 |
|---|---|---|
| `apiKeyEnv` | `OPENCODE_GO_API_KEY` | 通过 `ctx.credentials` 解析的凭据引用；会回退尝试 `OPENCODE_API_KEY` |
| `usageUrl` | `https://opencode.ai/zen/go/v1/usage` | 上游额度接口；非 loopback 必须是 HTTPS |
| `cacheMs` | `30000` | Host 侧上游缓存时间（5–300 秒） |

```yaml
- id: opencode-go-usage
  config:
    apiKeyEnv: OPENCODE_GO_API_KEY
    cacheMs: 30000
```

## 工作原理

| 半区 | 作用 |
|---|---|
| Host（`index.js`） | 注册 `GET /plugins/dsh-opencode-go/usage`，通过 `ctx.credentials` 读取 Key，调用官方接口，归一化三个窗口并缓存 30 秒。 |
| 浏览器（`client.js`） | 手写的 `window.__ModuleLoader__.load` bundle，注册输入框指示器和设置页，每 60 秒轮询同源路由。 |

上游返回的 `percent` 是**已用**比例，界面显示剩余比例。`status: "rate-limited"`
的窗口按 0% 剩余渲染，设置页会标记“已触发限流”。

## 安全与隐私

- API Key 只存在于 Host 进程，不会下发到浏览器。
- 浏览器只访问同源路由；路由拒绝跨站请求，并返回 `cache-control: no-store`。
- 错误响应只包含固定原因码，不包含凭据或上游响应内容。
- 插件没有遥测、分析或第三方请求，只访问官方额度接口；Host 缓存仅在内存中。
- 非 loopback 的上游必须是 HTTPS，避免 Bearer Key 明文传输。
- 本仓库不包含 API Key、DSH profile、会话日志或用户路径；预览图使用示意数据。
- 发布工作流已为 npm Provenance / Trusted Publishing 做好准备；需要先在 npm 配置发布者再使用。当前版本为手动发布，provenance 适用于后续工作流发布。见 [SECURITY.md](SECURITY.md)。

## 失败行为

- Key 缺失/无效或无订阅：设置页说明原因，输入框旁显示警告标记和原因。
- 临时网络/上游失败：保留上次成功的数据，直到后续轮询成功。
- 429/5xx：Host 遵循 `Retry-After`（最长 1 小时），在退避窗口内直接返回缓存结果，并报告 `rate-limited` 或 `server-error`。
- 设置页的“刷新”会绕过 Host 缓存。

## 与其他插件的关系

npm 上另有一个独立的 `dsh-opencode-go-usage`（作者 `yumusb`），它提供侧边栏额度条、
`/opencode-go` 命令和会话头修复。本包不是它的 fork，重点不同：输入框旁的 270° 扇形和
设置页。两者路由不同，可以共存，但同时安装会出现两套额度界面；通常装一个即可。

## 开发

一个很小的运行时依赖（`@deepseek-ai/schemastery`，用于 Loader `Config`）、仅开发用的浏览器测试依赖，无构建步骤。

```bash
npm install
npm test          # 22 项：Host 路由、jsdom 真实组件、清单与隐私检查
npm pack --dry-run
```

测试包含 jsdom/react-dom 组件测试，覆盖 270° 扇形几何、颜色、设置页和不可用状态。CI 在 Node 20/22 上运行，并检查发布文件列表。

浏览器半区是手写 factory bundle（`window.__ModuleLoader__.load`），因为目前第三方客户端
插件没有公开构建流水线；只能 `require()` 壳层模块表里的模块（`react` 和已注册的客户端包）。

## 许可证

MIT，见 [LICENSE](LICENSE)。
