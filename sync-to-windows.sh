#!/bin/bash

echo "🔄 WSL2 → Windows 同期開始..."
echo ""

# WSL2のプロジェクトパス
WSL_PATH="/home/kawauso/Documents/table-management-system"

# WindowsのプロジェクトパスをWSL2から見たパス
WIN_PATH="/mnt/c/Users/kawau/Documents/table-management-system"

# Windows側のディレクトリが存在しない場合は作成
if [ ! -d "$WIN_PATH" ]; then
  echo "📁 Windows側のディレクトリを作成中..."
  mkdir -p "$WIN_PATH"
fi

# rsyncで同期（高速・差分のみコピー）
echo "📦 ファイルを同期中..."
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'android/.gradle' \
  --exclude 'android/build' \
  --exclude 'android/app/build' \
  --exclude 'android/capacitor-cordova-android-plugins/build' \
  --exclude '.gradle' \
  --exclude 'out' \
  "$WSL_PATH/" "$WIN_PATH/"

echo ""
echo "✅ 同期完了！"
echo ""
echo "📱 次のステップ："
echo "   1. Android Studioで以下のパスを開く："
echo "      C:\\Users\\kawau\\Documents\\table-management-system\\android"
echo ""
echo "   2. Gradle Syncを待つ（画面下部を確認）"
echo ""
echo "   3. Android端末をUSB接続"
echo ""
echo "   4. ▶️ボタンでAPKビルド＆インストール"
echo ""