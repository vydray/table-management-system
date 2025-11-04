package com.vydray.pos;

import android.os.Bundle;
import android.os.Handler;
import android.webkit.WebView;
import android.view.View;
import android.view.WindowManager;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int BLUETOOTH_PERMISSION_REQUEST_CODE = 100;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SiiPrinterPlugin.class);
        super.onCreate(savedInstanceState);

        // Bluetooth権限をリクエスト（Android 12以降）
        requestBluetoothPermissions();

        // システムUIを正しく設定
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );

        // ステータスバーとナビゲーションバーを考慮したレイアウト
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        // Force WebView to render properly on initial load
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

                    // IME（入力メソッド）を有効化
                    webView.setFocusable(true);
                    webView.setFocusableInTouchMode(true);

                    webView.requestLayout();
                    webView.invalidate();

                    // 強制的に再描画（さらに遅延を追加）
                    webView.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            webView.requestLayout();
                            webView.invalidate();
                        }
                    }, 300);
                }
            }
        }, 500);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Force layout refresh when app resumes
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.requestLayout();
            webView.invalidate();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // ウィンドウがフォーカスを取得したときにWebViewを再描画
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.requestLayout();
            }
        }
    }

    // Bluetooth権限をリクエスト
    private void requestBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12以降
            String[] permissions = {
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.ACCESS_FINE_LOCATION
            };

            boolean allGranted = true;
            for (String permission : permissions) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (!allGranted) {
                ActivityCompat.requestPermissions(this, permissions, BLUETOOTH_PERMISSION_REQUEST_CODE);
            }
        } else {
            // Android 11以前
            String[] permissions = {
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.ACCESS_FINE_LOCATION
            };

            boolean allGranted = true;
            for (String permission : permissions) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (!allGranted) {
                ActivityCompat.requestPermissions(this, permissions, BLUETOOTH_PERMISSION_REQUEST_CODE);
            }
        }
    }
}