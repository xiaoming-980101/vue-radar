# GitHub 自动部署到京东云 Nginx 端口

这份文档用于把任意静态前端项目接入“`git push` 后自动部署到京东云服务器指定端口”的流程。

适用场景：

- Vue / Vite / React / Next 静态导出等前端项目
- 构建产物在 `dist/`、`build/` 或类似目录
- 京东云服务器使用 Nginx 按端口托管静态站点
- 希望 `push main` 后自动构建、上传、备份、覆盖并 reload Nginx

当前 `vue-radar` 项目的线上示例：

```text
公网地址: http://111.228.44.255:7870
Nginx root: /var/www/vue-radar
Workflow: .github/workflows/deploy-jd.yml
```

## 一、整体流程

```text
git push origin main
        |
        v
GitHub Actions
        |
        |-- npm ci
        |-- npm run build
        |-- tar 打包 dist/
        |-- SSH 上传到京东云 /tmp
        |-- 服务器备份旧目录
        |-- 覆盖 Nginx root
        |-- nginx -t
        |-- nginx -s reload
        |-- curl smoke test
```

## 二、服务器准备

### 1. 确认 Nginx 已安装

在京东云服务器执行：

```bash
nginx -v
systemctl status nginx
```

如果没有安装，CentOS / Rocky / AlmaLinux 常见安装方式：

```bash
yum install -y nginx
systemctl enable nginx
systemctl start nginx
```

Ubuntu / Debian：

```bash
apt-get update
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2. 为项目创建发布目录

每个项目建议一个独立目录：

```bash
mkdir -p /var/www/your-project
```

示例：

```bash
mkdir -p /var/www/vue-radar
mkdir -p /var/www/price-ai
mkdir -p /var/www/demo-app
```

### 3. 为端口添加 Nginx 配置

示例：让 `7870` 端口服务 `/var/www/vue-radar`。

在 `/etc/nginx/conf.d/vue-radar.conf` 写入：

```nginx
server {
    listen 7870 default_server;
    listen [::]:7870 default_server;
    server_name _;

    root /var/www/vue-radar;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/vue-radar.access.log;
    error_log  /var/log/nginx/vue-radar.error.log;
}
```

检查并重载：

```bash
nginx -t
nginx -s reload
```

确认端口监听：

```bash
ss -ltnp | grep 7870
```

> 京东云安全组也要放行对应端口，例如 `7870/TCP`。

## 三、GitHub Secrets

进入 GitHub 仓库：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

最少需要：

```text
JD_SSH_PASSWORD=服务器 SSH 密码
```

推荐显式配置这些：

```text
JD_HOST=111.228.44.255
JD_PORT=22
JD_USER=root
JD_DEPLOY_PATH=/var/www/your-project
JD_PUBLIC_URL=http://111.228.44.255:7870
JD_HOST_FINGERPRINT=SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

说明：

| Secret | 作用 | 示例 |
| --- | --- | --- |
| `JD_SSH_PASSWORD` | SSH 密码 | 不要写进代码 |
| `JD_HOST` | 服务器 IP | `111.228.44.255` |
| `JD_PORT` | SSH 端口 | `22` |
| `JD_USER` | SSH 用户 | `root` |
| `JD_DEPLOY_PATH` | Nginx root 目录 | `/var/www/vue-radar` |
| `JD_PUBLIC_URL` | smoke test 地址 | `http://111.228.44.255:7870` |
| `JD_HOST_FINGERPRINT` | SSH 主机指纹 | `SHA256:...` |

### 获取 SSH 主机指纹

本地 PowerShell：

```powershell
ssh-keyscan -p 22 111.228.44.255 | ssh-keygen -lf - -E sha256
```

Linux / macOS：

```bash
ssh-keyscan -p 22 111.228.44.255 | ssh-keygen -lf - -E sha256
```

把输出里的 `SHA256:...` 填到 `JD_HOST_FINGERPRINT`。

## 四、通用 GitHub Actions 模板

在项目里创建：

```text
.github/workflows/deploy-jd.yml
```

内容如下：

```yaml
name: Deploy JD Cloud

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: deploy-jd-main
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      JD_HOST: ${{ secrets.JD_HOST }}
      JD_PORT: ${{ secrets.JD_PORT || '22' }}
      JD_USER: ${{ secrets.JD_USER || 'root' }}
      JD_DEPLOY_PATH: ${{ secrets.JD_DEPLOY_PATH }}
      JD_PUBLIC_URL: ${{ secrets.JD_PUBLIC_URL }}
      JD_HOST_FINGERPRINT: ${{ secrets.JD_HOST_FINGERPRINT }}
      SSHPASS: ${{ secrets.JD_SSH_PASSWORD }}
      BUILD_DIR: dist

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        shell: bash
        run: |
          set -euo pipefail

          for name in JD_HOST JD_PORT JD_USER JD_DEPLOY_PATH JD_PUBLIC_URL SSHPASS; do
            if [ -z "${!name:-}" ]; then
              echo "::error::$name is required"
              exit 1
            fi
          done

          test -d "$BUILD_DIR"
          test -f "$BUILD_DIR/index.html"

          sudo apt-get update
          sudo apt-get install -y sshpass

          mkdir -p ~/.ssh
          ssh-keyscan -p "$JD_PORT" "$JD_HOST" > ~/.ssh/known_hosts.new
          if [ -n "${JD_HOST_FINGERPRINT:-}" ]; then
            if ! ssh-keygen -lf ~/.ssh/known_hosts.new -E sha256 | awk '{print $2}' | grep -Fx "$JD_HOST_FINGERPRINT"; then
              echo "::error::Host key fingerprint mismatch"
              ssh-keygen -lf ~/.ssh/known_hosts.new -E sha256 || true
              exit 1
            fi
          fi
          mv ~/.ssh/known_hosts.new ~/.ssh/known_hosts

          archive="site-${GITHUB_SHA}.tgz"
          tar -C "$BUILD_DIR" -czf "$archive" .

          sshpass -e scp -P "$JD_PORT" -o StrictHostKeyChecking=yes "$archive" "$JD_USER@$JD_HOST:/tmp/$archive"

          sshpass -e ssh -p "$JD_PORT" -o StrictHostKeyChecking=yes "$JD_USER@$JD_HOST" \
            "DEPLOY_SHA='$GITHUB_SHA' DEPLOY_TARGET='$JD_DEPLOY_PATH' DEPLOY_ARCHIVE='/tmp/$archive' bash -s" <<'REMOTE'
          set -euo pipefail

          target="$DEPLOY_TARGET"
          archive="$DEPLOY_ARCHIVE"
          release="/tmp/site-release-$DEPLOY_SHA"
          backup="/var/backups/$(basename "$target")-$(date +%Y%m%d%H%M%S)"

          case "$target" in
            /var/www/*) ;;
            *)
              echo "Refuse to deploy outside /var/www: $target"
              exit 1
              ;;
          esac

          test -f "$archive"
          rm -rf "$release"
          mkdir -p "$release" /var/backups "$target"
          tar -xzf "$archive" -C "$release"
          test -f "$release/index.html"

          cp -a "$target" "$backup"
          find "$target" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
          cp -a "$release"/. "$target"/

          nginx -t
          nginx -s reload

          rm -rf "$release" "$archive"
          echo "Deployed $DEPLOY_SHA to $target"
          echo "Backup: $backup"
          REMOTE

      - name: Smoke test
        shell: bash
        run: |
          set -euo pipefail
          curl -fsS -o /tmp/site-index.html "$JD_PUBLIC_URL/index.html?sha=${GITHUB_SHA}"
          grep -q '<html' /tmp/site-index.html
```

## 五、不同项目怎么改

每个项目一般只需要改 Secrets，不需要改 workflow。

示例：

| 项目 | 端口 | Nginx root | `JD_PUBLIC_URL` | `JD_DEPLOY_PATH` |
| --- | --- | --- | --- | --- |
| vue-radar | 7870 | `/var/www/vue-radar` | `http://111.228.44.255:7870` | `/var/www/vue-radar` |
| price-ai | 7880 | `/var/www/price-ai` | `http://111.228.44.255:7880` | `/var/www/price-ai` |
| demo-app | 7890 | `/var/www/demo-app` | `http://111.228.44.255:7890` | `/var/www/demo-app` |

如果构建目录不是 `dist`，改 workflow 里的：

```yaml
BUILD_DIR: dist
```

例如 React 老项目可能是：

```yaml
BUILD_DIR: build
```

如果构建命令不是 `npm run build`，改：

```yaml
- name: Build
  run: npm run build
```

例如：

```yaml
run: npm run generate
```

## 六、自动数据更新后也部署

如果项目还有另一个 workflow 会自动提交数据，例如：

```yaml
name: Update Data
```

注意：GitHub Actions 用 `GITHUB_TOKEN` 自动提交代码时，通常不会再次触发 `push` workflow。

解决方式：在部署 workflow 里加 `workflow_run`：

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
  workflow_run:
    workflows:
      - Update Data
    types:
      - completed
```

并在 job 上加：

```yaml
if: github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'
```

这样“自动数据更新成功后”也会自动部署。

## 七、测试方式

### 1. 手动触发

GitHub 仓库：

```text
Actions -> Deploy JD Cloud -> Run workflow -> main
```

正常日志里应该看到：

```text
Build
Deploy
nginx: configuration file /etc/nginx/nginx.conf test is successful
Deployed <sha> to /var/www/your-project
Smoke test
```

### 2. push 触发

推送一个普通提交：

```bash
git add .
git commit -m "test deploy"
git push origin main
```

然后打开：

```text
http://服务器IP:端口/index.html?v=当前时间
```

加 `?v=` 是为了绕过浏览器缓存。

### 3. 服务器上验证

```bash
ls -la /var/www/your-project
grep -o 'assets/index-[^" ]*' /var/www/your-project/index.html
nginx -T | grep -n 'listen .*端口' -A5 -B5
```

## 八、回滚

部署时会备份旧目录：

```text
/var/backups/your-project-YYYYMMDDHHMMSS
```

回滚示例：

```bash
target=/var/www/your-project
backup=/var/backups/your-project-20260707100143

find "$target" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a "$backup"/. "$target"/
nginx -t
nginx -s reload
```

## 九、常见问题

### 1. `JD_SSH_PASSWORD is not configured`

说明 GitHub Secret 没配，或名字写错。

必须叫：

```text
JD_SSH_PASSWORD
```

### 2. `Host key fingerprint mismatch`

说明服务器 SSH 主机指纹和 Secret 里的 `JD_HOST_FINGERPRINT` 不一致。

先确认是不是服务器重装过，或者 IP 指向变了。确认无误后重新获取指纹并更新 Secret。

### 3. `curl: (23) Failure writing output to destination`

通常是把 `curl` 直接管道给 `grep -q` 导致的误报。

推荐写法：

```bash
curl -fsS -o /tmp/site-index.html "$JD_PUBLIC_URL/index.html?sha=${GITHUB_SHA}"
grep -q '<html' /tmp/site-index.html
```

### 4. 部署成功但浏览器还是旧页面

先加参数绕过缓存：

```text
http://服务器IP:端口/index.html?v=时间戳
```

再检查服务器文件：

```bash
head -30 /var/www/your-project/index.html
ls -la /var/www/your-project/assets
```

### 5. 端口打不开

检查三处：

```bash
ss -ltnp | grep 端口
nginx -T | grep -n 'listen .*端口' -A5 -B5
```

然后去京东云控制台检查安全组是否放行这个端口。

## 十、安全建议

- 不要把服务器密码写进仓库文件。
- `JD_SSH_PASSWORD` 只放 GitHub Secrets。
- 优先固定 `JD_HOST_FINGERPRINT`，避免连到错误服务器。
- 每个项目使用独立 `/var/www/<project>` 目录。
- workflow 里保留 `/var/www/*` 安全限制，避免变量错写导致覆盖系统目录。
- 重要项目建议改成 SSH key 登录，再禁用密码登录。
