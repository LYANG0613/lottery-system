#!/usr/bin/env node
/**
 * 标准发布流程脚本
 *
 * 流程：本地构建验证 -> 提交 GitHub -> 等待 CI 完成 -> 检查结果
 *
 * 用法：
 *   node deploy.cjs                        # 使用自动生成的 commit message
 *   node deploy.cjs "fix: 修复按钮样式"    # 自定义 commit message
 *   node deploy.cjs --check-only          # 仅检查最近一次 CI 状态
 */

const https = require('https');
const { execSync, spawn } = require('child_process');
const path = require('path');

// Token: 可在 ~/.bashrc 中设置
//   export GITHUB_TOKEN=your_github_token_here
// 或直接在命令行: GITHUB_TOKEN=xxx node deploy.cjs
const TOKEN = process.env.GITHUB_TOKEN || '';
if (!TOKEN) {
  console.error('错误: 未设置 GITHUB_TOKEN 环境变量');
  console.error('请运行: export GITHUB_TOKEN=ghp_xxxx 或 GITHUB_TOKEN=ghp_xxxx node deploy.cjs');
  process.exit(1);
}
const REPO = 'LYANG0613/lottery-system';
const BRANCH = 'main';

// ── GitHub API ───────────────────────────────────────────────

function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'lottery-deploy',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => reject(new Error('API 请求超时')));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// ── 步骤 1: 本地构建验证 ───────────────────────────────────────

function stepLocalBuild() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  步骤 1/4  本地构建验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    console.log('  运行 npm run build ...');
    execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
    console.log('');
    console.log('  ✓ 本地构建成功，代码无类型错误');
    return true;
  } catch (err) {
    console.log('');
    console.error('  ✗ 本地构建失败！请修复类型错误后再试');
    process.exit(1);
  }
}

// ── 步骤 2: 提交 GitHub ─────────────────────────────────────────

function stepGitCommit(customMsg) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  步骤 2/4  提交 GitHub');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // 检查未提交文件
    const status = execSync('git status --porcelain').toString().trim();
    if (!status) {
      console.log('  没有检测到代码变更，无需提交');
      return null;
    }

    // 列出变更文件
    const files = status.split('\n').map(l => '    ' + l.trim()).join('\n');
    console.log('  变更文件:\n' + files);
    console.log('');

    // 生成 commit message
    const commitMsg = customMsg || generateCommitMessage();
    console.log(`  Commit: ${commitMsg}`);
    console.log('');

    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

    // Push
    console.log('  推送到 GitHub ...');
    execSync('git push origin ' + BRANCH, { stdio: 'inherit' });
    console.log('');
    console.log('  ✓ 代码已推送成功');
    console.log('  ✓ GitHub Actions 工作流已自动触发');
    return commitMsg;
  } catch (err) {
    console.error('');
    console.error('  ✗ 提交失败: ' + err.message);
    process.exit(1);
  }
}

function generateCommitMessage() {
  try {
    const diff = execSync('git diff --cached --stat').toString();
    const lines = diff.split('\n');
    const total = lines[lines.length - 1] || '';
    const match = total.match(/(\d+)\s+file/i);
    const count = match ? parseInt(match[1]) : 1;
    const date = new Date().toISOString().slice(0, 10);
    return `chore(${date}): update ${count} file${count > 1 ? 's' : ''}`;
  } catch {
    return 'chore: code updates';
  }
}

// ── 步骤 3: 等待 CI 完成 ───────────────────────────────────────

function stepWaitCI() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  步骤 3/4  等待 CI 完成（轮询中 ...）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  return new Promise((resolve, reject) => {
    const maxAttempts = 30;
    let attempt = 0;

    function poll() {
      attempt++;
      apiRequest('GET', `/repos/${REPO}/actions/runs?branch=${BRANCH}&per_page=1`)
        .then((result) => {
          if (result.status !== 200) {
            console.log(`  [${attempt}/${maxAttempts}] 查询失败 (${result.status})，重试中 ...`);
            return setTimeout(poll, 5000);
          }

          const runs = result.data.workflow_runs || [];
          if (runs.length === 0) {
            console.log(`  [${attempt}/${maxAttempts}] 未找到 CI 记录，重试中 ...`);
            return setTimeout(poll, 5000);
          }

          const run = runs[0];
          console.log(`  [${attempt}/${maxAttempts}] 状态: ${run.conclusion || run.status}`);
          console.log(`           分支: ${run.head_branch}`);
          console.log(`           Commit: ${run.head_sha.substring(0, 7)}`);
          console.log('');

          if (run.conclusion === 'success') {
            console.log('  ✓ CI 构建成功！');
            console.log(`  → 访问 https://LYANG0613.github.io/lottery-system/ 查看最新效果`);
            resolve(run);
          } else if (run.conclusion === 'failure') {
            console.log('  ✗ CI 构建失败！请查看日志:');
            console.log(`  → ${run.html_url}`);
            reject(new Error('CI 构建失败'));
          } else if (run.status === 'in_progress' || run.status === 'queued') {
            if (attempt >= maxAttempts) {
              console.log('  ⚠ 等待超时，请手动查看:');
              console.log(`  → ${run.html_url}`);
              resolve(run);
            } else {
              setTimeout(poll, 8000);
            }
          } else {
            console.log(`  当前状态: ${run.conclusion || run.status}，继续等待 ...`);
            setTimeout(poll, 5000);
          }
        })
        .catch((err) => {
          console.log(`  [${attempt}/${maxAttempts}] 网络错误，重试中 ...`);
          if (attempt < maxAttempts) {
            setTimeout(poll, 5000);
          } else {
            reject(err);
          }
        });
    }

    poll();
  });
}

// ── 步骤 4: 打印最终报告 ───────────────────────────────────────

function stepReport(run) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  步骤 4/4  发布完成报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  网站地址: https://LYANG0613.github.io/lottery-system/');
  console.log(`  CI 日志:  ${run ? run.html_url : '请手动查看 Actions 页面'}`);
  console.log('');
}

// ── 主入口 ───────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║       抽奖系统 - 标准发布流程             ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const customMsg = args.find(a => !a.startsWith('--'));

  // Step 1: 本地构建
  stepLocalBuild();

  if (!checkOnly) {
    // Step 2: 提交
    stepGitCommit(customMsg);
  } else {
    console.log('  [check-only 模式，跳过构建和提交]');
    console.log('');
  }

  // Step 3: 等待 CI
  try {
    const run = await stepWaitCI();
    // Step 4: 报告
    stepReport(run);
  } catch (err) {
    console.log('');
    console.log('  CI 检查失败或超时，详见上方日志');
    process.exit(1);
  }
}

main();
