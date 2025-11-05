# PulseNebulaHub FHEVM Contracts

本目录基于 `@fhevm/hardhat-plugin` 搭建，提供 PulseNebulaHub 的同态加密合约与部署脚本。

## 快速开始

1. 安装依赖：

   ```bash
   pnpm install
   ```

2. 启动本地 FHEVM Hardhat 节点（参考根目录 `README.md`）并部署：

   ```bash
   pnpm deploy:localhost
   ```

3. 要部署至 Sepolia：

   ```bash
   export MNEMONIC="..."
   export INFURA_API_KEY="..."
   pnpm deploy:sepolia
   ```

## 目录结构

```
contracts/       # FHEVM 合约
deploy/          # hardhat-deploy 脚本
tasks/           # 自定义 Hardhat 任务
test/            # 测试用例
```

## PulseNebulaHub.sol

- 通过 `FHE.fromExternal` 接收加密脉搏均值，并以 `euint32` 持久化。
- `logPulseSample` 在写入样本同时更新公共统计的加密求和与计数。
- `grantSampleAccess` / `authorizeCollectivePulse` 控制解密权限。
- `collectivePulseHandles` 返回加密求和值与计数，前端可使用 FHEVM SDK 解密。

