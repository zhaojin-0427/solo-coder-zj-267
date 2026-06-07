#!/bin/bash

echo "======================================"
echo "  手工香薰蜡烛定制与配方管理系统"
echo "======================================"

echo ""
echo "[1/4] 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "后端依赖已存在，跳过"
fi

echo ""
echo "[2/4] 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "前端依赖已存在，跳过"
fi

echo ""
echo "[3/4] 启动后端服务 (端口 9502)..."
cd ../backend
npm run start &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

sleep 3

echo ""
echo "[4/4] 启动前端服务 (端口 9501)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

echo ""
echo "======================================"
echo "  系统已启动！"
echo "  前端: http://localhost:9501"
echo "  后端: http://localhost:9502"
echo "======================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; echo '已停止'; exit" INT

wait
