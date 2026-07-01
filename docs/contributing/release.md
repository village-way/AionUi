# Release 发布流程

本文档说明如何通过 GitHub Actions 发布开发版和正式版到 GitHub Releases。

## 关键原则

发布必须通过 `push` 事件触发 `.github/workflows/build-and-release.yml`：

- 推送 `dev` 分支发布开发版。
- 推送正式 tag 发布正式版，例如 `v2.1.26`。
- 不使用 `workflow_dispatch` 作为发布入口。

本仓库要求 `origin` 的 push URL 使用 SSH：

```bash
git remote set-url --push origin git@github.com:village-way/AionUi.git
```

原因：在本仓库验证中，HTTPS push 使用 GitHub CLI OAuth token 时，GitHub 接受了 tag push，但没有创建 `push` 事件的 Actions run；同一 tag 使用 SSH push 后立即触发了 `Build and Release`。因此发布前必须确认 SSH 能认证到 `village-way`：

```bash
ssh -T git@github.com
git remote -v
```

期望输出中包含：

```text
Hi village-way! You've successfully authenticated
origin  git@github.com:village-way/AionUi.git (push)
```

## 发布前检查

确认仓库状态：

```bash
git status --short --branch
git remote -v
node -p "require('./package.json').version"
```

GitHub Actions 发布依赖这些 repository secrets：

- `GH_TOKEN`
- `BUILD_CERTIFICATE_BASE64`
- `P12_PASSWORD`
- `KEYCHAIN_PASSWORD`
- `APPLE_ID`
- `APPLE_ID_PASSWORD`
- `TEAM_ID`
- `IDENTITY`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

如果发布后还要同步正式版资产到 S3，还需要：

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `AWS_S3_BUCKET`

## 开发版发布

开发版通过推送 `dev` 分支触发：

```bash
git checkout dev
git pull --rebase origin dev
git push origin dev
```

workflow 会执行：

1. 运行 code quality checks。
2. 构建 macOS、Windows、Linux 桌面安装包。
3. 打包 web-cli。
4. 自动创建开发版 tag：

```text
v<package.json version>-dev-<commit>
```

5. 创建 GitHub Release 草稿，并标记为 prerelease。

例如 `package.json` 版本为 `2.1.26`，提交为 `abc1234`，开发版 tag 为：

```text
v2.1.26-dev-abc1234
```

## 正式版发布

正式版通过推送正式 tag 触发：

```bash
git checkout main
git pull --rebase origin main
git tag v2.1.26
git push origin v2.1.26
```

触发后在 GitHub Actions 页面确认 `Build and Release` 出现新的 run：

- `event` 为 `push`
- `headBranch` 为正式 tag，例如 `v2.1.26`
- `headSha` 为 tag 指向的 commit

workflow 会创建 GitHub Release 草稿，上传桌面安装包、updater metadata、web-cli tarball、checksum 和 `install-web.sh`。

当前 workflow 设置了 `draft: true`。构建完成后，需要在 GitHub Releases 页面检查草稿内容和资产；确认无误后再发布公开 release。

## 重发正式 tag

如果正式 tag 已经存在，但指向了错误 commit，需要先删除远端 tag，再重新推送。

确认目标 commit：

```bash
git rev-parse HEAD
git show --no-patch --format='%H %s' HEAD
```

删除远端 tag，并重新创建：

```bash
git push origin :refs/tags/v2.1.26
git tag -f v2.1.26 HEAD
git push origin v2.1.26
```

如果需要 annotated tag：

```bash
git push origin :refs/tags/v2.1.26
git tag -d v2.1.26
git tag -a v2.1.26 -m "v2.1.26" HEAD
git push origin v2.1.26
```

重发后必须确认新的 Actions run 是 `event=push`，而不是手动触发。

## 排障

### tag push 成功但没有 Actions run

先确认 push URL 是否为 SSH：

```bash
git remote -v
```

如果 `origin` 的 push URL 是 HTTPS，改成 SSH：

```bash
git remote set-url --push origin git@github.com:village-way/AionUi.git
```

用无害的 `-dev-` 临时 tag 验证 push 触发。包含 `-dev-` 的 tag 会匹配 workflow，但构建 job 会被条件跳过，不会发布正式版：

```bash
TEST_TAG="trigger-test-dev-$(date +%Y%m%d%H%M%S)-dev-$(git rev-parse --short HEAD)"
git tag "$TEST_TAG" HEAD
git push origin "$TEST_TAG"
gh run list --repo village-way/AionUi --workflow "Build and Release" --limit 5
git push origin ":refs/tags/$TEST_TAG"
git tag -d "$TEST_TAG"
```

期望看到新的 run：

```text
event: push
headBranch: trigger-test-dev-...
conclusion: skipped
```

### release 没有同步到 S3

`release-distribute.yml` 只在 GitHub Release 被发布后触发，并且自动跳过 prerelease。正式 release 从 draft 发布为 public 后，才会同步资产到 S3。

如果需要重跑同步，可以手动运行 `Distribute Release Assets`，输入已有正式 tag。
